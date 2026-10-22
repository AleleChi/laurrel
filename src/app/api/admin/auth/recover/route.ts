import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
    const backendSecret = process.env.ADMIN_API_SECRET;

    try {
      const target = `${backendUrl.replace(/\/$/, '')}/api/admin/auth/recover`;
      const res = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
          'user-agent': req.headers.get('user-agent') || '',
          ...(backendSecret ? { 'x-admin-token': backendSecret } : {}),
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data.error || 'Password recovery service is temporarily unavailable.',
            code: data.code,
          },
          { status: res.status }
        );
      }

      return NextResponse.json({
        success: true,
        message:
          data.message ||
          'If an authorized administrator account exists for this email address, password recovery instructions have been sent.',
      });
    } catch (err: any) {
      console.error('[Admin Recovery Forward Failed]:', err);
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication service temporarily unreachable. Please verify your connection.',
        },
        { status: 503 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to process recovery request.' },
      { status: 500 }
    );
  }
}
