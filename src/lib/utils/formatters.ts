/**
 * LAURREL SERVICES — Centralized Administration Formatters
 * Formats enquiry sources, Canadian English dates, service parameters, and activity notes.
 */

const SOURCE_LABELS: Record<string, string> = {
  web_services_sidebar: 'Services Page Enquiry',
  web_contact_page: 'Contact Page',
  web_contact: 'Contact Page',
  web_quote_modal: 'Quote Request',
  quote_modal: 'Quote Request',
  web_direct: 'Website Enquiry',
  ai_assistant: 'Website Chat',
  assistant: 'Website Chat',
  phone_direct: 'Telephone Enquiry',
};

/**
 * Format enquiry source identifier to clean Canadian business terminology
 */
export function formatEnquirySource(source: string | null | undefined): string {
  if (!source) return 'Website Enquiry';
  const normalized = source.trim().toLowerCase();
  if (SOURCE_LABELS[normalized]) {
    return SOURCE_LABELS[normalized];
  }
  return normalized
    .replace(/^web_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Consistent Canadian English date formatting (e.g. "22 Oct 2026")
 */
export function formatCanadianDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return String(dateValue);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Consistent Canadian English date-time formatting (e.g. "22 Oct 2026, 2:30 PM")
 */
export function formatCanadianDateTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return String(dateValue);

  const datePart = formatCanadianDate(d);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;

  return `${datePart}, ${displayHours}:${minutes} ${ampm}`;
}

/**
 * Header timestamp display matching exact specification:
 * "Received 22 Oct 2026 · Services Page Enquiry"
 */
export function formatEnquiryReceivedHeader(createdAt: string | Date, source?: string): string {
  const dateStr = formatCanadianDate(createdAt);
  const sourceLabel = formatEnquirySource(source);
  return `Received ${dateStr} · ${sourceLabel}`;
}

/**
 * Transforms system author identifiers to clear human wording
 */
export function formatNoteAuthor(author: string | null | undefined): string {
  if (!author) return 'Website';
  const normalized = author.trim().toLowerCase();
  if (normalized === 'system' || normalized === 'automated' || normalized === 'bot') {
    return 'Website';
  }
  return author;
}

/**
 * Transforms technical tracking notes on render without altering historical Neon records
 */
export function formatNoteContent(content: string): string {
  if (!content) return '';
  return content
    .replace(/Enquiry created via web_services_sidebar/gi, 'Enquiry received through the Services page')
    .replace(/Enquiry created via web_contact_page/gi, 'Enquiry received through the Contact page')
    .replace(/Enquiry created via web_quote_modal/gi, 'Enquiry received through Quote Request modal')
    .replace(/Enquiry created via web_direct/gi, 'Enquiry received directly through Website')
    .replace(/Enquiry created via ai_assistant/gi, 'Enquiry initiated via Website Chat')
    .replace(/web_services_sidebar/gi, 'Services page')
    .replace(/web_contact_page/gi, 'Contact page')
    .replace(/web_quote_modal/gi, 'Quote Request')
    .replace(/web_direct/gi, 'Website')
    .replace(/ai_assistant/gi, 'Website Chat');
}

/**
 * Human-readable service parameter labels
 */
const PARAM_LABELS: Record<string, string> = {
  propertyType: 'Property Type',
  propertySize: 'Property Size',
  cleaningRequirements: 'Cleaning Scope',
  movingFrom: 'Origin Address',
  movingTo: 'Destination Address',
  belongingsSize: 'Inventory / Home Size',
  accessConsiderations: 'Site Access (Stairs / Elevator)',
  storageDuration: 'Estimated Storage Duration',
  storageItemsType: 'Items To Store',
  accessRequirements: 'Facility Access Needs',
  serviceType: 'Service Scope',
  squareFootage: 'Approximate Square Footage',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  specialInstructions: 'Special Requirements',
};

export function formatServiceParamLabel(key: string): string {
  if (PARAM_LABELS[key]) return PARAM_LABELS[key];
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatServiceParamValue(val: any): string {
  if (val === null || val === undefined || val === '') return 'Not specified';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `${formatServiceParamLabel(k)}: ${formatServiceParamValue(v)}`)
      .join('; ');
  }
  return String(val);
}
