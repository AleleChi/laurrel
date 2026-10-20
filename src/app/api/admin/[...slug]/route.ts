import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/auth/session';

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const session = getAdminSessionFromRequest(req);
  const secret = process.env.ADMIN_API_SECRET;
  const tokenHeader = req.headers.get('x-admin-token');
  const isDirectSecretCall = secret && tokenHeader === secret;

  if (!session && !isDirectSecretCall) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrator session required.' },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const path = params.slug.join('/');
  const search = req.nextUrl.search;
  const target = `${backendUrl.replace(/\/$/, '')}/api/admin/${path}${search}`;

  try {
    const res = await fetch(target, {
      headers: {
        ...(secret ? { 'x-admin-token': secret } : {}),
        ...(session?.sessionId ? { 'x-admin-session-id': session.sessionId } : {}),
        ...(session?.user
          ? {
              'x-admin-user-id': session.user.id,
              'x-admin-user-email': session.user.email,
              'x-admin-user-name': session.user.name,
              'x-admin-user-role': session.user.role,
            }
          : {}),
      },
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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
  const secret = process.env.ADMIN_API_SECRET;
  const tokenHeader = req.headers.get('x-admin-token');
  const isDirectSecretCall = secret && tokenHeader === secret;

  if (!session && !isDirectSecretCall) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrator session required.' },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const path = params.slug.join('/');
  const target = `${backendUrl.replace(/\/$/, '')}/api/admin/${path}`;

  try {
    const body = await req.json();

    const res = await fetch(target, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-admin-token': secret } : {}),
        ...(session?.sessionId ? { 'x-admin-session-id': session.sessionId } : {}),
        ...(session?.user
          ? {
              'x-admin-user-id': session.user.id,
              'x-admin-user-email': session.user.email,
              'x-admin-user-name': session.user.name,
              'x-admin-user-role': session.user.role,
            }
          : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
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
  const secret = process.env.ADMIN_API_SECRET;
  const tokenHeader = req.headers.get('x-admin-token');
  const isDirectSecretCall = secret && tokenHeader === secret;

  if (!session && !isDirectSecretCall) {
    return NextResponse.json(
      { error: 'Unauthorized: Valid administrator session required.' },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const path = params.slug.join('/');
  const target = `${backendUrl.replace(/\/$/, '')}/api/admin/${path}`;

  try {
    const body = await req.json();

    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'x-admin-token': secret } : {}),
        ...(session?.sessionId ? { 'x-admin-session-id': session.sessionId } : {}),
        ...(session?.user
          ? {
              'x-admin-user-id': session.user.id,
              'x-admin-user-email': session.user.email,
              'x-admin-user-name': session.user.name,
              'x-admin-user-role': session.user.role,
            }
          : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    console.error(`[Admin Gateway Error] Failed POST to backend at ${target}:`, err.message);
    return NextResponse.json(
      { error: 'Backend administrative service is unreachable.' },
      { status: 503 }
    );
  }
}
