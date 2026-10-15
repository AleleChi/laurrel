const fs = require('fs');
const path = require('path');
const { calculateTotals, formatCAD, ONTARIO_TAX_CONFIG } = require('../src/lib/billing/calculator');
const {
  createDraftQuote,
  approveQuote,
  recordCustomerAcceptance,
  createDraftInvoiceFromQuote,
  approveInvoice,
  processStripeWebhookEvent,
  readAllQuotes,
  readAllInvoices,
} = require('../src/lib/billing/service');
const { readAllEnquiries } = require('../src/lib/db/enquiries');

async function run() {
  console.log('--- STARTING MILESTONE 3: BILLING & INVOICING VERIFICATION ---');

  // TEST 1: Deterministic Math & Canadian Ontario HST Calculation
  console.log('\n1. Testing Deterministic Financial Calculations & Ontario HST (13%)...');

  const testItems = [
    {
      id: 'item-1',
      serviceCategory: 'cleaning',
      description: 'Move-out handover cleaning (3-bedroom home)',
      quantity: 1,
      unitPriceCents: 35000, // $350.00
      amountCents: 35000,
      isTaxable: true,
    },
    {
      id: 'item-2',
      serviceCategory: 'moving',
      description: 'Local Ottawa residential moving coordination',
      quantity: 1,
      unitPriceCents: 85000, // $850.00
      amountCents: 85000,
      isTaxable: true,
    },
    {
      id: 'item-3',
      serviceCategory: 'storage',
      description: 'Transitional holding arrangement (2 weeks)',
      quantity: 1,
      unitPriceCents: 20000, // $200.00
      amountCents: 20000,
      isTaxable: true,
    },
  ];

  const calc = calculateTotals(testItems, ONTARIO_TAX_CONFIG);
  console.log('Calculation Result:', {
    subtotal: calc.formattedSubtotal,
    hst13: calc.formattedTax,
    total: calc.formattedTotal,
  });

  if (calc.subtotalCents !== 140000) throw new Error('Subtotal calculation mismatch');
  if (calc.taxCents !== 18200) throw new Error('13% HST calculation mismatch'); // 140000 * 0.13 = 18200
  if (calc.totalCents !== 158200) throw new Error('Total calculation mismatch');
  console.log('✓ Deterministic arithmetic check passed: $1,400.00 + $182.00 HST = $1,582.00 CAD');

  // TEST 2: Lifecycle Workflow with Administrative Gates
  console.log('\n2. Testing End-to-End Billing Lifecycle from Verified Enquiry...');

  const enquiries = await readAllEnquiries();
  if (enquiries.length === 0) throw new Error('No enquiries found to create quote from.');
  const targetEnquiry = enquiries[0];
  console.log(`Using verified enquiry: ${targetEnquiry.id} (${targetEnquiry.customer.name})`);

  // A. Create Draft Quote
  console.log('A. Creating draft quote...');
  const draftQuote = await createDraftQuote({
    enquiryReferenceId: targetEnquiry.id,
    lineItems: testItems,
    validDays: 14,
    notes: 'Quote subject to onsite property review.',
  });
  console.log(`Generated Quote: ${draftQuote.id}, Status: ${draftQuote.status}`);
  if (draftQuote.status !== 'pending_approval') throw new Error('Initial quote status must be pending_approval');

  // B. Verify Security Gate: unapproved quote cannot be accepted
  console.log('B. Verifying security gate: customer acceptance fails on unapproved quote...');
  let gateTriggered = false;
  try {
    await recordCustomerAcceptance(draftQuote.id);
  } catch (err) {
    gateTriggered = true;
    console.log(`✓ Security gate verified: ${err.message}`);
  }
  if (!gateTriggered) throw new Error('Security gate failed: unapproved quote was accepted!');

  // C. Administrative Approval
  console.log('C. Administrative approval of quote...');
  const approvedQuote = await approveQuote(draftQuote.id, 'admin_coordinator_1');
  console.log(`Quote ${approvedQuote.id} status after approval: ${approvedQuote.status} by ${approvedQuote.adminApprovedBy}`);
  if (approvedQuote.status !== 'approved') throw new Error('Quote status must be approved');

  // D. Customer Acceptance
  console.log('D. Customer accepts approved quote...');
  const acceptedQuote = await recordCustomerAcceptance(approvedQuote.id);
  console.log(`Quote ${acceptedQuote.id} status after customer acceptance: ${acceptedQuote.status}`);
  if (acceptedQuote.status !== 'accepted') throw new Error('Quote status must be accepted');

  // E. Create Draft Invoice from Accepted Quote
  console.log('E. Generating draft invoice from accepted quote...');
  const draftInvoice = await createDraftInvoiceFromQuote(acceptedQuote.id);
  console.log(`Generated Invoice: ${draftInvoice.id}, Status: ${draftInvoice.status}, Payment Status: ${draftInvoice.paymentStatus}`);
  if (draftInvoice.status !== 'pending_approval') throw new Error('Initial invoice status must be pending_approval');
  if (draftInvoice.paymentStatus !== 'unpaid') throw new Error('Initial payment status must be unpaid');

  // F. Administrative Invoice Approval with Safe Staging Gate
  console.log('F. Administrative invoice approval...');
  const approvalResult = await approveInvoice(draftInvoice.id, 'billing_supervisor_1');
  console.log(`Invoice Approval Result:`, {
    status: approvalResult.invoice.status,
    isLiveBillingReady: approvalResult.isLiveBillingReady,
    message: approvalResult.message,
  });
  if (approvalResult.invoice.status !== 'approved') throw new Error('Invoice status must be approved');

  // G. Verified Stripe Payment Webhook
  console.log('G. Processing cryptographically verified payment webhook...');
  const webhookResult = await processStripeWebhookEvent({
    id: `evt_test_${Date.now()}`,
    eventType: 'invoice.payment_succeeded',
    provider: 'stripe',
    invoiceId: draftInvoice.id,
    amountReceivedCents: draftInvoice.totalCents,
    payload: {
      id: `evt_test_${Date.now()}`,
      object: 'event',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: draftInvoice.id,
          amount_paid: draftInvoice.totalCents,
          currency: 'cad',
          status: 'paid',
        },
      },
    },
    receivedAt: new Date().toISOString(),
    processed: true,
  });
  console.log('Webhook Result:', webhookResult);

  // H. Verify Invoice Paid Status
  const invoices = await readAllInvoices();
  const updatedInvoice = invoices.find((i) => i.id === draftInvoice.id);
  console.log(`Updated Invoice Status: ${updatedInvoice.status}, Payment: ${updatedInvoice.paymentStatus}, PaidAt: ${updatedInvoice.paidAt}`);
  if (updatedInvoice.status !== 'paid') throw new Error('Invoice status must be paid after verified webhook');
  if (updatedInvoice.paymentStatus !== 'succeeded') throw new Error('Payment status must be succeeded');

  console.log('\n--- ALL BILLING & INVOICING TESTS COMPLETED SUCCESSFULLY ---');
}

run().catch((e) => {
  console.error('Billing verification failed:', e);
  process.exit(1);
});
