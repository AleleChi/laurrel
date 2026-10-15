import fs from 'fs';
import path from 'path';
import {
  QuoteRecord,
  InvoiceRecord,
  InvoiceLineItem,
  QuoteStatus,
  InvoiceStatus,
  PaymentStatus,
  BillingWebhookEvent,
} from '../types/billing';
import { calculateTotals, ONTARIO_TAX_CONFIG } from './calculator';
import { getEnquiryById } from '../db/enquiries';

const DATA_DIR = path.join(process.cwd(), 'data');
const QUOTES_FILE = path.join(DATA_DIR, 'quotes.json');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');
const WEBHOOKS_FILE = path.join(DATA_DIR, 'billing_webhooks.json');

function ensureBillingStorage(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(QUOTES_FILE)) {
      fs.writeFileSync(QUOTES_FILE, JSON.stringify([], null, 2), 'utf8');
    }
    if (!fs.existsSync(INVOICES_FILE)) {
      fs.writeFileSync(INVOICES_FILE, JSON.stringify([], null, 2), 'utf8');
    }
    if (!fs.existsSync(WEBHOOKS_FILE)) {
      fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  } catch (err) {
    console.error('[Billing DB] Storage initialization error:', err);
  }
}

export function generateBillingId(prefix: 'QUO' | 'INV'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${randomSuffix}`;
}

export async function readAllQuotes(): Promise<QuoteRecord[]> {
  ensureBillingStorage();
  try {
    const raw = fs.readFileSync(QUOTES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export async function readAllInvoices(): Promise<InvoiceRecord[]> {
  ensureBillingStorage();
  try {
    const raw = fs.readFileSync(INVOICES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

/**
 * Creates a draft quotation linked to an approved customer enquiry.
 * Initial state is 'pending_approval' — requires explicit administrative signoff.
 */
export async function createDraftQuote(params: {
  enquiryReferenceId: string;
  lineItems: InvoiceLineItem[];
  validDays?: number;
  notes?: string;
}): Promise<QuoteRecord> {
  ensureBillingStorage();

  const enquiry = await getEnquiryById(params.enquiryReferenceId);
  if (!enquiry) {
    throw new Error(`Enquiry ${params.enquiryReferenceId} not found.`);
  }

  const totals = calculateTotals(params.lineItems, ONTARIO_TAX_CONFIG);
  const now = new Date();
  const validUntil = new Date(now.getTime() + (params.validDays || 14) * 86400000).toISOString();

  const quote: QuoteRecord = {
    id: generateBillingId('QUO'),
    enquiryReferenceId: enquiry.id,
    customer: {
      name: enquiry.customer.name,
      email: enquiry.customer.email,
      phone: enquiry.customer.phone,
      address: enquiry.serviceLocation,
    },
    lineItems: params.lineItems,
    subtotalCents: totals.subtotalCents,
    taxRate: totals.taxRate,
    taxCents: totals.taxCents,
    totalCents: totals.totalCents,
    currency: 'CAD',
    status: 'pending_approval',
    validUntil,
    notes: params.notes,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const quotes = await readAllQuotes();
  quotes.unshift(quote);
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2), 'utf8');

  return quote;
}

/**
 * Administrative sign-off for quotes.
 * Only approved quotes can be transmitted to customers.
 */
export async function approveQuote(
  quoteId: string,
  adminUserId: string
): Promise<QuoteRecord> {
  ensureBillingStorage();
  const quotes = await readAllQuotes();
  const index = quotes.findIndex((q) => q.id === quoteId);
  if (index === -1) {
    throw new Error(`Quote ${quoteId} not found.`);
  }

  const now = new Date().toISOString();
  quotes[index].status = 'approved';
  quotes[index].adminApprovedBy = adminUserId;
  quotes[index].adminApprovedAt = now;
  quotes[index].updatedAt = now;

  fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2), 'utf8');
  return quotes[index];
}

/**
 * Records verified customer acceptance of an approved quote.
 */
export async function recordCustomerAcceptance(quoteId: string): Promise<QuoteRecord> {
  ensureBillingStorage();
  const quotes = await readAllQuotes();
  const index = quotes.findIndex((q) => q.id === quoteId);
  if (index === -1) throw new Error(`Quote ${quoteId} not found.`);

  if (quotes[index].status !== 'approved' && quotes[index].status !== 'sent') {
    throw new Error(`Cannot accept quote with status: ${quotes[index].status}`);
  }

  const now = new Date().toISOString();
  quotes[index].status = 'accepted';
  quotes[index].customerAcceptedAt = now;
  quotes[index].updatedAt = now;

  fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2), 'utf8');
  return quotes[index];
}

/**
 * Creates a draft invoice from an accepted quote.
 * Requires administrative sign-off before being dispatched to Stripe or customer.
 */
export async function createDraftInvoiceFromQuote(
  quoteId: string,
  dueDays = 14
): Promise<InvoiceRecord> {
  ensureBillingStorage();
  const quotes = await readAllQuotes();
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) throw new Error(`Quote ${quoteId} not found.`);

  if (quote.status !== 'accepted') {
    throw new Error(`Quote must be accepted by customer before generating invoice. Current: ${quote.status}`);
  }

  const now = new Date();
  const dueDate = new Date(now.getTime() + dueDays * 86400000).toISOString();

  const invoice: InvoiceRecord = {
    id: generateBillingId('INV'),
    quoteId: quote.id,
    enquiryReferenceId: quote.enquiryReferenceId,
    customer: { ...quote.customer },
    lineItems: [...quote.lineItems],
    subtotalCents: quote.subtotalCents,
    taxRate: quote.taxRate,
    taxCents: quote.taxCents,
    totalCents: quote.totalCents,
    currency: 'CAD',
    status: 'pending_approval',
    paymentStatus: 'unpaid',
    paymentProvider: 'stripe',
    dueDate,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const invoices = await readAllInvoices();
  invoices.unshift(invoice);
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8');

  return invoice;
}

/**
 * Administrative invoice approval.
 * Safe gate: Live dispatch is withheld until live billing credentials are confirmed.
 */
export async function approveInvoice(
  invoiceId: string,
  adminUserId: string
): Promise<{ invoice: InvoiceRecord; isLiveBillingReady: boolean; message: string }> {
  ensureBillingStorage();
  const invoices = await readAllInvoices();
  const index = invoices.findIndex((i) => i.id === invoiceId);
  if (index === -1) throw new Error(`Invoice ${invoiceId} not found.`);

  const now = new Date().toISOString();
  invoices[index].status = 'approved';
  invoices[index].adminApprovedBy = adminUserId;
  invoices[index].adminApprovedAt = now;
  invoices[index].updatedAt = now;

  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8');

  const isLiveBillingReady = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.ENABLE_LIVE_BILLING === 'true'
  );

  return {
    invoice: invoices[index],
    isLiveBillingReady,
    message: isLiveBillingReady
      ? 'Invoice approved and ready for automated Stripe delivery.'
      : 'Invoice approved in staging mode. Live dispatch withheld pending business billing configuration.',
  };
}

/**
 * Verified Payment Provider Webhook Handler.
 * Invoices are marked 'paid' ONLY upon receiving a cryptographically verified webhook event.
 */
export async function processStripeWebhookEvent(
  event: BillingWebhookEvent
): Promise<{ success: boolean; message: string }> {
  ensureBillingStorage();

  // Audit log every raw webhook event
  try {
    const rawLogs = fs.existsSync(WEBHOOKS_FILE) ? JSON.parse(fs.readFileSync(WEBHOOKS_FILE, 'utf8')) : [];
    rawLogs.unshift(event);
    fs.writeFileSync(WEBHOOKS_FILE, JSON.stringify(rawLogs, null, 2), 'utf8');
  } catch (err) {
    console.error('[Billing DB] Webhook audit logging error:', err);
  }

  if (event.eventType === 'invoice.payment_succeeded' || event.eventType === 'payment_intent.succeeded') {
    const invoiceId = event.invoiceId;
    if (!invoiceId) {
      return { success: false, message: 'No invoiceId supplied in webhook event.' };
    }

    const invoices = await readAllInvoices();
    const index = invoices.findIndex((i) => i.id === invoiceId || i.providerInvoiceId === invoiceId);

    if (index !== -1) {
      const now = new Date().toISOString();
      invoices[index].status = 'paid';
      invoices[index].paymentStatus = 'succeeded';
      invoices[index].paidAt = now;
      invoices[index].updatedAt = now;
      fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2), 'utf8');
      return { success: true, message: `Invoice ${invoices[index].id} marked as paid via verified Stripe event.` };
    }
  }

  return { success: true, message: `Event ${event.eventType} recorded in webhook audit log.` };
}
