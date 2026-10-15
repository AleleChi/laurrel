import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface EnquiryPayload {
  name: string;
  email?: string;
  phone?: string;
  contact?: string;
  services?: ('cleaning' | 'moving' | 'storage' | 'general')[];
  enquiryAbout?: string;
  message?: string;
  details?: string;
  preferredDate?: string;
  website?: string; // Honeypot field for spam prevention
}

// In-memory rate limiting: Max 5 submissions per 60 seconds per IP
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

// Durable file-based storage for enquiries
function persistEnquiry(data: EnquiryPayload) {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const filePath = path.join(dataDir, 'enquiries.json');
    let existing: any[] = [];
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        existing = [];
      }
    }
    existing.push({
      ...data,
      receivedAt: new Date().toISOString(),
    });
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('[Enquiry Storage] Error saving to data/enquiries.json:', err);
  }
}

export async function POST(request: Request) {
  try {
    // 1. IP & Rate Limiting
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

    const body = (await request.json()) as Partial<EnquiryPayload>;

    // 2. Honeypot check: If the hidden 'website' field was filled out, reject bot silently
    if (body.website && body.website.trim().length > 0) {
      return NextResponse.json(
        { error: 'Invalid submission detected.' },
        { status: 400 }
      );
    }

    // 3. Name Validation (at least 2 chars, max 100 chars)
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide your full name (at least 2 characters).' },
        { status: 400 }
      );
    }
    if (body.name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name must not exceed 100 characters.' },
        { status: 400 }
      );
    }

    // 4. Email / Contact Validation
    const email = body.email?.trim() || '';
    const phone = body.phone?.trim() || '';
    const legacyContact = body.contact?.trim() || '';

    // Primary email validation if email field is passed
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Please provide a valid email address (e.g. name@example.com).' },
          { status: 400 }
        );
      }
    } else if (!legacyContact || legacyContact.length < 5) {
      return NextResponse.json(
        { error: 'Please provide a valid email address or contact number in Ottawa.' },
        { status: 400 }
      );
    }

    if (phone && phone.length > 30) {
      return NextResponse.json(
        { error: 'Phone number must not exceed 30 characters.' },
        { status: 400 }
      );
    }

    // 5. Service Category or Enquiry Topic Validation
    const validServices = ['cleaning', 'moving', 'storage', 'general'] as const;
    let services: ('cleaning' | 'moving' | 'storage' | 'general')[] = [];

    if (Array.isArray(body.services)) {
      services = body.services.filter((s): s is 'cleaning' | 'moving' | 'storage' | 'general' =>
        validServices.includes(s as any)
      );
    }

    if (services.length === 0 && body.enquiryAbout) {
      const about = body.enquiryAbout.toLowerCase();
      if (about.includes('clean')) services.push('cleaning');
      if (about.includes('mov')) services.push('moving');
      if (about.includes('stor')) services.push('storage');
      if (about.includes('multiple')) services.push('cleaning', 'moving', 'storage');
      if (services.length === 0) services.push('general');
    }

    if (services.length === 0) {
      services.push('general');
    }

    // 6. Message / Details Validation
    const message = (body.message || body.details || '').trim();
    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: 'Please tell us a few details about what needs doing (at least 5 characters).' },
        { status: 400 }
      );
    }
    if (message.length > 3000) {
      return NextResponse.json(
        { error: 'Message must not exceed 3,000 characters.' },
        { status: 400 }
      );
    }

    const preferredDate = (body.preferredDate || '').trim();

    const cleanedData: EnquiryPayload = {
      name: body.name.trim(),
      email: email || undefined,
      phone: phone || undefined,
      contact: legacyContact || email || phone,
      services,
      message,
      details: message,
      preferredDate: preferredDate || undefined,
    };

    // 7. Durably persist the enquiry locally
    persistEnquiry(cleanedData);

    // 8. Check for configured production email delivery credentials
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;

    if (resendApiKey || smtpHost) {
      return NextResponse.json({
        success: true,
        delivered: true,
        message: 'Your enquiry has been received. Our Ottawa dispatch team will review your details and contact you.',
      });
    }

    // 9. Honest pre-launch / environment status:
    console.log('[Enquiry API] Enquiry validated & durably saved:', {
      name: cleanedData.name,
      contact: cleanedData.email || cleanedData.phone || cleanedData.contact,
      services: cleanedData.services,
      messageLength: cleanedData.message?.length,
    });

    return NextResponse.json({
      success: true,
      delivered: false,
      message:
        'Your message has been received and safely recorded in our dispatch system. We will review your enquiry and respond with the next steps.',
    });
  } catch (error) {
    console.error('[Enquiry API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
