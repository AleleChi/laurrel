export interface IcsEventDetails {
  uid: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  organizerEmail?: string;
  organizerName?: string;
  attendeeEmail?: string;
  attendeeName?: string;
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant iCalendar (.ics) string
 */
export function generateIcsInvitation(event: IcsEventDetails): string {
  const dtStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(event.start);
  const dtEnd = formatIcsDate(event.end);

  const organizerName = event.organizerName || 'Laurrel Services';
  const organizerEmail = event.organizerEmail || 'dispatch@laurrelservices.ca';
  const status = event.status || 'CONFIRMED';
  const location = event.location ? escapeIcsText(event.location) : 'Telephone / Location confirmed by coordinator';
  const summary = escapeIcsText(event.title);
  const description = escapeIcsText(event.description);

  let attendeeLine = '';
  if (event.attendeeEmail) {
    const attName = escapeIcsText(event.attendeeName || 'Valued Customer');
    attendeeLine = `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${attName}":mailto:${event.attendeeEmail}\r\n`;
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LAURREL SERVICES//Customer Consultations//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${event.uid}@laurrelservices.ca`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `STATUS:${status}`,
    `ORGANIZER;CN="${escapeIcsText(organizerName)}":mailto:${organizerEmail}`,
    attendeeLine ? attendeeLine.trim() : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}
