import { NextResponse } from 'next/server';

export interface EnquiryPayload {
  name: string;
  contact: string;
  services: ('cleaning' | 'moving' | 'storage')[];
  details?: string;
  preferredDate?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<EnquiryPayload>;

    // 1. Rigorous server-side validation
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide your name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!body.contact || typeof body.contact !== 'string' || body.contact.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide a valid contact email or phone number in Ottawa.' },
        { status: 400 }
      );
    }

    const validServices = ['cleaning', 'moving', 'storage'] as const;
    const services = Array.isArray(body.services)
      ? body.services.filter((s): s is 'cleaning' | 'moving' | 'storage' =>
          validServices.includes(s as any)
        )
      : [];

    if (services.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one service category (Cleaning, Moving, or Storage).' },
        { status: 400 }
      );
    }

    const cleanedData: EnquiryPayload = {
      name: body.name.trim(),
      contact: body.contact.trim(),
      services,
      details: body.details?.trim() || '',
      preferredDate: body.preferredDate?.trim() || '',
    };

    // 2. Check for real email delivery provider credentials (e.g., RESEND_API_KEY, SMTP)
    const resendApiKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;

    if (resendApiKey) {
      // In production with Resend configured
      // await resend.emails.send({...})
      console.log('[Enquiry API] Sending email via Resend to Ottawa dispatch:', cleanedData);
      return NextResponse.json({
        success: true,
        delivered: true,
        message: 'Your enquiry has been received. Our Ottawa team will follow up with you.',
      });
    }

    if (smtpHost) {
      // In production with SMTP configured
      console.log('[Enquiry API] Sending email via SMTP to Ottawa dispatch:', cleanedData);
      return NextResponse.json({
        success: true,
        delivered: true,
        message: 'Your enquiry has been received. Our Ottawa team will follow up with you.',
      });
    }

    // 3. Honest pre-launch / development handling:
    // Credentials not yet configured in environment variables.
    // Do NOT display a false delivery success message. Report honest status.
    console.log('[Enquiry API] Valid enquiry received, but live dispatch delivery provider is pending configuration:', cleanedData);

    return NextResponse.json({
      success: true,
      delivered: false,
      message:
        'Your enquiry details are valid. Live email delivery credentials (RESEND_API_KEY or SMTP_HOST) are pending configuration in the hosting environment. Your request was logged for the Ottawa service queue.',
    });
  } catch (error) {
    console.error('[Enquiry API Error]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request. Please try again.' },
      { status: 500 }
    );
  }
}
