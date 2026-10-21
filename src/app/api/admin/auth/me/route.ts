import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, clearAdminSessionCookie } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);

  if (!session?.sessionId) {
    const res = NextResponse.json({ authenticated: false }, { status: 401 });
    clearAdminSessionCookie(res);
    return res;
  }

  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const secret = process.env.ADMIN_API_SECRET;
  const target = `${backendUrl.replace(/\/$/, '')}/api/admin/auth/me`;

  try {
    const res = await fetch(target, {
      headers: {
        ...(secret ? { 'x-admin-token': secret } : {}),
        'x-admin-session-id': session.sessionId,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      // Session has been revoked, expired, or user account was deactivated in the database
      const unauthorizedRes = NextResponse.json({ authenticated: false }, { status: 401 });
      clearAdminSessionCookie(unauthorizedRes);
      return unauthorizedRes;
    }

    const data = await res.json();
    return NextResponse.json({
      authenticated: true,
      user: data.user,
    });
  } catch (err: any) {
    console.error('[Admin Auth Me Error]: Failed to reach backend auth verification:', err.message);
    // If backend is unreachable, do not confirm authentication
    return NextResponse.json(
      { error: 'Authentication service temporarily unreachable. Please retry.' },
      { status: 503 }
    );
  }
}
