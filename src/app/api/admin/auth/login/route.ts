import { NextRequest, NextResponse } from 'next/server';
import { setAdminSessionCookie, AdminSessionUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const trimmedPassword = String(password).trim();

    const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
    const target = `${backendUrl.replace(/\/$/, '')}/api/admin/auth/login`;

    try {
      const res = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
          'user-agent': req.headers.get('user-agent') || '',
        },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return NextResponse.json(
          { error: data.error || 'Invalid administrator email or password.' },
          { status: res.status }
        );
      }

      const user: AdminSessionUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      };

      const nextRes = NextResponse.json({ success: true, user });
      setAdminSessionCookie(nextRes, user, data.sessionId);
      return nextRes;
    } catch (err: any) {
      console.error('[Admin Login API Exception]:', err);
      return NextResponse.json(
        { error: 'Authentication service temporarily unavailable. Please verify backend connection.' },
        { status: 503 }
      );
    }
  } catch (err: any) {
    console.error('[Admin Login Parsing Error]:', err);
    return NextResponse.json({ error: 'An unexpected authentication error occurred.' }, { status: 500 });
  }
}
