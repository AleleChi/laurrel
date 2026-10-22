import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSessionCookie, getAdminSessionFromRequest } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = getAdminSessionFromRequest(req);
  const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
  const backendSecret = process.env.ADMIN_API_SECRET;

  if (session?.sessionId && backendUrl) {
    try {
      const target = `${backendUrl.replace(/\/$/, '')}/api/admin/auth/logout`;
      await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(backendSecret ? { 'x-admin-token': backendSecret } : {}),
          'x-admin-session-id': session.sessionId,
        },
      });
    } catch (err) {
      console.warn('[Admin Logout] Backend revocation notification failed:', err);
    }
  }

  const res = NextResponse.json({ success: true, message: 'Administrator session cleared.' });
  clearAdminSessionCookie(res);
  return res;
}
