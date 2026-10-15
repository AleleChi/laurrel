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

    // 1. Try validating against Render backend if BACKEND_API_URL is configured
    const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL;
    const backendSecret = process.env.ADMIN_API_SECRET;

    if (backendUrl) {
      try {
        const target = `${backendUrl.replace(/\/$/, '')}/api/admin/auth/login`;
        const res = await fetch(target, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(backendSecret ? { 'x-admin-token': backendSecret } : {}),
          },
          body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const nextRes = NextResponse.json({ success: true, user: data.user });
            setAdminSessionCookie(nextRes, data.user);
            return nextRes;
          }
        }
      } catch (err) {
        console.warn('[Admin Login] Backend verification request failed, checking environment fallback:', err);
      }
    }

    // 2. Local environment owner authentication fallback
    const ownerEmail = (process.env.ADMIN_OWNER_EMAIL || 'owner@laurrelservices.ca').toLowerCase();
    const ownerPassword = process.env.ADMIN_OWNER_PASSWORD || process.env.ADMIN_API_SECRET;

    if (ownerPassword && trimmedEmail === ownerEmail && trimmedPassword === ownerPassword) {
      const user: AdminSessionUser = {
        id: 'admin_owner_bootstrap',
        email: ownerEmail,
        name: 'Laurrel Owner Admin',
        role: 'owner',
      };

      const nextRes = NextResponse.json({ success: true, user });
      setAdminSessionCookie(nextRes, user);
      return nextRes;
    }

    return NextResponse.json({ error: 'Invalid administrator email or password.' }, { status: 401 });
  } catch (err: any) {
    console.error('[Admin Login Error]:', err);
    return NextResponse.json({ error: 'An unexpected authentication error occurred.' }, { status: 500 });
  }
}
