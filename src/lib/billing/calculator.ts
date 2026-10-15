import { InvoiceLineItem, TaxConfiguration } from '../types/billing';

export const ONTARIO_TAX_CONFIG: TaxConfiguration = {
  province: 'ON',
  rate: 0.13, // 13% Harmonized Sales Tax in Ontario
  taxName: 'HST',
  registrationNumber: 'PENDING_REGISTRATION', // Must remain unconfirmed until official CRA business registration
};

export interface CalculationResult {
  subtotalCents: number;
  taxableSubtotalCents: number;
  taxRate: number;
  taxCents: number;
  totalCents: number;
  formattedSubtotal: string;
  formattedTax: string;
  formattedTotal: string;
}

/**
 * Deterministically calculates subtotals, Ontario HST, and grand total in integer cents.
 * Completely eliminates floating-point drift and prohibits AI model arithmetic guesses.
 */
export function calculateTotals(
  lineItems: InvoiceLineItem[],
  taxConfig: TaxConfiguration = ONTARIO_TAX_CONFIG
): CalculationResult {
  let subtotalCents = 0;
  let taxableSubtotalCents = 0;

  for (const item of lineItems) {
    const itemTotal = Math.round(item.quantity * item.unitPriceCents);
    subtotalCents += itemTotal;
    if (item.isTaxable) {
      taxableSubtotalCents += itemTotal;
    }
  }

  // Exact Ontario HST rounding
  const taxCents = Math.round(taxableSubtotalCents * taxConfig.rate);
  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    taxableSubtotalCents,
    taxRate: taxConfig.rate,
    taxCents,
    totalCents,
    formattedSubtotal: formatCAD(subtotalCents),
    formattedTax: formatCAD(taxCents),
    formattedTotal: formatCAD(totalCents),
  };
}

/**
 * Formats integer cents to standard Canadian Dollar representation
 * e.g. 125050 -> "$1,250.50 CAD"
 */
export function formatCAD(cents: number): string {
  const dollars = cents / 100;
  const formatted = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
  return `${formatted} CAD`;
}
