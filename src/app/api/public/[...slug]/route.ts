import { NextRequest, NextResponse } from 'next/server';

function buildForwardHeaders(req: NextRequest): Record<string, string> {
  // Extract verified client IP from Netlify edge or proxy chain
  const clientIp =
    req.headers.get('x-nf-client-connection-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    '';

  const forwardHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (clientIp) {
    forwardHeaders['X-Laurrel-Client-IP'] = clientIp;
    forwardHeaders['X-Forwarded-For'] = req.headers.get('x-forwarded-for') || clientIp;
  }

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
  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const path = params.slug.join('/');
  const search = req.nextUrl.search;
  const target = `${backendUrl.replace(/\/$/, '')}/api/public/${path}${search}`;

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
      data = { success: false, error: 'Administrative service returned an unformatted response.' };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[Public Gateway Error] GET to backend at ${target}:`, err.message);
    return NextResponse.json(
      { success: false, error: 'Appointment scheduling service is temporarily unreachable. Please try again shortly.' },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const path = params.slug.join('/');
  const target = `${backendUrl.replace(/\/$/, '')}/api/public/${path}`;

  try {
    const body = await req.json().catch(() => ({}));
    const forwardHeaders = buildForwardHeaders(req);

    const res = await fetch(target, {
      method: 'POST',
      headers: forwardHeaders,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { success: false, error: 'Administrative service returned an unformatted response.' };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[Public Gateway Error] POST to backend at ${target}:`, err.message);
    return NextResponse.json(
      { success: false, error: 'Appointment scheduling service is temporarily unreachable. Please try again.' },
      { status: 503 }
    );
  }
}
