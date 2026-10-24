import { getDbPool } from '../../database/pool';
import { getAppointmentSettings, DayOfWeek, AppointmentSettings } from '../../database/settingsRepo';
import { getProviderIntegration } from '../../database/integrationRepo';
import { checkGoogleFreeBusy } from '../video/googleCalendarClient';

export interface AvailableSlot {
  startUtc: string;
  endUtc: string;
  ottawaTime: string;
  customerTime: string;
  availableStaffId: string;
  availableStaffName: string;
}

export interface AvailabilityResult {
  date: string;
  timezone: string;
  ottawaTimezone: string;
  dayEnabled: boolean;
  slots: AvailableSlot[];
  message?: string;
}

/**
 * Converts YYYY-MM-DD + HH:mm in Ottawa local time (America/Toronto) to UTC Date
 */
export function ottawaTimeToUtc(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  // In Ottawa (America/Toronto), offset is either UTC-4 (EDT) or UTC-5 (EST)
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const candEdt = new Date(Date.UTC(year, month - 1, day, hour + 4, minute, 0));
  const candEst = new Date(Date.UTC(year, month - 1, day, hour + 5, minute, 0));

  const checkMatch = (candidate: Date): boolean => {
    const parts = dtf.formatToParts(candidate);
    let pY = 0, pM = 0, pD = 0, pH = 0, pMin = 0;
    for (const p of parts) {
      if (p.type === 'year') pY = Number(p.value);
      if (p.type === 'month') pM = Number(p.value);
      if (p.type === 'day') pD = Number(p.value);
      if (p.type === 'hour') pH = p.value === '24' ? 0 : Number(p.value);
      if (p.type === 'minute') pMin = Number(p.value);
    }
    return pY === year && pM === month && pD === day && pH === hour && pMin === minute;
  };

  if (checkMatch(candEdt)) return candEdt;
  if (checkMatch(candEst)) return candEst;

  return candEdt;
}

/**
 * Extracts Ottawa (America/Toronto) date string (YYYY-MM-DD) and time string (HH:mm) from a UTC Date
 */
export function utcToOttawaTime(utcDate: Date): { dateStr: string; timeStr: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(utcDate);

  let year = '', month = '', day = '', hour = 0, minute = 0;
  for (const p of parts) {
    if (p.type === 'year') year = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'hour') hour = p.value === '24' ? 0 : Number(p.value);
    if (p.type === 'minute') minute = Number(p.value);
  }

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  return { dateStr, timeStr, hour, minute };
}

/**
 * Formats a Date object in a given target IANA timezone
 */
export function formatTimeRangeInZone(start: Date, end: Date, timeZone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    const startStr = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(start);
    const endParts = fmt.formatToParts(end);
    let endHour = '', endMin = '', endPeriod = '', tzName = '';
    for (const p of endParts) {
      if (p.type === 'hour') endHour = p.value;
      if (p.type === 'minute') endMin = p.value;
      if (p.type === 'dayPeriod') endPeriod = p.value;
      if (p.type === 'timeZoneName') tzName = p.value;
    }
    return `${startStr} – ${endHour}:${endMin} ${endPeriod} (${tzName})`;
  } catch {
    return `${start.toISOString()} - ${end.toISOString()}`;
  }
}

/**
 * Determine day of week string in Ottawa local time for a YYYY-MM-DD string
 */
export function getOttawaDayOfWeek(dateStr: string): DayOfWeek {
  const sampleUtc = ottawaTimeToUtc(dateStr, '12:00');
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    weekday: 'long',
  })
    .format(sampleUtc)
    .toLowerCase();

  return weekday as DayOfWeek;
}

/**
 * Validates whether a requested appointment time slot complies with all operational,
 * business hour, channel, horizon, notice, and slot boundary rules.
 */
export async function validateBookingSlot(params: {
  start: Date;
  appointmentType: string;
  settings: AppointmentSettings;
}): Promise<{ valid: boolean; error?: string; dateStr?: string }> {
  const { start, appointmentType, settings } = params;
  const now = Date.now();

  // 1. Minimum Notice check
  const minNoticeHours = settings.minNoticeHours || 2;
  const minNoticeMs = minNoticeHours * 3600 * 1000;
  if (start.getTime() < now + minNoticeMs) {
    return {
      valid: false,
      error: `Consultations must be scheduled at least ${minNoticeHours} hours in advance.`,
    };
  }

  // 2. Maximum Booking Horizon check
  const maxBookingDays = settings.maxBookingDays || 30;
  const maxHorizonMs = maxBookingDays * 86400 * 1000;
  if (start.getTime() > now + maxHorizonMs) {
    return {
      valid: false,
      error: `Consultations can only be scheduled up to ${maxBookingDays} days in advance.`,
    };
  }

  // 3. Allowed Consultation Channel check
  const type = appointmentType.toLowerCase().trim();
  if (settings.allowedChannels && !settings.allowedChannels.includes(type)) {
    return {
      valid: false,
      error: `The consultation format '${type}' is currently unavailable for booking.`,
    };
  }

  // 4. Ottawa Local Date & Operating Day check
  const { dateStr, hour, minute } = utcToOttawaTime(start);
  const dayOfWeek = getOttawaDayOfWeek(dateStr);
  const dayConfig = settings.workingDays[dayOfWeek];

  if (!dayConfig || !dayConfig.enabled) {
    return {
      valid: false,
      error: `Laurrel Services is closed on ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}s. Please select an available business day.`,
    };
  }

  // 5. Blocked Dates / Holidays check
  if (settings.blockedDates && settings.blockedDates.includes(dateStr)) {
    return {
      valid: false,
      error: `Consultations are unavailable on ${dateStr} due to a scheduled holiday or blackout date.`,
    };
  }

  // 6. Business Hours Range check (Ottawa local time)
  const [startH, startM] = dayConfig.start.split(':').map(Number);
  const [endH, endM] = dayConfig.end.split(':').map(Number);
  const dayStartMinutes = startH * 60 + startM;
  const dayEndMinutes = endH * 60 + endM;

  const slotDurationMinutes = settings.slotDurationMinutes || 30;
  const slotStartMinutes = hour * 60 + minute;
  const slotEndMinutes = slotStartMinutes + slotDurationMinutes;

  if (slotStartMinutes < dayStartMinutes || slotEndMinutes > dayEndMinutes) {
    return {
      valid: false,
      error: `Consultations on ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}s can only be scheduled between ${dayConfig.start} and ${dayConfig.end} Ottawa time.`,
    };
  }

  // 7. Approved Slot Boundary Alignment check
  const minutesSinceDayStart = slotStartMinutes - dayStartMinutes;
  if (minutesSinceDayStart % slotDurationMinutes !== 0) {
    return {
      valid: false,
      error: `Consultation start times must align with scheduled :${slotDurationMinutes.toString().padStart(2, '0')} minute slot intervals.`,
    };
  }

  // 8. External Calendar FreeBusy Conflict check for Google Meet
  if (type === 'google_meet') {
    const integration = await getProviderIntegration('google_meet');
    if (integration && integration.status === 'connected' && integration.syncCalendarConflicts) {
      const slotEnd = new Date(start.getTime() + slotDurationMinutes * 60000);
      const fb = await checkGoogleFreeBusy(start.toISOString(), slotEnd.toISOString());
      if (!fb.success) {
        return {
          valid: false,
          error: 'Unable to verify coordinator calendar availability with Google Workspace. Please choose telephone or on-site consultation.',
        };
      }
      const hasConflict = fb.busyIntervals.some((b) => {
        const bStart = new Date(b.start).getTime();
        const bEnd = new Date(b.end).getTime();
        return start.getTime() < bEnd && slotEnd.getTime() > bStart;
      });
      if (hasConflict) {
        return {
          valid: false,
          error: 'The requested time slot has an external Google Calendar conflict. Please choose another time.',
        };
      }
    }
  }

  return { valid: true, dateStr };
}

/**
 * Availability Engine: Generates genuinely available slots combining
 * Laurrel business hours, staff conflict locking, buffer windows, and Google FreeBusy.
 */
export async function getAvailableSlots(
  dateStr: string,
  appointmentType: string = 'telephone',
  customerTimezone: string = 'America/Toronto'
): Promise<AvailabilityResult> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const settings = await getAppointmentSettings();
  const dayOfWeek = getOttawaDayOfWeek(dateStr);
  const dayConfig = settings.workingDays[dayOfWeek];

  // 1. Check if business is open on this day
  if (!dayConfig || !dayConfig.enabled) {
    return {
      date: dateStr,
      timezone: customerTimezone,
      ottawaTimezone: 'America/Toronto',
      dayEnabled: false,
      slots: [],
      message: `Laurrel Services is closed on ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}s.`,
    };
  }

  // 2. Check blocked dates / holidays
  if (settings.blockedDates && settings.blockedDates.includes(dateStr)) {
    return {
      date: dateStr,
      timezone: customerTimezone,
      ottawaTimezone: 'America/Toronto',
      dayEnabled: false,
      slots: [],
      message: 'This date is marked as unavailable or a holiday.',
    };
  }

  // 3. Check allowed channels
  if (settings.allowedChannels && !settings.allowedChannels.includes(appointmentType)) {
    return {
      date: dateStr,
      timezone: customerTimezone,
      ottawaTimezone: 'America/Toronto',
      dayEnabled: true,
      slots: [],
      message: `The consultation format '${appointmentType}' is not currently available for public booking.`,
    };
  }

  // 4. Calculate timing bounds
  const now = Date.now();
  const minNoticeMs = (settings.minNoticeHours || 2) * 3600 * 1000;
  const maxHorizonMs = (settings.maxBookingDays || 30) * 86400 * 1000;
  const earliestAllowedStart = new Date(now + minNoticeMs);
  const latestAllowedStart = new Date(now + maxHorizonMs);

  const [startH, startM] = dayConfig.start.split(':').map(Number);
  const [endH, endM] = dayConfig.end.split(':').map(Number);

  const durationMinutes = settings.slotDurationMinutes || 30;
  const bufferMinutes = settings.bufferMinutes || 15;

  const dayStartMinutes = startH * 60 + startM;
  const dayEndMinutes = endH * 60 + endM;

  // 5. Query eligible staff coordinators
  const staffRes = await pool.query(
    `SELECT id, name FROM admin_users WHERE role IN ('owner', 'admin', 'operations_staff') ORDER BY role = 'owner' DESC, name ASC`
  );
  const eligibleStaff = staffRes.rows;

  if (eligibleStaff.length === 0) {
    return {
      date: dateStr,
      timezone: customerTimezone,
      ottawaTimezone: 'America/Toronto',
      dayEnabled: true,
      slots: [],
      message: 'No consultation coordinators are currently active.',
    };
  }

  // 6. Query existing Neon appointments for this day (with buffer window)
  const dayStartUtc = ottawaTimeToUtc(dateStr, dayConfig.start);
  const dayEndUtc = ottawaTimeToUtc(dateStr, dayConfig.end);

  const appointmentsRes = await pool.query(
    `
    SELECT
      id,
      assigned_staff_id AS "assignedStaffId",
      scheduled_start AS "scheduledStart",
      scheduled_end AS "scheduledEnd",
      status
    FROM appointments
    WHERE status NOT IN ('cancelled')
      AND scheduled_start < $2
      AND scheduled_end > $1
    `,
    [new Date(dayStartUtc.getTime() - 60 * 60000), new Date(dayEndUtc.getTime() + 60 * 60000)]
  );
  const existingApts = appointmentsRes.rows;

  // 7. Check Google Calendar FreeBusy if Google Meet is connected
  let googleBusyIntervals: { start: string; end: string }[] = [];
  if (appointmentType === 'google_meet') {
    const integration = await getProviderIntegration('google_meet');
    if (integration && integration.status === 'connected' && integration.syncCalendarConflicts) {
      const fb = await checkGoogleFreeBusy(dayStartUtc.toISOString(), dayEndUtc.toISOString());
      if (!fb.success) {
        return {
          date: dateStr,
          timezone: customerTimezone,
          ottawaTimezone: 'America/Toronto',
          dayEnabled: false,
          slots: [],
          message: 'Unable to verify coordinator calendar availability with Google Workspace. Please choose telephone or on-site consultation.',
        };
      }
      googleBusyIntervals = fb.busyIntervals;
    }
  }

  // 8. Generate and filter slots
  const availableSlots: AvailableSlot[] = [];

  for (let mins = dayStartMinutes; mins + durationMinutes <= dayEndMinutes; mins += durationMinutes) {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    const timeStr = `${h}:${m}`;

    const slotStart = ottawaTimeToUtc(dateStr, timeStr);
    const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60000);

    // Rule: must be within notice and booking horizon
    if (slotStart < earliestAllowedStart || slotStart > latestAllowedStart) {
      continue;
    }

    // Rule: Google FreeBusy check
    const overlapsGoogleBusy = googleBusyIntervals.some((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
    });

    if (overlapsGoogleBusy) {
      continue;
    }

    // Rule: Find at least one staff coordinator not conflicting in Neon
    const slotStartWithBuffer = slotStart.getTime() - bufferMinutes * 60000;
    const slotEndWithBuffer = slotEnd.getTime() + bufferMinutes * 60000;

    const assignedStaff = eligibleStaff.find((staff) => {
      const hasConflict = existingApts.some((apt) => {
        if (apt.assignedStaffId && apt.assignedStaffId !== staff.id) return false;
        const aptStart = new Date(apt.scheduledStart).getTime();
        const aptEnd = new Date(apt.scheduledEnd).getTime();
        return slotStartWithBuffer < aptEnd && slotEndWithBuffer > aptStart;
      });
      return !hasConflict;
    });

    if (assignedStaff) {
      const ottawaRange = formatTimeRangeInZone(slotStart, slotEnd, 'America/Toronto');
      const customerRange = formatTimeRangeInZone(slotStart, slotEnd, customerTimezone);

      availableSlots.push({
        startUtc: slotStart.toISOString(),
        endUtc: slotEnd.toISOString(),
        ottawaTime: ottawaRange,
        customerTime: customerRange,
        availableStaffId: assignedStaff.id,
        availableStaffName: assignedStaff.name,
      });
    }
  }

  return {
    date: dateStr,
    timezone: customerTimezone,
    ottawaTimezone: 'America/Toronto',
    dayEnabled: true,
    slots: availableSlots,
  };
}
