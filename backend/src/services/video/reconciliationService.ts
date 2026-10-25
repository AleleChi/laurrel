import { getDbPool } from '../../database/pool';
import { reconcileGoogleMeetConference } from './googleCalendarClient';
import { getEmailProvider } from '../email';

const CONFERENCE_BACKOFF_SECONDS = [15, 30, 60, 120, 300, 600, 900, 1800];
const MAX_CONFERENCE_RETRIES = CONFERENCE_BACKOFF_SECONDS.length;

export const NOTIFICATION_BACKOFF_SECONDS = [15, 60, 300, 900, 1800];
export const MAX_NOTIFICATION_RETRIES = 5;

const MEET_URL_REGEX = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/;

let workerInterval: NodeJS.Timeout | null = null;
let isWorkerRunning = false;

export interface ReconciliationResult {
  reconciled: boolean;
  joinUrl: string | null;
  status: 'ready' | 'pending_details' | 'failed' | 'already_processed' | 'not_applicable' | 'error';
  error?: string;
  nextRetryAt?: Date | null;
}

export interface OutboxDispatchResult {
  dispatched: boolean;
  status: 'sent' | 'pending' | 'failed' | 'cancelled' | 'already_claimed_or_completed' | 'error';
  error?: string;
  retryCount?: number;
  nextRetryAt?: Date | null;
}

/**
 * Recovers abandoned reconciling jobs whose leases have expired (e.g. after a process crash or Render restart).
 * Stale reconciling appointments (>5 minutes) are reset to pending_details for worker re-processing.
 */
export async function recoverAbandonedReconciliations(): Promise<number> {
  const pool = getDbPool();
  if (!pool) return 0;

  try {
    const res = await pool.query(`
      UPDATE appointments
      SET
        conference_status = 'pending_details',
        updated_at = NOW()
      WHERE appointment_type = 'google_meet'
        AND conference_status = 'reconciling'
        AND updated_at < NOW() - INTERVAL '5 minutes'
        AND status NOT IN ('cancelled', 'completed')
      RETURNING id
    `);

    if (res.rows.length > 0) {
      console.warn(`[Reconciliation Recovery] Recovered ${res.rows.length} abandoned reconciling jobs.`);
      for (const row of res.rows) {
        await pool.query(
          `INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
           VALUES ($1, $2, 'conference_recovered', 'Reconciliation Recovery', 'Stale reconciling lease recovered after worker restart')`,
          [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, row.id]
        );
      }
    }
    return res.rows.length;
  } catch (err: any) {
    console.warn('[Reconciliation Recovery Warning]:', err.message);
    return 0;
  }
}

/**
 * Process a single notification item from the persistent outbox.
 * Enforces atomic reservation, cancellation guards, and bounded retry backoff.
 */
export async function processNotificationOutboxItem(notificationId: string): Promise<OutboxDispatchResult> {
  const pool = getDbPool();
  if (!pool) return { dispatched: false, status: 'error', error: 'Database pool unavailable' };

  // 1. Atomic outbox claim: prevent concurrent workers from dispatching simultaneously
  const claimRes = await pool.query(
    `
    UPDATE appointment_notifications
    SET
      status = 'dispatching',
      sent_at = NOW()
    WHERE id = $1
      AND (
        status = 'pending'
        OR (status = 'failed' AND (next_retry_at IS NULL OR next_retry_at <= NOW()) AND (retry_count IS NULL OR retry_count < $2))
        OR (status = 'dispatching' AND sent_at < NOW() - INTERVAL '5 minutes')
      )
    RETURNING id, appointment_id, recipient_email, notification_type, COALESCE(retry_count, 0) as retry_count
    `,
    [notificationId, MAX_NOTIFICATION_RETRIES]
  );

  if (claimRes.rows.length === 0) {
    return { dispatched: false, status: 'already_claimed_or_completed' };
  }

  const notif = claimRes.rows[0];
  const currentRetries = Number(notif.retry_count || 0);

  // 2. Fetch parent appointment to inspect current status & verified link
  const apptRes = await pool.query(
    `SELECT id, enquiry_id, customer_name, customer_email, title, purpose, appointment_type, status,
            scheduled_start, scheduled_end, duration_minutes, timezone, location_or_link, assigned_staff_name, conference_status
     FROM appointments WHERE id = $1`,
    [notif.appointment_id]
  );

  if (apptRes.rows.length === 0) {
    await pool.query(
      `UPDATE appointment_notifications SET status = 'failed', error_message = 'Appointment record not found' WHERE id = $1`,
      [notif.id]
    );
    return { dispatched: false, status: 'failed', error: 'Appointment record not found' };
  }

  const appointment = apptRes.rows[0];

  // 3. Ensure cancelled appointments do NOT receive stale meeting-ready notifications
  if (appointment.status === 'cancelled') {
    await pool.query(
      `UPDATE appointment_notifications
       SET status = 'cancelled', error_message = 'Appointment was cancelled before notification delivery'
       WHERE id = $1`,
      [notif.id]
    );
    await pool.query(
      `UPDATE appointments SET notification_status = 'cancelled', notification_error = 'Appointment was cancelled' WHERE id = $1`,
      [appointment.id]
    );
    return { dispatched: false, status: 'cancelled', error: 'Appointment was cancelled' };
  }

  // 4. Ensure customer only receives a joining link verified by Google Calendar
  const meetUrl = appointment.location_or_link;
  if (appointment.conference_status !== 'ready' || !meetUrl || !MEET_URL_REGEX.test(meetUrl)) {
    await pool.query(
      `UPDATE appointment_notifications SET status = 'pending', error_message = 'Waiting for verified Google Meet URL' WHERE id = $1`,
      [notif.id]
    );
    return { dispatched: false, status: 'pending', error: 'Unverified meeting URL' };
  }

  // 5. Dispatch customer email via transactional provider with idempotency key
  try {
    const emailProvider = getEmailProvider();
    const sendRes = await emailProvider.sendConferenceLinkReady({
      appointmentId: appointment.id,
      enquiryId: appointment.enquiry_id || '',
      customerName: appointment.customer_name,
      customerEmail: appointment.customer_email,
      title: appointment.title,
      purpose: appointment.purpose,
      appointmentType: appointment.appointment_type,
      status: appointment.status,
      scheduledStart: appointment.scheduled_start,
      scheduledEnd: appointment.scheduled_end,
      durationMinutes: appointment.duration_minutes || 30,
      timezone: appointment.timezone || 'America/Toronto',
      locationOrLink: meetUrl,
      assignedStaffName: appointment.assigned_staff_name,
    });

    if (sendRes.success) {
      await pool.query(
        `UPDATE appointment_notifications
         SET status = 'sent', error_message = NULL, sent_at = NOW()
         WHERE id = $1`,
        [notif.id]
      );
      await pool.query(
        `UPDATE appointments
         SET notification_sent = TRUE, notification_sent_at = NOW(), notification_status = 'sent', notification_error = NULL
         WHERE id = $1`,
        [appointment.id]
      );
      await pool.query(
        `INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
         VALUES ($1, $2, 'notification_sent', 'Notification Outbox', 'Verified Google Meet joining URL sent to customer')`,
        [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, appointment.id]
      );

      return { dispatched: true, status: 'sent', retryCount: currentRetries };
    } else {
      // Bounded retry attempts with appropriate backoff for temporary errors
      const newRetries = currentRetries + 1;
      const isPermanent = newRetries >= MAX_NOTIFICATION_RETRIES;
      const delaySeconds = NOTIFICATION_BACKOFF_SECONDS[newRetries - 1] || 1800;
      const nextRetryAt = isPermanent ? null : new Date(Date.now() + delaySeconds * 1000);
      const errMsg = sendRes.error || 'Email dispatch failed';

      await pool.query(
        `UPDATE appointment_notifications
         SET
           status = 'failed',
           retry_count = $1,
           next_retry_at = $2,
           error_message = $3,
           sent_at = NOW()
         WHERE id = $4`,
        [newRetries, nextRetryAt, isPermanent ? `Permanent failure (${MAX_NOTIFICATION_RETRIES} attempts): ${errMsg}` : errMsg, notif.id]
      );
      await pool.query(
        `UPDATE appointments
         SET notification_status = 'failed', notification_error = $1
         WHERE id = $2`,
        [isPermanent ? `Permanent delivery failure: ${errMsg}` : errMsg, appointment.id]
      );

      if (isPermanent) {
        await pool.query(
          `INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
           VALUES ($1, $2, 'notification_failed_permanent', 'Notification Outbox', $3)`,
          [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, appointment.id, `Customer notification failed permanently after ${MAX_NOTIFICATION_RETRIES} attempts: ${errMsg}`]
        );
      }

      return { dispatched: false, status: 'failed', error: errMsg, retryCount: newRetries, nextRetryAt };
    }
  } catch (dispatchErr: any) {
    const newRetries = currentRetries + 1;
    const isPermanent = newRetries >= MAX_NOTIFICATION_RETRIES;
    const delaySeconds = NOTIFICATION_BACKOFF_SECONDS[newRetries - 1] || 1800;
    const nextRetryAt = isPermanent ? null : new Date(Date.now() + delaySeconds * 1000);
    const errMsg = dispatchErr.message || 'Email dispatch exception';

    await pool.query(
      `UPDATE appointment_notifications
       SET
         status = 'failed',
         retry_count = $1,
         next_retry_at = $2,
         error_message = $3,
         sent_at = NOW()
       WHERE id = $4`,
      [newRetries, nextRetryAt, isPermanent ? `Permanent failure (${MAX_NOTIFICATION_RETRIES} attempts): ${errMsg}` : errMsg, notif.id]
    );
    await pool.query(
      `UPDATE appointments
       SET notification_status = 'failed', notification_error = $1
       WHERE id = $2`,
      [isPermanent ? `Permanent delivery failure: ${errMsg}` : errMsg, appointment.id]
    );

    return { dispatched: false, status: 'failed', error: errMsg, retryCount: newRetries, nextRetryAt };
  }
}

/**
 * Transaction-safe claiming and reconciliation of a pending Google Meet conference.
 * Upon successful Google Meet generation, atomically transitions conference_status to 'ready'
 * and records a pending customer notification in the outbox within a single database transaction.
 */
export async function claimAndReconcileAppointment(
  appointmentId: string,
  performedBy: string = 'Reconciliation Worker'
): Promise<ReconciliationResult> {
  const pool = getDbPool();
  if (!pool) return { reconciled: false, joinUrl: null, status: 'error', error: 'Database pool unavailable' };

  const client = await pool.connect();
  let appointment: any = null;

  try {
    await client.query('BEGIN');

    // 1. Atomic claim: transition from 'pending_details' (or stale lease) to 'reconciling'
    const claimRes = await client.query(
      `
      UPDATE appointments
      SET
        conference_status = 'reconciling',
        updated_at = NOW()
      WHERE id = $1
        AND (
          conference_status = 'pending_details'
          OR (
            conference_status = 'reconciling'
            AND updated_at < NOW() - INTERVAL '5 minutes'
          )
        )
      RETURNING *
      `,
      [appointmentId]
    );

    if (claimRes.rows.length === 0) {
      const checkRes = await client.query('SELECT * FROM appointments WHERE id = $1 LIMIT 1', [appointmentId]);
      await client.query('COMMIT');

      if (checkRes.rows.length === 0) {
        return { reconciled: false, joinUrl: null, status: 'error', error: 'Appointment not found' };
      }

      const existing = checkRes.rows[0];
      if (existing.conference_status === 'ready' && existing.location_or_link) {
        return { reconciled: true, joinUrl: existing.location_or_link, status: 'ready' };
      }
      return {
        reconciled: false,
        joinUrl: existing.location_or_link || null,
        status: existing.conference_status || 'already_processed',
      };
    }

    appointment = claimRes.rows[0];
    await client.query('COMMIT');
  } catch (claimErr: any) {
    await client.query('ROLLBACK');
    console.error('[Reconciliation Claim Error]:', claimErr.message);
    return { reconciled: false, joinUrl: null, status: 'error', error: claimErr.message };
  } finally {
    client.release();
  }

  // 2. Query Google Calendar API for conferenceData outside database transaction
  if (!appointment.calendar_event_id) {
    await pool.query(
      `UPDATE appointments SET conference_status = 'failed', google_sync_status = 'failed', google_sync_error = 'Missing calendar event ID', updated_at = NOW() WHERE id = $1`,
      [appointment.id]
    );
    return { reconciled: false, joinUrl: null, status: 'failed', error: 'Missing calendar event ID' };
  }

  const rec = await reconcileGoogleMeetConference(appointment.calendar_event_id);

  // 3. Apply state transition based on Google Calendar API result
  if (rec.status === 'ready' && rec.joinUrl) {
    const meetUrl = rec.joinUrl;
    const notifClaimId = `notif_ready_${appointment.id}`;

    // REQUIREMENT 1: Persist the successful conference status and pending customer notification
    // in a single database transaction.
    const txClient = await pool.connect();
    try {
      await txClient.query('BEGIN');

      // Update appointment to ready with verified meet link
      await txClient.query(
        `
        UPDATE appointments
        SET
          location_or_link = $1,
          conference_status = 'ready',
          google_sync_status = 'synced',
          google_sync_error = NULL,
          conference_reconciled_at = NOW(),
          notification_status = 'pending',
          notification_error = NULL,
          updated_at = NOW()
        WHERE id = $2
        `,
        [meetUrl, appointment.id]
      );

      // Audit activity
      await txClient.query(
        `
        INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
        VALUES ($1, $2, 'conference_reconciled', $3, 'Google Meet video conference link verified and active')
        `,
        [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, appointment.id, performedBy]
      );

      // Enqueue notification in outbox in the same transaction
      await txClient.query(
        `
        INSERT INTO appointment_notifications (
          id, appointment_id, recipient_email, notification_type, status, error_message, retry_count, next_retry_at, sent_at
        )
        VALUES ($1, $2, $3, 'video_link_ready', 'pending', NULL, 0, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          status = CASE WHEN appointment_notifications.status = 'sent' THEN 'sent' ELSE 'pending' END,
          error_message = NULL,
          next_retry_at = NOW()
        WHERE appointment_notifications.status != 'sent'
        `,
        [notifClaimId, appointment.id, appointment.customer_email]
      );

      await txClient.query('COMMIT');
    } catch (txErr: any) {
      await txClient.query('ROLLBACK');
      console.error('[Reconciliation State Transition Error]:', txErr.message);
      return { reconciled: false, joinUrl: null, status: 'error', error: txErr.message };
    } finally {
      txClient.release();
    }

    // REQUIREMENT 2: Process customer notification delivery independently of conference generation.
    // If the process crashes immediately or Resend rejects, outbox processor will reliably retry.
    processNotificationOutboxItem(notifClaimId).catch((err) =>
      console.warn(`[Outbox Initial Dispatch Warning] Notification ID ${notifClaimId}:`, err.message)
    );

    return { reconciled: true, joinUrl: meetUrl, status: 'ready' };
  } else if (rec.status === 'failed') {
    const errorMsg = rec.error || 'Google Workspace video conference generation failed';
    await pool.query(
      `
      UPDATE appointments
      SET
        conference_status = 'failed',
        google_sync_status = 'failed',
        google_sync_error = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [errorMsg, appointment.id]
    );

    await pool.query(
      `
      INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
      VALUES ($1, $2, 'conference_failed', $3, $4)
      `,
      [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, appointment.id, performedBy, errorMsg]
    );

    return { reconciled: false, joinUrl: null, status: 'failed', error: errorMsg };
  } else {
    // Conference still pending from Google: schedule next exponential backoff retry
    const currentRetries = Number(appointment.conference_retry_count || 0);
    const newRetryCount = currentRetries + 1;

    if (newRetryCount >= MAX_CONFERENCE_RETRIES) {
      const errorMsg = 'Maximum reconciliation attempts reached without video conference generation';
      await pool.query(
        `
        UPDATE appointments
        SET
          conference_status = 'failed',
          google_sync_status = 'failed',
          google_sync_error = $1,
          updated_at = NOW()
        WHERE id = $2
        `,
        [errorMsg, appointment.id]
      );

      await pool.query(
        `
        INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
        VALUES ($1, $2, 'conference_failed', $3, $4)
        `,
        [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, appointment.id, performedBy, errorMsg]
      );

      return { reconciled: false, joinUrl: null, status: 'failed', error: errorMsg };
    }

    const delaySeconds = CONFERENCE_BACKOFF_SECONDS[newRetryCount - 1] || 1800;
    const nextRetryAt = new Date(Date.now() + delaySeconds * 1000);

    await pool.query(
      `
      UPDATE appointments
      SET
        conference_status = 'pending_details',
        conference_retry_count = $1,
        conference_next_retry_at = $2,
        updated_at = NOW()
      WHERE id = $3
      `,
      [newRetryCount, nextRetryAt, appointment.id]
    );

    return {
      reconciled: false,
      joinUrl: null,
      status: 'pending_details',
      nextRetryAt,
    };
  }
}

/**
 * Process due reconciliation jobs from the persistent database queue.
 * Safe across horizontal backend instances using FOR UPDATE SKIP LOCKED.
 */
export async function processReconciliationQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const pool = getDbPool();
  if (!pool) return { processed: 0, succeeded: 0, failed: 0 };

  const client = await pool.connect();
  let dueRows: Array<{ id: string }> = [];

  try {
    await client.query('BEGIN');

    const selectRes = await client.query(`
      SELECT id
      FROM appointments
      WHERE appointment_type = 'google_meet'
        AND (
          conference_status = 'pending_details'
          OR (
            conference_status = 'reconciling'
            AND updated_at < NOW() - INTERVAL '5 minutes'
          )
        )
        AND calendar_event_id IS NOT NULL
        AND status NOT IN ('cancelled', 'completed')
        AND (conference_next_retry_at IS NULL OR conference_next_retry_at <= NOW())
        AND conference_retry_count < $1
      ORDER BY conference_next_retry_at ASC NULLS FIRST
      FOR UPDATE SKIP LOCKED
      LIMIT 5
    `, [MAX_CONFERENCE_RETRIES]);

    dueRows = selectRes.rows;
    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.warn('[Reconciliation Queue Poll Error]:', err.message);
    return { processed: 0, succeeded: 0, failed: 0 };
  } finally {
    client.release();
  }

  let succeeded = 0;
  let failed = 0;

  for (const row of dueRows) {
    try {
      const result = await claimAndReconcileAppointment(row.id, 'Durable Reconciliation Worker');
      if (result.reconciled) {
        succeeded++;
      } else if (result.status === 'failed') {
        failed++;
      }
    } catch (err: any) {
      console.warn(`[Queue Item Process Warning] ID: ${row.id}:`, err.message);
      failed++;
    }
  }

  return { processed: dueRows.length, succeeded, failed };
}

/**
 * Process due customer notification outbox jobs.
 * Runs independently of Google Meet conference generation to guarantee that 'ready'
 * appointments with pending or temporarily failed deliveries are safely retried.
 */
export async function processNotificationOutbox(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const pool = getDbPool();
  if (!pool) return { processed: 0, succeeded: 0, failed: 0 };

  const client = await pool.connect();
  let dueNotifications: Array<{ id: string }> = [];

  try {
    await client.query('BEGIN');

    // REQUIREMENT 2: Process customer notification delivery independently of conference generation.
    // A 'ready' appointment is eligible for pending or failed notification delivery.
    const selectRes = await client.query(`
      SELECT an.id
      FROM appointment_notifications an
      JOIN appointments a ON a.id = an.appointment_id
      WHERE an.notification_type = 'video_link_ready'
        AND (
          an.status = 'pending'
          OR (
            an.status = 'failed'
            AND (an.next_retry_at IS NULL OR an.next_retry_at <= NOW())
            AND (an.retry_count IS NULL OR an.retry_count < $1)
          )
          OR (an.status = 'dispatching' AND an.sent_at < NOW() - INTERVAL '5 minutes')
        )
        AND a.status NOT IN ('cancelled', 'completed')
        AND a.conference_status = 'ready'
        AND a.location_or_link IS NOT NULL
      ORDER BY an.sent_at ASC
      FOR UPDATE OF an SKIP LOCKED
      LIMIT 10
    `, [MAX_NOTIFICATION_RETRIES]);

    dueNotifications = selectRes.rows;
    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.warn('[Notification Outbox Poll Warning]:', err.message);
    return { processed: 0, succeeded: 0, failed: 0 };
  } finally {
    client.release();
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of dueNotifications) {
    try {
      const res = await processNotificationOutboxItem(item.id);
      if (res.dispatched) {
        succeeded++;
      } else if (res.status === 'failed') {
        failed++;
      }
    } catch (err: any) {
      console.warn(`[Outbox Item Dispatch Warning] ID ${item.id}:`, err.message);
      failed++;
    }
  }

  return { processed: dueNotifications.length, succeeded, failed };
}

/**
 * Starts the durable background reconciliation and notification outbox worker.
 * Survives process restarts by evaluating both database-backed queues.
 */
export function startReconciliationWorker(intervalMs: number = 25000): void {
  if (workerInterval) return;

  console.log('[Reconciliation Service] Starting durable Google Meet & notification outbox worker...');

  // 1. Recover any stale/abandoned leases from prior process crashes
  recoverAbandonedReconciliations().catch((err) =>
    console.warn('[Reconciliation Lease Recovery Error]:', err.message)
  );

  // 2. Immediate initial drain of both queues on startup
  processReconciliationQueue().catch((err) =>
    console.warn('[Reconciliation Worker Startup Error]:', err.message)
  );
  processNotificationOutbox().catch((err) =>
    console.warn('[Notification Outbox Startup Error]:', err.message)
  );

  // 3. Periodic execution
  workerInterval = setInterval(async () => {
    if (isWorkerRunning) return;
    isWorkerRunning = true;
    try {
      await processReconciliationQueue();
      await processNotificationOutbox();
    } catch (err: any) {
      console.warn('[Reconciliation Worker Interval Error]:', err.message);
    } finally {
      isWorkerRunning = false;
    }
  }, intervalMs);
}

export function stopReconciliationWorker(): void {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Reconciliation Service] Stopped durable reconciliation worker.');
  }
}
