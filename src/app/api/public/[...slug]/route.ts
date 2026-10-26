import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/api/backendUrl';

function buildForwardHeaders(req: NextRequest): Record<string, string> {
  // Only extract verified platform-provided client identity:
  // 1. Netlify cryptographically-verified edge client IP (x-nf-client-connection-ip)
  // 2. Next.js connection socket IP (req.ip)
  // NEVER read raw client-supplied X-Real-IP or X-Forwarded-For headers from external requests.
  // Stamping trusted gateway secret onto arbitrary client-supplied IP headers would create a rate-limit bypass vulnerability.
  const clientIp = (
    req.headers.get('x-nf-client-connection-ip') ||
    req.ip ||
    ''
  ).trim();

  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (clientIp) {
    forwardHeaders['X-Laurrel-Client-IP'] = clientIp;
  }

  // Use dedicated INTERNAL_GATEWAY_SECRET distinct from admin authentication secret
  const gatewaySecret = process.env.INTERNAL_GATEWAY_SECRET || process.env.GATEWAY_SECRET;
  if (gatewaySecret) {
    forwardHeaders['X-Gateway-Secret'] = gatewaySecret;
  }

  const idempKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
  if (idempKey) {
    forwardHeaders['Idempotency-Key'] = idempKey;
  }

  return forwardHeaders;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  let backendUrl: string;
  try {
    backendUrl = getBackendApiUrl();
  } catch (urlErr: any) {
    return NextResponse.json(
      { success: false, error: urlErr.message, code: 'PRODUCTION_FALLBACK_BLOCKED' },
      { status: 503 }
    );
  }

  const path = params.slug.join('/');
  const search = req.nextUrl.search;
  const target = `${backendUrl}/api/public/${path}${search}`;

  try {
    const forwardHeaders = buildForwardHeaders(req);
    const res = await fetch(target, {
      cache: 'no-store',
      headers: forwardHeaders,
    });

    const contentType = res.headers.get('content-type') || '';

    // Handle iCalendar (.ics) download streaming
    if (contentType.includes('text/calendar')) {
      const text = await res.text();
      return new NextResponse(text, {
        status: res.status,
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': res.headers.get('content-disposition') || 'attachment; filename="consultation.ics"',
        },
      });
    }

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error(
        `[Public Gateway Diagnostic] Backend returned non-JSON response (status: ${res.status}, content-type: ${contentType}):`,
        text.slice(0, 300)
      );
      return NextResponse.json(
        {
          success: false,
          error: "We couldn't load the available times. Please try again.",
          serviceUnavailable: true,
          status: res.status,
        },
        { status: res.status >= 400 ? res.status : 503 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[Public Gateway Error] GET to backend at ${target}:`, err.message);
    return NextResponse.json(
      { success: false, error: "We couldn't load the available times. Please try again.", serviceUnavailable: true },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  let backendUrl: string;
  try {
    backendUrl = getBackendApiUrl();
  } catch (urlErr: any) {
    return NextResponse.json(
      { success: false, error: urlErr.message, code: 'PRODUCTION_FALLBACK_BLOCKED' },
      { status: 503 }
    );
  }

  const path = params.slug.join('/');
  const target = `${backendUrl}/api/public/${path}`;

  try {
    const body = await req.json().catch(() => ({}));
    const forwardHeaders = buildForwardHeaders(req);

    const res = await fetch(target, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      console.error(
        `[Public Gateway Diagnostic] POST backend returned non-JSON response (status: ${res.status}, content-type: ${contentType}):`,
        text.slice(0, 300)
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment scheduling service is temporarily unreachable. Please try again.',
          serviceUnavailable: true,
          status: res.status,
        },
        { status: res.status >= 400 ? res.status : 503 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[Public Gateway Error] POST to backend at ${target}:`, err.message);
    return NextResponse.json(
      { success: false, error: 'Appointment scheduling service is temporarily unreachable. Please try again.', serviceUnavailable: true },
      { status: 503 }
    );
  }
}
