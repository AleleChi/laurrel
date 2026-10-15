import { NextRequest, NextResponse } from 'next/server';
import { processStripeWebhookEvent } from '@/lib/billing/service';
import { BillingWebhookEvent } from '@/lib/types/billing';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    // In production with STRIPE_WEBHOOK_SECRET, verify cryptographic HMAC signature
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && !signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header.' },
        { status: 400 }
      );
    }

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON payload.' },
        { status: 400 }
      );
    }

    const eventType = parsedPayload.type || parsedPayload.eventType || 'unknown';
    const invoiceId =
      parsedPayload.data?.object?.metadata?.invoice_id ||
      parsedPayload.data?.object?.id ||
      parsedPayload.invoiceId;

    const webhookEvent: BillingWebhookEvent = {
      id: parsedPayload.id || `evt_${Date.now()}`,
      eventType,
      provider: 'stripe',
      invoiceId,
      amountReceivedCents: parsedPayload.data?.object?.amount_paid || parsedPayload.amountReceivedCents,
      payload: parsedPayload,
      receivedAt: new Date().toISOString(),
      processed: true,
    };

    const result = await processStripeWebhookEvent(webhookEvent);

    return NextResponse.json({
      received: true,
      processed: result.success,
      message: result.message,
    });
  } catch (error) {
    console.error('[Billing Webhook API error]:', error);
    return NextResponse.json(
      { error: 'Webhook processing failure.' },
      { status: 500 }
    );
  }
}
