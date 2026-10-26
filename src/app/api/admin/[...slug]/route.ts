import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth/session';
import { getBackendApiUrl } from '@/lib/api/backendUrl';

async function safeParseBackendResponse(res: Response): Promise<{ data: any; status: number }> {
  const text = await res.text();
  if (!text || text.trim() === '') {
    return { data: { success: res.ok }, status: res.status };
  }
  try {
    const data = JSON.parse(text);
    return { data, status: res.status };
  } catch {
    console.error(`[Admin Gateway Error] Non-JSON backend response (HTTP ${res.status}):`, text.slice(0, 500));
    return {
      data: {
        success: false,
        error: res.ok
          ? 'Administrative service returned an unformatted response.'
          : 'Administrative backend service is temporarily unavailable. Please retry shortly.',
      },
      status: res.status,
    };
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const session = getAdminSessionFromRequest(req);

  if (!session?.sessionId) {
    return NextResponse.json(
      { error: 'Unauthorized: Active administrator session required.' },
      { status: 401 }
    );
  }

  let backendUrl: string;
  try {
    backendUrl = getBackendApiUrl();
  } catch (urlErr: any) {
    return NextResponse.json(
      { error: urlErr.message, code: 'PRODUCTION_FALLBACK_BLOCKED' },
      { status: 503 }
    );
  }

  const secret = process.env.ADMIN_API_SECRET;
  const path = params.slug.join('/');
  const search = req.nextUrl.search;
  const target = `${backendUrl}/api/admin/${path}${search}`;

  try {
    const res = await fetch(target, {
      headers: {
        ...(secret ? { 'x-admin-token': secret } : {}),
        'x-admin-session-id': session.sessionId,
      },
      cache: 'no-store',
    });

    const { data, status } = await safeParseBackendResponse(res);
    return NextResponse.json(data, { status });
  } catch (err: any) {
    console.error(`[Admin Gateway Error] Failed to reach backend at ${target}:`, err.message);
    return NextResponse.json(
      { error: 'Backend administrative service is unreachable. Please verify server status.' },
      { status: 503 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const session = getAdminSessionFromRequest(req);

  if (!session?.sessionId) {
    return NextResponse.json(
      { error: 'Unauthorized: Active administrator session required.' },
      { status: 401 }
    );
  }

  let backendUrl: string;
  try {
    backendUrl = getBackendApiUrl();
  } catch (urlErr: any) {
    return NextResponse.json(
      { error: urlErr.message, code: 'PRODUCTION_FALLBACK_BLOCKED' },
      { status: 503 }
    );
  }

  const secret = process.env.ADMIN_API_SECRET;
  const path = params.slug.join('/');
  const target = `${backendUrl}/api/admin/${path}`;

  try {
    const body = await req.json();

    const res = await fetch(target, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-admin-token': secret } : {}),
        'x-admin-session-id': session.sessionId,
      },
      body: JSON.stringify(body),
    });

    const { data, status } = await safeParseBackendResponse(res);
    return NextResponse.json(data, { status });
  } catch (err: any) {
    console.error(`[Admin Gateway Error] Failed PATCH to backend at ${target}:`, err.message);
    return NextResponse.json(
      { error: 'Backend administrative service is unreachable. Status update failed.' },
      { status: 503 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const session = getAdminSessionFromRequest(req);

  if (!session?.sessionId) {
    return NextResponse.json(
      { error: 'Unauthorized: Active administrator session required.' },
      { status: 401 }
    );
  }

  let backendUrl: string;
  try {
    backendUrl = getBackendApiUrl();
  } catch (urlErr: any) {
    return NextResponse.json(
      { error: urlErr.message, code: 'PRODUCTION_FALLBACK_BLOCKED' },
      { status: 503 }
    );
  }

  const secret = process.env.ADMIN_API_SECRET;
  const path = params.slug.join('/');
  const target = `${backendUrl}/api/admin/${path}`;

  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    const forwardHeaders: Record<string, string> = {
      ...(secret ? { 'x-admin-token': secret } : {}),
      'x-admin-session-id': session.sessionId,
    };

    const idempKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
    if (idempKey) {
      forwardHeaders['Idempotency-Key'] = idempKey;
    }

    let bodyData: any;
    if (isMultipart) {
      const arrayBuffer = await req.arrayBuffer();
      bodyData = Buffer.from(arrayBuffer);
      forwardHeaders['Content-Type'] = contentType;
    } else {
      const jsonBody = await req.json();
      bodyData = JSON.stringify(jsonBody);
      forwardHeaders['Content-Type'] = 'application/json';
    }

    const res = await fetch(target, {
      method: 'POST',
      headers: forwardHeaders,
      body: bodyData,
    });

    const { data, status } = await safeParseBackendResponse(res);
    return NextResponse.json(data, { status });
  } catch (err: any) {
    console.error(`[Admin Gateway Error] Failed POST to backend at ${target}:`, err.message);
    return NextResponse.json(
      { error: 'Backend administrative service is unreachable.' },
      { status: 503 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const session = getAdminSessionFromRequest(req);

  if (!session?.sessionId) {
    return NextResponse.json(
      { error: 'Unauthorized: Active administrator session required.' },
      { status: 401 }
    );
  }

  let backendUrl: string;
  try {
    backendUrl = getBackendApiUrl();
  } catch (urlErr: any) {
    return NextResponse.json(
      { error: urlErr.message, code: 'PRODUCTION_FALLBACK_BLOCKED' },
      { status: 503 }
    );
  }

  const secret = process.env.ADMIN_API_SECRET;
  const path = params.slug.join('/');
  const target = `${backendUrl}/api/admin/${path}`;

  try {
    const res = await fetch(target, {
      method: 'DELETE',
      headers: {
        ...(secret ? { 'x-admin-token': secret } : {}),
        'x-admin-session-id': session.sessionId,
      },
    });

    const { data, status } = await safeParseBackendResponse(res);
    return NextResponse.json(data, { status });
  } catch (err: any) {
    console.error(`[Admin Gateway Error] Failed DELETE to backend at ${target}:`, err.message);
    return NextResponse.json(
      { error: 'Backend administrative service is unreachable.' },
      { status: 503 }
    );
  }
}
