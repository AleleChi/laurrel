import { getDbPool } from './pool';

export interface WorkingDaySchedule {
  enabled: boolean;
  start: string; // HH:mm in America/Toronto
  end: string;   // HH:mm in America/Toronto
}

export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface AppointmentSettings {
  id: string;
  workingDays: Record<DayOfWeek, WorkingDaySchedule>;
  bufferMinutes: number;
  minNoticeHours: number;
  maxBookingDays: number;
  slotDurationMinutes: number;
  allowedChannels: string[];
  autoConfirm: boolean;
  blockedDates: string[];
  channelInstructions: Record<string, string>;
  officeAddress?: string | null;
  updatedAt: string;
  updatedBy?: string | null;
}

export const DEFAULT_WORKING_DAYS: Record<DayOfWeek, WorkingDaySchedule> = {
  monday: { enabled: true, start: '08:00', end: '18:00' },
  tuesday: { enabled: true, start: '08:00', end: '18:00' },
  wednesday: { enabled: true, start: '08:00', end: '18:00' },
  thursday: { enabled: true, start: '08:00', end: '18:00' },
  friday: { enabled: true, start: '08:00', end: '18:00' },
  saturday: { enabled: true, start: '09:00', end: '16:00' },
  sunday: { enabled: false, start: '09:00', end: '16:00' },
};

export const DEFAULT_ALLOWED_CHANNELS = ['telephone', 'on_site', 'google_meet'];

export async function getAppointmentSettings(): Promise<AppointmentSettings> {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('Database pool unavailable.');
  }

  const query = `
    SELECT
      id,
      working_days AS "workingDays",
      buffer_minutes AS "bufferMinutes",
      min_notice_hours AS "minNoticeHours",
      max_booking_days AS "maxBookingDays",
      slot_duration_minutes AS "slotDurationMinutes",
      allowed_channels AS "allowedChannels",
      auto_confirm AS "autoConfirm",
      blocked_dates AS "blockedDates",
      channel_instructions AS "channelInstructions",
      office_address AS "officeAddress",
      updated_at AS "updatedAt",
      updated_by AS "updatedBy"
    FROM appointment_settings
    WHERE id = 'default'
    LIMIT 1
  `;

  const { rows } = await pool.query(query);
  if (rows.length > 0) {
    return rows[0];
  }

  // Fallback initial insert
  const insertQuery = `
    INSERT INTO appointment_settings (id, working_days, buffer_minutes, min_notice_hours, max_booking_days, slot_duration_minutes, allowed_channels, auto_confirm, blocked_dates, channel_instructions)
    VALUES ('default', $1, 15, 2, 30, 30, $2, TRUE, '[]'::jsonb, '{}'::jsonb)
    RETURNING
      id,
      working_days AS "workingDays",
      buffer_minutes AS "bufferMinutes",
      min_notice_hours AS "minNoticeHours",
      max_booking_days AS "maxBookingDays",
      slot_duration_minutes AS "slotDurationMinutes",
      allowed_channels AS "allowedChannels",
      auto_confirm AS "autoConfirm",
      blocked_dates AS "blockedDates",
      channel_instructions AS "channelInstructions",
      office_address AS "officeAddress",
      updated_at AS "updatedAt",
      updated_by AS "updatedBy"
  `;

  const insertRes = await pool.query(insertQuery, [
    JSON.stringify(DEFAULT_WORKING_DAYS),
    JSON.stringify(DEFAULT_ALLOWED_CHANNELS),
  ]);
  return insertRes.rows[0];
}

export async function updateAppointmentSettings(
  data: Partial<Omit<AppointmentSettings, 'id' | 'updatedAt'>>,
  userId?: string
): Promise<AppointmentSettings> {
  const pool = getDbPool();
  if (!pool) {
    throw new Error('Database pool unavailable.');
  }

  const current = await getAppointmentSettings();

  const workingDays = data.workingDays ? JSON.stringify(data.workingDays) : JSON.stringify(current.workingDays);
  const bufferMinutes = data.bufferMinutes !== undefined ? data.bufferMinutes : current.bufferMinutes;
  const minNoticeHours = data.minNoticeHours !== undefined ? data.minNoticeHours : current.minNoticeHours;
  const maxBookingDays = data.maxBookingDays !== undefined ? data.maxBookingDays : current.maxBookingDays;
  const slotDurationMinutes = data.slotDurationMinutes !== undefined ? data.slotDurationMinutes : current.slotDurationMinutes;
  const allowedChannels = data.allowedChannels ? JSON.stringify(data.allowedChannels) : JSON.stringify(current.allowedChannels);
  const autoConfirm = data.autoConfirm !== undefined ? data.autoConfirm : current.autoConfirm;
  const blockedDates = data.blockedDates ? JSON.stringify(data.blockedDates) : JSON.stringify(current.blockedDates);
  const channelInstructions = data.channelInstructions ? JSON.stringify(data.channelInstructions) : JSON.stringify(current.channelInstructions);
  const officeAddress = data.officeAddress !== undefined ? data.officeAddress : (current.officeAddress || null);

  const query = `
    UPDATE appointment_settings
    SET
      working_days = $1,
      buffer_minutes = $2,
      min_notice_hours = $3,
      max_booking_days = $4,
      slot_duration_minutes = $5,
      allowed_channels = $6,
      auto_confirm = $7,
      blocked_dates = $8,
      channel_instructions = $9,
      office_address = $10,
      updated_at = NOW(),
      updated_by = $11
    WHERE id = 'default'
    RETURNING
      id,
      working_days AS "workingDays",
      buffer_minutes AS "bufferMinutes",
      min_notice_hours AS "minNoticeHours",
      max_booking_days AS "maxBookingDays",
      slot_duration_minutes AS "slotDurationMinutes",
      allowed_channels AS "allowedChannels",
      auto_confirm AS "autoConfirm",
      blocked_dates AS "blockedDates",
      channel_instructions AS "channelInstructions",
      office_address AS "officeAddress",
      updated_at AS "updatedAt",
      updated_by AS "updatedBy"
  `;

  const { rows } = await pool.query(query, [
    workingDays,
    bufferMinutes,
    minNoticeHours,
    maxBookingDays,
    slotDurationMinutes,
    allowedChannels,
    autoConfirm,
    blockedDates,
    channelInstructions,
    officeAddress,
    userId || null,
  ]);

  return rows[0];
}
