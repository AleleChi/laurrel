import { getDbPool } from '../../database/pool';
import { reconcileGoogleMeetConference } from './googleCalendarClient';
import { getEmailProvider } from '../email';

const BACKOFF_SCHEDULE_SECONDS = [15, 30, 60, 120, 300, 600, 900, 1800];
const MAX_RETRY_COUNT = BACKOFF_SCHEDULE_SECONDS.length;

let workerInterval: NodeJS.Timeout | null = null;
let isWorkerRunning = false;

export interface ReconciliationResult {
  reconciled: boolean;
  joinUrl: string | null;
  status: 'ready' | 'pending_details' | 'failed' | 'already_processed' | 'not_applicable' | 'error';
  error?: string;
  nextRetryAt?: Date | null;
}

/**
 * Transaction-safe claiming and reconciliation of a pending Google Meet conference.
 * Uses atomic state transitions to guarantee concurrent requests cannot generate duplicate customer notifications.
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

    // 1. Atomic claim: transition from 'pending_details' to 'reconciling'
    // Concurrency safeguard: only one worker/request can claim this appointment row
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
      // Row is either already 'ready', 'failed', currently claimed, or not pending
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

    await pool.query(
      `
      UPDATE appointments
      SET
        location_or_link = $1,
        conference_status = 'ready',
        google_sync_status = 'synced',
        google_sync_error = NULL,
        conference_reconciled_at = NOW(),
        updated_at = NOW()
      WHERE id = $2
      `,
      [meetUrl, appointment.id]
    );

    await pool.query(
      `
      INSERT INTO appointment_activity (id, appointment_id, action, performed_by, details)
      VALUES ($1, $2, 'conference_reconciled', $3, 'Google Meet video conference link verified and active')
      `,
      [`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, appointment.id, performedBy]
    );

    // 4. Guaranteed Single Customer Notification (Persistent Outbox Dispatch Claim)
    // Concurrency safeguard: atomic reservation with deterministic primary key prevents duplicate sends.
    const notifClaimId = `notif_ready_${appointment.id}`;
    let shouldDispatch = false;

    try {
      const claimNotifRes = await pool.query(
        `
        INSERT INTO appointment_notifications (
          id, appointment_id, recipient_email, notification_type, status, error_message, sent_at
        )
        VALUES ($1, $2, $3, 'video_link_ready', 'dispatching', NULL, NOW())
        ON CONFLICT (id) DO UPDATE
        SET
          status = 'dispatching',
          sent_at = NOW(),
          error_message = NULL
        WHERE appointment_notifications.status = 'failed'
           OR (
             appointment_notifications.status = 'dispatching'
             AND appointment_notifications.sent_at < NOW() - INTERVAL '5 minutes'
           )
        RETURNING id, status
        `,
        [notifClaimId, appointment.id, appointment.customer_email]
      );

      if (claimNotifRes.rows.length > 0) {
        shouldDispatch = true;
      }
    } catch (claimErr: any) {
      console.warn('[Notification Claim Warning]:', claimErr.message);
    }

    if (shouldDispatch) {
      let dispatchStatus: 'sent' | 'failed' = 'failed';
      let dispatchError: string | null = null;

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
          dispatchStatus = 'sent';
        } else {
          dispatchError = sendRes.error || 'Email dispatch failed';
        }
      } catch (emailErr: any) {
        dispatchError = emailErr.message || 'Email service error';
        console.warn('[Reconciliation Email Dispatch Error]:', emailErr.message);
      }

      await pool.query(
        `
        UPDATE appointment_notifications
        SET
          status = $1,
          error_message = $2,
          sent_at = NOW()
        WHERE id = $3
        `,
        [dispatchStatus, dispatchError, notifClaimId]
      );
    }

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

    if (newRetryCount >= MAX_RETRY_COUNT) {
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

    const delaySeconds = BACKOFF_SCHEDULE_SECONDS[newRetryCount - 1] || 1800;
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

export async function processReconciliationQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const pool = getDbPool();
  if (!pool) return { processed: 0, succeeded: 0, failed: 0 };

  const client = await pool.connect();
  let dueRows: Array<{ id: string }> = [];

  try {
    await client.query('BEGIN');

    // Claim due appointments using row-level locking with SKIP LOCKED
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
        AND conference_retry_count < 10
      ORDER BY conference_next_retry_at ASC NULLS FIRST
      FOR UPDATE SKIP LOCKED
      LIMIT 5
    `);

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
 * Starts the durable background reconciliation worker.
 * Survives process restarts by re-evaluating the database-backed queue.
 */
export function startReconciliationWorker(intervalMs: number = 25000): void {
  if (workerInterval) return;

  console.log('[Reconciliation Service] Starting durable Google Meet reconciliation worker...');

  // Recover any stale/abandoned leases from prior process crashes
  recoverAbandonedReconciliations().catch((err) =>
    console.warn('[Reconciliation Lease Recovery Error]:', err.message)
  );

  // Immediate initial drain on startup
  processReconciliationQueue().catch((err) =>
    console.warn('[Reconciliation Worker Startup Error]:', err.message)
  );

  workerInterval = setInterval(async () => {
    if (isWorkerRunning) return;
    isWorkerRunning = true;
    try {
      await processReconciliationQueue();
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
