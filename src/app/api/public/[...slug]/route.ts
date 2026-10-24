import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const path = params.slug.join('/');
  const search = req.nextUrl.search;
  const target = `${backendUrl.replace(/\/$/, '')}/api/public/${path}${search}`;

  try {
    const res = await fetch(target, {
      cache: 'no-store',
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
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const idempKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
    if (idempKey) {
      forwardHeaders['Idempotency-Key'] = idempKey;
    }

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
