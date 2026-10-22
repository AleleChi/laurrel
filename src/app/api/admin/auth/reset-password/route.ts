import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password reset token is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { success: false, error: 'New password is required.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 10 characters in length.' },
        { status: 400 }
      );
    }

    const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL || 'http://localhost:5000';
    const backendSecret = process.env.ADMIN_API_SECRET;
    const target = `${backendUrl.replace(/\/$/, '')}/api/admin/auth/reset-password`;

    try {
      const res = await fetch(target, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
          'user-agent': req.headers.get('user-agent') || '',
          ...(backendSecret ? { 'x-admin-token': backendSecret } : {}),
        },
        body: JSON.stringify({ token: token.trim(), newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return NextResponse.json(
          {
            success: false,
            error: data.error || 'Password reset failed. The link may be expired or invalid.',
          },
          { status: res.status }
        );
      }

      return NextResponse.json({
        success: true,
        message: data.message || 'Password successfully reset.',
      });
    } catch (err: any) {
      console.error('[Admin Reset Password Forward Failed]:', err);
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
      { success: false, error: 'Failed to process password reset request.' },
      { status: 500 }
    );
  }
}
