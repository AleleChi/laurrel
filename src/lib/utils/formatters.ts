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

/**
 * Ottawa Local Time (America/Toronto) Formatter
 * Accurately handles Eastern Standard Time (EST) and Eastern Daylight Time (EDT)
 */
export function formatOttawaDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatOttawaTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatOttawaDateTime(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function formatOttawaTimeRange(
  startValue: string | Date,
  endValue: string | Date
): string {
  const start = typeof startValue === 'string' ? new Date(startValue) : startValue;
  const end = typeof endValue === 'string' ? new Date(endValue) : endValue;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '—';

  const dateStr = formatOttawaDate(start);
  const startTime = formatOttawaTime(start);
  const endTime = formatOttawaTime(end);

  return `${dateStr} · ${startTime} – ${endTime} (Ottawa Time)`;
}

export type AppointmentType =
  | 'telephone'
  | 'in_person'
  | 'on_site'
  | 'google_meet'
  | 'ms_teams'
  | 'zoom';

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  telephone: 'Telephone Consultation',
  in_person: 'In-Person Consultation',
  on_site: 'On-Site Property Assessment',
  google_meet: 'Google Meet',
  ms_teams: 'Microsoft Teams',
  zoom: 'Zoom',
};

export function formatAppointmentType(type: string | null | undefined): string {
  if (!type) return 'Consultation';
  return APPOINTMENT_TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const APPOINTMENT_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  completed: { label: 'Completed', color: 'text-zinc-700', bg: 'bg-zinc-100 border-zinc-200' },
  rescheduled: { label: 'Rescheduled', color: 'text-[#49056B]', bg: 'bg-purple-50 border-purple-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  no_show: { label: 'No-show', color: 'text-zinc-500', bg: 'bg-zinc-50 border-zinc-200' },
};

export function formatAppointmentStatus(status: string | null | undefined): { label: string; color: string; bg: string } {
  if (!status) return { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
  return (
    APPOINTMENT_STATUS_LABELS[status] || {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      color: 'text-zinc-700',
      bg: 'bg-zinc-100 border-zinc-200',
    }
  );
}
