import crypto from 'crypto';
import { getDbPool } from './pool';
import { AppointmentType } from '../services/video/types';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'rescheduled'
  | 'cancelled'
  | 'no_show';

export interface AppointmentRecord {
  id: string;
  enquiryId: string;
  title: string;
  purpose?: string | null;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  timezone: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  locationOrLink?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  staffNotes?: string | null;
  notificationSent: boolean;
  notificationSentAt?: string | null;
  idempotencyKey?: string | null;
  cancellationReason?: string | null;
  rescheduledFromId?: string | null;
  createdBy?: string | null;
  managementToken?: string | null;
  calendarEventId?: string | null;
  serviceAddress?: string | null;
  bookingSource?: string | null;
  customerTimezone?: string | null;
  customerNotes?: string | null;
  conferenceStatus?: string | null;
  conferenceId?: string | null;
  googleSyncStatus?: string | null;
  googleSyncError?: string | null;
  conferenceRetryCount?: number;
  conferenceNextRetryAt?: string | null;
  conferenceReconciledAt?: string | null;
  reconciliationClaimedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentActivityRecord {
  id: string;
  appointmentId: string;
  action: string;
  performedBy: string;
  details?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface AppointmentNotificationRecord {
  id: string;
  appointmentId: string;
  recipientEmail: string;
  notificationType: string;
  status: 'sent' | 'failed';
  errorMessage?: string | null;
  sentAt: string;
}

export interface CreateAppointmentInput {
  enquiryId: string;
  title: string;
  purpose?: string;
  appointmentType: AppointmentType;
  status?: AppointmentStatus;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
  durationMinutes: number;
  timezone?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  locationOrLink?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  staffNotes?: string;
  idempotencyKey?: string;
  createdBy?: string;
}

export interface CreateAppointmentResult {
  appointment: AppointmentRecord;
  isNew: boolean;
}

export interface AppointmentFilterOptions {
  enquiryId?: string;
  status?: string;
  assignedStaffId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  limit?: number;
}

function mapRowToAppointment(row: any): AppointmentRecord {
  return {
    id: row.id,
    enquiryId: row.enquiry_id,
    title: row.title,
    purpose: row.purpose,
    appointmentType: row.appointment_type,
    status: row.status,
    scheduledStart: row.scheduled_start instanceof Date ? row.scheduled_start.toISOString() : row.scheduled_start,
    scheduledEnd: row.scheduled_end instanceof Date ? row.scheduled_end.toISOString() : row.scheduled_end,
    durationMinutes: Number(row.duration_minutes),
    timezone: row.timezone,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    locationOrLink: row.location_or_link,
    assignedStaffId: row.assigned_staff_id,
    assignedStaffName: row.assigned_staff_name,
    staffNotes: row.staff_notes,
    notificationSent: Boolean(row.notification_sent),
    notificationSentAt: row.notification_sent_at ? new Date(row.notification_sent_at).toISOString() : null,
    idempotencyKey: row.idempotency_key,
    cancellationReason: row.cancellation_reason,
    rescheduledFromId: row.rescheduled_from_id,
    createdBy: row.created_by,
    managementToken: row.management_token,
    calendarEventId: row.calendar_event_id,
    serviceAddress: row.service_address,
    bookingSource: row.booking_source,
    customerTimezone: row.customer_timezone,
    customerNotes: row.customer_notes,
    conferenceStatus: row.conference_status || 'none',
    conferenceId: row.conference_id,
    googleSyncStatus: row.google_sync_status || 'not_applicable',
    googleSyncError: row.google_sync_error,
    conferenceRetryCount: row.conference_retry_count !== undefined && row.conference_retry_count !== null ? Number(row.conference_retry_count) : 0,
    conferenceNextRetryAt: row.conference_next_retry_at instanceof Date ? row.conference_next_retry_at.toISOString() : (row.conference_next_retry_at || null),
    conferenceReconciledAt: row.conference_reconciled_at instanceof Date ? row.conference_reconciled_at.toISOString() : (row.conference_reconciled_at || null),
    reconciliationClaimedAt: row.reconciliation_claimed_at instanceof Date ? row.reconciliation_claimed_at.toISOString() : (row.reconciliation_claimed_at || null),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

/**
 * Creates an appointment with idempotency protection, staff conflict checks, and atomic audit logging.
 */
export async function createAppointment(
  data: CreateAppointmentInput,
  performedBy: string
): Promise<CreateAppointmentResult> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database connection pool is not available.');

  // Idempotency check: if an appointment with this key was already created, return it safely
  if (data.idempotencyKey) {
    const existing = await pool.query(
      `SELECT * FROM appointments WHERE idempotency_key = $1`,
      [data.idempotencyKey]
    );
    if (existing.rows.length > 0) {
      return { appointment: mapRowToAppointment(existing.rows[0]), isNew: false };
    }
  }

  // Validate enquiry exists
  const enqCheck = await pool.query(`SELECT id FROM enquiries WHERE id = $1`, [data.enquiryId]);
  if (enqCheck.rows.length === 0) {
    throw new Error(`Referenced enquiry '${data.enquiryId}' does not exist.`);
  }

  const startDate = data.scheduledStart instanceof Date ? data.scheduledStart : new Date(data.scheduledStart);
  const endDate = data.scheduledEnd instanceof Date ? data.scheduledEnd : new Date(data.scheduledEnd);
  const initialStatus: AppointmentStatus = data.status || 'pending';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Real staff double-booking prevention check within transaction
    if (data.assignedStaffId) {
      // 1. Lock the staff member row to serialize concurrent bookings for the same coordinator
      await client.query(
        `SELECT id FROM admin_users WHERE id = $1 FOR UPDATE`,
        [data.assignedStaffId]
      );

      // 2. Check for overlapping active appointments
      const conflictRes = await client.query(
        `SELECT id, title, scheduled_start, scheduled_end, customer_name FROM appointments
         WHERE assigned_staff_id = $1
           AND status NOT IN ('cancelled', 'no_show')
           AND (scheduled_start < $3 AND scheduled_end > $2)
         LIMIT 1
         FOR UPDATE`,
        [data.assignedStaffId, startDate, endDate]
      );

      if (conflictRes.rows.length > 0) {
        const c = conflictRes.rows[0];
        const err: any = new Error(
          `Staff member is already booked for "${c.title}" during this time window (${new Date(c.scheduled_start).toISOString()} - ${new Date(c.scheduled_end).toISOString()}).`
        );
        err.code = 'STAFF_CONFLICT';
        err.conflict = mapRowToAppointment(c);
        throw err;
      }
    }

    const appointmentId = `apt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const activityId = `act_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const insertSql = `
      INSERT INTO appointments (
        id, enquiry_id, title, purpose, appointment_type, status,
        scheduled_start, scheduled_end, duration_minutes, timezone,
        customer_name, customer_email, customer_phone, location_or_link,
        assigned_staff_id, assigned_staff_name, staff_notes, idempotency_key,
        created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, NOW(), NOW()
      ) RETURNING *
    `;

    let res;
    try {
      res = await client.query(insertSql, [
        appointmentId,
        data.enquiryId,
        data.title,
        data.purpose || null,
        data.appointmentType,
        initialStatus,
        startDate,
        endDate,
        data.durationMinutes,
        data.timezone || 'America/Toronto',
        data.customerName,
        data.customerEmail,
        data.customerPhone || null,
        data.locationOrLink || null,
        data.assignedStaffId || null,
        data.assignedStaffName || null,
        data.staffNotes || null,
        data.idempotencyKey || null,
        data.createdBy || null,
      ]);
    } catch (insertErr: any) {
      // Safe concurrent idempotency protection: catch unique constraint race (23505)
      if (insertErr.code === '23505' && data.idempotencyKey) {
        await client.query('ROLLBACK');
        const retryQuery = await pool.query(
          `SELECT * FROM appointments WHERE idempotency_key = $1`,
          [data.idempotencyKey]
        );
        if (retryQuery.rows.length > 0) {
          return { appointment: mapRowToAppointment(retryQuery.rows[0]), isNew: false };
        }
      }
      throw insertErr;
    }

    // Record initial creation activity
    await client.query(
      `INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details, metadata, created_at)
       VALUES ($1, $2, 'created', $3, $4, $5, NOW())`,
      [
        activityId,
        appointmentId,
        performedBy,
        `Appointment booked in calendar as ${initialStatus}.`,
        JSON.stringify({
          appointmentType: data.appointmentType,
          status: initialStatus,
          scheduledStart: startDate.toISOString(),
          durationMinutes: data.durationMinutes,
        }),
      ]
    );

    // Also append an internal CRM note to the enquiry for unified traceability
    const noteId = `note_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO enquiry_notes (id, enquiry_id, author, note, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        noteId,
        data.enquiryId,
        performedBy,
        `Scheduled consultation: "${data.title}" (${data.appointmentType}) for ${startDate.toISOString()} [${initialStatus}]`,
      ]
    );

    await client.query('COMMIT');
    return { appointment: mapRowToAppointment(res.rows[0]), isNew: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Retrieves single appointment by ID
 */
export async function getAppointmentById(id: string): Promise<AppointmentRecord | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const res = await pool.query(`SELECT * FROM appointments WHERE id = $1`, [id]);
  if (res.rows.length === 0) return null;
  return mapRowToAppointment(res.rows[0]);
}

/**
 * Retrieves appointments for a specific customer enquiry
 */
export async function getAppointmentsByEnquiryId(enquiryId: string): Promise<AppointmentRecord[]> {
  const pool = getDbPool();
  if (!pool) return [];

  const res = await pool.query(
    `SELECT * FROM appointments WHERE enquiry_id = $1 ORDER BY scheduled_start DESC`,
    [enquiryId]
  );
  return res.rows.map(mapRowToAppointment);
}

/**
 * Lists appointments with filters
 */
export async function getAppointments(filters: AppointmentFilterOptions = {}): Promise<AppointmentRecord[]> {
  const pool = getDbPool();
  if (!pool) return [];

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (filters.enquiryId) {
    conditions.push(`enquiry_id = $${paramIdx++}`);
    values.push(filters.enquiryId);
  }

  if (filters.status && filters.status !== 'all') {
    conditions.push(`status = $${paramIdx++}`);
    values.push(filters.status);
  }

  if (filters.assignedStaffId && filters.assignedStaffId !== 'all') {
    conditions.push(`assigned_staff_id = $${paramIdx++}`);
    values.push(filters.assignedStaffId);
  }

  if (filters.startDate) {
    conditions.push(`scheduled_start >= $${paramIdx++}`);
    values.push(new Date(filters.startDate));
  }

  if (filters.endDate) {
    conditions.push(`scheduled_start <= $${paramIdx++}`);
    values.push(new Date(filters.endDate));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limitClause = filters.limit ? `LIMIT ${Number(filters.limit)}` : 'LIMIT 200';

  const query = `
    SELECT * FROM appointments
    ${whereClause}
    ORDER BY scheduled_start ASC
    ${limitClause}
  `;

  const res = await pool.query(query, values);
  return res.rows.map(mapRowToAppointment);
}

/**
 * Updates status of an appointment (e.g. confirm, complete, no-show)
 */
export async function updateAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus,
  performedBy: string,
  reason?: string
): Promise<AppointmentRecord> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool not available');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(
      `UPDATE appointments
       SET status = $1, cancellation_reason = COALESCE($2, cancellation_reason), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newStatus, reason || null, id]
    );

    if (updateRes.rows.length === 0) {
      throw new Error(`Appointment with ID '${id}' not found.`);
    }

    const activityId = `act_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        activityId,
        id,
        newStatus,
        performedBy,
        reason ? `Status changed to ${newStatus}. Reason: ${reason}` : `Status changed to ${newStatus}.`,
      ]
    );

    await client.query('COMMIT');
    return mapRowToAppointment(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Reschedules an appointment to a new time
 */
export async function rescheduleAppointment(
  id: string,
  newStart: string | Date,
  newEnd: string | Date,
  durationMinutes: number,
  reason: string,
  performedBy: string
): Promise<AppointmentRecord> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool not available');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const startDate = newStart instanceof Date ? newStart : new Date(newStart);
    const endDate = newEnd instanceof Date ? newEnd : new Date(newEnd);

    // Lock existing record and verify assigned staff availability
    const currentRes = await client.query(
      `SELECT * FROM appointments WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (currentRes.rows.length === 0) {
      throw new Error(`Appointment '${id}' not found.`);
    }
    const current = currentRes.rows[0];

    // Real staff double-booking prevention check on reschedule
    if (current.assigned_staff_id) {
      // 1. Lock the staff member row to serialize concurrent rescheduling for the same coordinator
      await client.query(
        `SELECT id FROM admin_users WHERE id = $1 FOR UPDATE`,
        [current.assigned_staff_id]
      );

      // 2. Check for overlapping appointments excluding current appointment
      const conflictRes = await client.query(
        `SELECT id, title, scheduled_start, scheduled_end, customer_name FROM appointments
         WHERE assigned_staff_id = $1
           AND id != $2
           AND status NOT IN ('cancelled', 'no_show')
           AND (scheduled_start < $4 AND scheduled_end > $3)
         LIMIT 1
         FOR UPDATE`,
        [current.assigned_staff_id, id, startDate, endDate]
      );

      if (conflictRes.rows.length > 0) {
        const c = conflictRes.rows[0];
        const err: any = new Error(
          `Cannot reschedule: Staff coordinator is already booked for "${c.title}" during the requested time window.`
        );
        err.code = 'STAFF_CONFLICT';
        err.conflict = mapRowToAppointment(c);
        throw err;
      }
    }

    const updateRes = await client.query(
      `UPDATE appointments
       SET scheduled_start = $1, scheduled_end = $2, duration_minutes = $3,
           status = 'rescheduled', updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [startDate, endDate, durationMinutes, id]
    );

    const activityId = `act_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details, metadata, created_at)
       VALUES ($1, $2, 'rescheduled', $3, $4, $5, NOW())`,
      [
        activityId,
        id,
        performedBy,
        `Rescheduled to ${startDate.toISOString()}. Reason: ${reason || 'Customer or staff requested change.'}`,
        JSON.stringify({ newStart: startDate.toISOString(), newEnd: endDate.toISOString(), reason }),
      ]
    );

    // Also append an internal CRM note to the enquiry
    const noteId = `note_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO enquiry_notes (id, enquiry_id, author, note, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        noteId,
        updateRes.rows[0].enquiry_id,
        performedBy,
        `Appointment rescheduled to ${startDate.toISOString()}${reason ? ` (${reason})` : ''}`,
      ]
    );

    await client.query('COMMIT');
    return mapRowToAppointment(updateRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cancels an appointment
 */
export async function cancelAppointment(
  id: string,
  reason: string,
  performedBy: string
): Promise<AppointmentRecord> {
  return updateAppointmentStatus(id, 'cancelled', performedBy, reason);
}

/**
 * Checks for staff schedule conflicts in a given window
 */
export async function checkStaffConflict(
  staffId: string,
  startTime: string | Date,
  endTime: string | Date,
  excludeAppointmentId?: string
): Promise<AppointmentRecord | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const start = startTime instanceof Date ? startTime : new Date(startTime);
  const end = endTime instanceof Date ? endTime : new Date(endTime);

  const excludeClause = excludeAppointmentId ? `AND id != $4` : '';
  const values: any[] = [staffId, start, end];
  if (excludeAppointmentId) values.push(excludeAppointmentId);

  const res = await pool.query(
    `SELECT * FROM appointments
     WHERE assigned_staff_id = $1
       AND status NOT IN ('cancelled', 'no_show')
       AND (scheduled_start < $3 AND scheduled_end > $2)
       ${excludeClause}
     LIMIT 1`,
    values
  );

  if (res.rows.length === 0) return null;
  return mapRowToAppointment(res.rows[0]);
}

/**
 * Records an email notification dispatch attempt
 */
export async function recordAppointmentNotification(
  appointmentId: string,
  recipientEmail: string,
  notificationType: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  const notifId = `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  await pool.query(
    `INSERT INTO appointment_notifications (id, appointment_id, recipient_email, notification_type, status, error_message, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [notifId, appointmentId, recipientEmail, notificationType, status, errorMessage || null]
  );

  if (status === 'sent') {
    await pool.query(
      `UPDATE appointments SET notification_sent = TRUE, notification_sent_at = NOW() WHERE id = $1`,
      [appointmentId]
    );
  }
}

/**
 * Retrieves activity logs for an appointment
 */
export async function getAppointmentActivity(appointmentId: string): Promise<AppointmentActivityRecord[]> {
  const pool = getDbPool();
  if (!pool) return [];

  const res = await pool.query(
    `SELECT * FROM appointment_activity WHERE appointment_id = $1 ORDER BY created_at DESC`,
    [appointmentId]
  );

  return res.rows.map((row) => ({
    id: row.id,
    appointmentId: row.appointment_id,
    action: row.action,
    performedBy: row.performed_by,
    details: row.details,
    metadata: row.metadata,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  }));
}
