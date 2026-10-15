import { ServiceCategory } from './enquiry';

export type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired';

export type InvoiceStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent'
  | 'paid'
  | 'void'
  | 'uncollectible';

export type PaymentStatus =
  | 'unpaid'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'refunded';

export interface TaxConfiguration {
  province: string;
  rate: number; // e.g. 0.13 for Ontario HST
  taxName: string; // e.g. 'HST'
  registrationNumber?: string; // GST/HST business number once confirmed
}

export interface InvoiceLineItem {
  id: string;
  serviceCategory: ServiceCategory | 'custom';
  description: string;
  quantity: number;
  unitPriceCents: number; // Stored in integer cents to avoid IEEE-754 float drift
  amountCents: number;
  isTaxable: boolean;
}

export interface QuoteRecord {
  id: string; // e.g. QUO-20261015-XXXX
  enquiryReferenceId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotalCents: number;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  currency: 'CAD';
  status: QuoteStatus;
  validUntil: string;
  notes?: string;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  customerAcceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string; // e.g. INV-20261015-XXXX
  quoteId?: string;
  enquiryReferenceId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  lineItems: InvoiceLineItem[];
  subtotalCents: number;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  currency: 'CAD';
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: 'stripe' | 'manual';
  providerInvoiceId?: string;
  providerPaymentIntentId?: string;
  providerHostedUrl?: string;
  dueDate: string;
  adminApprovedBy?: string;
  adminApprovedAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingWebhookEvent {
  id: string;
  eventType: string; // e.g. 'invoice.paid' | 'payment_intent.succeeded'
  provider: 'stripe';
  invoiceId?: string;
  paymentIntentId?: string;
  amountReceivedCents?: number;
  payload: Record<string, any>;
  receivedAt: string;
  processed: boolean;
}
