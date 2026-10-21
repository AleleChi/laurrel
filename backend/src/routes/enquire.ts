import { Router, Request, Response } from 'express';
import { createEnquiry, updateEmailDeliveryStatus } from '../database/enquiryRepo';
import { getEmailProvider } from '../services/email';

export const enquireRouter = Router();

// In-memory sliding window rate-limiter: Max 5 submissions per 60s per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }

  if (entry.count >= 5) {
    return true;
  }

  entry.count += 1;
  return false;
}

enquireRouter.post('/api/enquire', async (req: Request, res: Response) => {
  try {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    if (isRateLimited(ip)) {
      res.status(429).json({
        error: 'Too many submissions from this connection. Please wait a minute before trying again.',
      });
      return;
    }

    const {
      name,
      email,
      phone,
      services,
      serviceLocation,
      preferredDate,
      details,
      serviceDetails,
      intent,
      source,
    } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please provide a valid name (at least 2 characters).' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (!details || typeof details !== 'string' || details.trim().length < 5) {
      res.status(400).json({ error: 'Please provide some details about the service required (at least 5 characters).' });
      return;
    }

    const cleanedServices = Array.isArray(services) && services.length > 0 ? services : ['general'];

    // 1. Durably persist enquiry
    let record;
    try {
      record = await createEnquiry({
        intent: intent || 'general_contact',
        source: source || 'web_direct',
        name,
        email,
        phone,
        services: cleanedServices,
        serviceLocation,
        preferredDate,
        details,
        serviceDetails,
      });
    } catch (persistErr: any) {
      console.error('[Enquiry Persistence Error]:', persistErr.message);
      res.status(503).json({
        error: 'Database service is temporarily unavailable. Your enquiry could not be saved. Please retry in a few moments.',
        code: 'DATABASE_UNAVAILABLE',
      });
      return;
    }

    // 2. Dispatch notification email
    const emailProvider = getEmailProvider();
    const notificationResult = await emailProvider.sendEnquiryNotification(record);

    if (notificationResult.success) {
      await updateEmailDeliveryStatus(record.id, true);
      // Asynchronously send customer acknowledgement
      emailProvider.sendCustomerAcknowledgement(record).catch(() => {});
    }

    // 3. Log audit event without logging customer message or PII
    console.log('[Enquiry Processed]:', {
      id: record.id,
      intent: record.intent,
      source: record.source,
      services: record.services,
      hasPhone: Boolean(record.customer.phone),
      emailDelivered: notificationResult.success,
    });

    const successMessage =
      record.intent === 'quote_request'
        ? `Your quote request has been received (Ref: ${record.id}). Our Ottawa team will review your requirements and follow up promptly.`
        : `Your enquiry has been received (Ref: ${record.id}). We will review your details and respond with the next steps.`;

    res.status(200).json({
      success: true,
      delivered: notificationResult.success,
      referenceId: record.id,
      message: successMessage,
    });
  } catch (error: any) {
    console.error('[Enquiry API Error]:', error.message);
    res.status(500).json({
      error: 'An unexpected error occurred while processing your request. Please try again.',
    });
  }
});
