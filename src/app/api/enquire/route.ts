import { NextResponse } from 'next/server';
import { EnquiryPayload, ServiceCategory } from '@/lib/types/enquiry';
import { validateEnquiry } from '@/lib/validation/enquiry';

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

    // 3. Forward to Render Backend API
    const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL;

    if (backendUrl) {
      try {
        const target = `${backendUrl.replace(/\/$/, '')}/api/enquire`;
        const res = await fetch(target, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': ip,
          },
          body: JSON.stringify(rawBody),
        });

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (forwardErr: any) {
        console.error('[Enquiry Gateway Error] Backend API unreachable:', forwardErr.message);
        // Do NOT silently fall back to local JSON-file persistence.
        // Return an accurate temporary error so the user is informed and can retry.
        return NextResponse.json(
          {
            error: 'Our enquiry dispatch service is temporarily unavailable. Your details were preserved — please retry in a few moments or call us directly.',
            code: 'BACKEND_UNAVAILABLE',
          },
          { status: 503 }
        );
      }
    }

    // If backend URL is not configured in production, reject rather than silent ephemeral file write
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          error: 'Enquiry processing service is not configured. Please contact support.',
          code: 'SERVICE_UNCONFIGURED',
        },
        { status: 503 }
      );
    }

    // In local development only (no backend URL configured): import local db helper
    const { createEnquiryRecord } = await import('@/lib/db/enquiries');
    const record = await createEnquiryRecord(rawBody as EnquiryPayload);

    return NextResponse.json({
      success: true,
      delivered: false,
      referenceId: record.id,
      message: 'Your enquiry has been received (Local Development Mode).',
    });
  } catch (error) {
    console.error('[Enquiry API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
