import { NextResponse } from 'next/server';
import { EnquiryPayload, ServiceCategory } from '@/lib/types/enquiry';
import { validateEnquiry } from '@/lib/validation/enquiry';
import { createEnquiryRecord } from '@/lib/db/enquiries';

// In-memory sliding window rate limiting: Max 5 submissions per 60 seconds per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (record.count >= 5) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(request: Request) {
  try {
    // 1. IP extraction & Rate Limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown-ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions from this connection. Please wait a minute before trying again.' },
        { status: 429 }
      );
    }

    const rawBody = (await request.json()) as Partial<EnquiryPayload>;

    // Handle legacy contact field fallback if email was not directly provided
    if (!rawBody.email && rawBody.name && (rawBody as any).contact) {
      const contactVal = ((rawBody as any).contact as string).trim();
      if (contactVal.includes('@')) {
        rawBody.email = contactVal;
      }
    }

    // Handle legacy enquiryAbout field mapping to services array if services was empty
    if ((!rawBody.services || rawBody.services.length === 0) && rawBody.enquiryAbout) {
      const about = rawBody.enquiryAbout.toLowerCase();
      const mapped: ServiceCategory[] = [];
      if (about.includes('clean')) mapped.push('cleaning');
      if (about.includes('mov')) mapped.push('moving');
      if (about.includes('stor')) mapped.push('storage');
      if (about.includes('multiple')) mapped.push('cleaning', 'moving', 'storage');
      if (mapped.length > 0) {
        rawBody.services = mapped;
      }
    }

    // 2. Validate payload using shared validation module
    const validation = validateEnquiry(rawBody);
    if (!validation.isValid) {
      const firstErrorMessage = Object.values(validation.errors)[0] || 'Invalid submission.';
      return NextResponse.json(
        { error: firstErrorMessage, errors: validation.errors },
        { status: 400 }
      );
    }

    // 3. Durably persist structured record
    const record = await createEnquiryRecord(rawBody as EnquiryPayload);

    // 4. Email delivery via Resend API if configured
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.DISPATCH_EMAIL_TO || 'info@laurrelservices.ca';
    let emailDelivered = false;

    if (resendApiKey) {
      try {
        const servicesLabel = record.services.map((s) => s.toUpperCase()).join(', ');
        const detailsHtml = `
          <h2>New Laurrel Services Customer Enquiry</h2>
          <p><strong>Reference ID:</strong> ${record.id}</p>
          <p><strong>Intent:</strong> ${record.intent}</p>
          <p><strong>Source:</strong> ${record.source}</p>
          <hr />
          <p><strong>Customer Name:</strong> ${record.customer.name}</p>
          <p><strong>Email:</strong> ${record.customer.email}</p>
          <p><strong>Phone:</strong> ${record.customer.phone || 'Not provided'}</p>
          <p><strong>Services:</strong> ${servicesLabel}</p>
          <p><strong>Location / Postal Code:</strong> ${record.serviceLocation || 'Not provided'}</p>
          <p><strong>Preferred Timing:</strong> ${record.preferredTiming || 'Not provided'}</p>
          <p><strong>Job Details:</strong></p>
          <p style="white-space: pre-line; background: #f8f8f8; padding: 12px; border-radius: 8px;">${record.details}</p>
          ${
            record.serviceSpecificDetails?.cleaning
              ? `<h3>Cleaning Specifics</h3>
                 <p>Type: ${record.serviceSpecificDetails.cleaning.propertyType || 'N/A'}</p>
                 <p>Size: ${record.serviceSpecificDetails.cleaning.propertySize || 'N/A'}</p>
                 <p>Requirements: ${record.serviceSpecificDetails.cleaning.cleaningRequirements || 'N/A'}</p>`
              : ''
          }
          ${
            record.serviceSpecificDetails?.moving
              ? `<h3>Moving Specifics</h3>
                 <p>From: ${record.serviceSpecificDetails.moving.movingFrom || 'N/A'}</p>
                 <p>To: ${record.serviceSpecificDetails.moving.movingTo || 'N/A'}</p>
                 <p>Belongings: ${record.serviceSpecificDetails.moving.belongingsSize || 'N/A'}</p>
                 <p>Access: ${record.serviceSpecificDetails.moving.accessConsiderations || 'N/A'}</p>`
              : ''
          }
          ${
            record.serviceSpecificDetails?.storage
              ? `<h3>Storage Specifics</h3>
                 <p>Duration: ${record.serviceSpecificDetails.storage.storageDuration || 'N/A'}</p>
                 <p>Items: ${record.serviceSpecificDetails.storage.storageItemsType || 'N/A'}</p>
                 <p>Access: ${record.serviceSpecificDetails.storage.accessRequirements || 'N/A'}</p>`
              : ''
          }
          <hr />
          <p style="color: #666; font-size: 11px;">Recorded at ${record.createdAt} by Laurrel Dispatch System.</p>
        `;

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Laurrel Enquiries <notifications@laurrelservices.ca>',
            to: recipientEmail,
            subject: `[Laurrel Enquiry - ${record.id}] ${servicesLabel} - ${record.customer.name}`,
            html: detailsHtml,
          }),
        });

        if (res.ok) {
          emailDelivered = true;
        }
      } catch (deliveryErr) {
        // Fallback to durable record
      }
    }

    // 5. Audit log without exposing PII to public/standard consoles
    console.log('[Enquiry API] Enquiry processed and durably saved:', {
      referenceId: record.id,
      intent: record.intent,
      source: record.source,
      services: record.services,
      hasPhone: Boolean(record.customer.phone),
      emailDelivered,
    });

    const successMessage =
      record.intent === 'quote_request'
        ? `Your quote request has been received (Ref: ${record.id}). Our Ottawa team will review your requirements and follow up with you promptly.`
        : `Your enquiry has been received (Ref: ${record.id}). We will review your details and respond with the next steps.`;

    return NextResponse.json({
      success: true,
      delivered: emailDelivered,
      referenceId: record.id,
      message: successMessage,
    });
  } catch (error) {
    console.error('[Enquiry API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
