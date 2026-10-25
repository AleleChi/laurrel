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

/**
 * Format appointment date matching Canadian business standard:
 * "Saturday, 24 October 2026"
 */
export function formatOttawaAppointmentDate(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return '—';
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return String(dateValue);

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Toronto',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format appointment time range matching Canadian business standard:
 * "11:00–11:30 AM · Ottawa time"
 */
export function formatOttawaAppointmentTimeRange(
  startValue: string | Date | null | undefined,
  endValue: string | Date | null | undefined
): string {
  if (!startValue || !endValue) return '—';
  const start = typeof startValue === 'string' ? new Date(startValue) : startValue;
  const end = typeof endValue === 'string' ? new Date(endValue) : endValue;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '—';

  const fmt = (d: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(d);
    let hour = '';
    let min = '';
    let dayPeriod = '';
    for (const p of parts) {
      if (p.type === 'hour') hour = p.value;
      if (p.type === 'minute') min = p.value;
      if (p.type === 'dayPeriod') dayPeriod = p.value.toUpperCase();
    }
    return { hour, min, dayPeriod, time: hour + ':' + min };
  };

  const sp = fmt(start);
  const ep = fmt(end);

  let range = '';
  if (sp.dayPeriod === ep.dayPeriod) {
    range = sp.time + '–' + ep.time + ' ' + ep.dayPeriod;
  } else {
    range = sp.time + ' ' + sp.dayPeriod + ' – ' + ep.time + ' ' + ep.dayPeriod;
  }

  return range + ' · Ottawa time';
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

/**
 * Converts a date (YYYY-MM-DD) and time (HH:mm) representing Ottawa local time (America/Toronto)
 * into an absolute UTC Date / ISO string, regardless of the user's browser or system timezone.
 *
 * Daylight Saving Policy:
 * 1. Spring-Forward Gaps: Times between 02:00 and 02:59:59 on the 2nd Sunday of March do not exist
 *    in Ottawa local time. Rather than silently shifting to another time, this function throws
 *    a descriptive validation Error explaining the gap and instructing the caller to choose >= 03:00.
 * 2. Autumn Repeated Hours (Fall-Back): On the 1st Sunday of November, the local hour from 01:00 to 01:59:59
 *    occurs twice (first in EDT UTC-4, then in EST UTC-5). Laurrel Services' documented business policy
 *    defaults to the earlier occurrence (EDT, UTC-4), representing the first arrival of that business time.
 */
export function ottawaToUtcDate(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
    throw new Error(`Invalid date or time format provided: ${dateStr} ${timeStr}`);
  }

  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  function verifyOttawaMatch(candidateDate: Date): boolean {
    const parts = dtf.formatToParts(candidateDate);
    let pYear = 0, pMonth = 0, pDay = 0, pHour = 0, pMinute = 0;
    for (const p of parts) {
      if (p.type === 'year') pYear = Number(p.value);
      if (p.type === 'month') pMonth = Number(p.value);
      if (p.type === 'day') pDay = Number(p.value);
      if (p.type === 'hour') pHour = p.value === '24' ? 0 : Number(p.value);
      if (p.type === 'minute') pMinute = Number(p.value);
    }
    return (
      pYear === year &&
      pMonth === month &&
      pDay === day &&
      pHour === hour &&
      pMinute === minute
    );
  }

  // In Ottawa (America/Toronto), the UTC offset is strictly either -4h (EDT) or -5h (EST).
  const candidateEdt = new Date(Date.UTC(year, month - 1, day, hour + 4, minute, 0));
  const candidateEst = new Date(Date.UTC(year, month - 1, day, hour + 5, minute, 0));

  const edtMatches = verifyOttawaMatch(candidateEdt);
  const estMatches = verifyOttawaMatch(candidateEst);

  // Spring-Forward Gap: Nonexistent local time (neither EDT nor EST represents this time in Ottawa)
  if (!edtMatches && !estMatches) {
    throw new Error(
      `The time ${timeStr} on ${dateStr} does not exist in Ottawa (America/Toronto) due to the Spring-Forward Daylight Saving transition (clocks advance from 02:00 to 03:00). Please select an alternative time at or after 03:00.`
    );
  }

  // Autumn Repeated Hour (Fall-Back Transition):
  // Both offsets match. Policy: Default to earlier occurrence (first calendar arrival, EDT UTC-4).
  if (edtMatches && estMatches) {
    return candidateEdt;
  }

  return edtMatches ? candidateEdt : candidateEst;
}

export function ottawaToUtcIso(dateStr: string, timeStr: string): string {
  return ottawaToUtcDate(dateStr, timeStr).toISOString();
}

/**
 * Extracts the Ottawa local date component (YYYY-MM-DD) from a UTC Date or ISO string
 */
export function utcToOttawaDate(dateValue: string | Date): string {
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Extracts the Ottawa local time component (HH:mm) from a UTC Date or ISO string in 24h format for input[type="time"]
 */
export function utcToOttawaTime(dateValue: string | Date): string {
  const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  let hour = '00';
  let minute = '00';
  for (const p of parts) {
    if (p.type === 'hour') hour = p.value === '24' ? '00' : p.value.padStart(2, '0');
    if (p.type === 'minute') minute = p.value.padStart(2, '0');
  }

  return `${hour}:${minute}`;
}

export type AppointmentType =
  | 'telephone'
  | 'in_person'
  | 'on_site'
  | 'google_meet'
  | 'ms_teams'
  | 'zoom';

export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  telephone: 'Phone Call',
  in_person: 'Office Visit',
  on_site: 'Property Visit',
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
