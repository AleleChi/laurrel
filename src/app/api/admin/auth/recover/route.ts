import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Forward to Render backend if available
    const backendUrl = process.env.BACKEND_API_URL || process.env.API_BASE_URL;
    const backendSecret = process.env.ADMIN_API_SECRET;

    if (backendUrl) {
      try {
        const target = `${backendUrl.replace(/\/$/, '')}/api/admin/auth/recover`;
        await fetch(target, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(backendSecret ? { 'x-admin-token': backendSecret } : {}),
          },
          body: JSON.stringify({ email: trimmedEmail }),
        });
      } catch (err) {
        console.warn('[Admin Recovery Forward Failed]:', err);
      }
    }

    // Always respond with neutral confirmation to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        'If an authorized administrator account exists for this address, password recovery instructions have been prepared and sent.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to process recovery request.' }, { status: 500 });
  }
}
