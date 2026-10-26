import { NextResponse } from 'next/server';
import { EnquiryPayload, ServiceCategory } from '@/lib/types/enquiry';
import { validateEnquiry } from '@/lib/validation/enquiry';
import { getBackendApiUrl } from '@/lib/api/backendUrl';

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
      'unknown';

    if (ip !== 'unknown' && isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment before submitting another enquiry.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // 2. Parse & Validate Payload
    const rawBody = await request.json();

    // Map intent to serviceCategory if needed for backwards compatibility
    if (rawBody.intent && !rawBody.serviceCategory) {
      rawBody.serviceCategory = rawBody.intent;
    }

    // Normalize location object if simple location string provided
    if (typeof rawBody.location === 'string') {
      rawBody.location = {
        city: rawBody.location,
        serviceArea: rawBody.location,
      };
    }

    // Handle legacy date strings
    if (rawBody.timeline && typeof rawBody.timeline === 'string') {
      rawBody.timeline = {
        urgency: 'flexible',
        targetDate: rawBody.timeline,
      };
    }

    const validation = validateEnquiry(rawBody);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 3. Forward to Render Backend API
    let backendUrl: string | null = null;
    try {
      backendUrl = getBackendApiUrl();
    } catch (urlErr: any) {
      return NextResponse.json(
        { error: urlErr.message, code: 'PRODUCTION_FALLBACK_BLOCKED' },
        { status: 503 }
      );
    }

    if (backendUrl) {
      try {
        const target = `${backendUrl}/api/enquire`;
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
