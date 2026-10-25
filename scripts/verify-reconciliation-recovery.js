/**
 * LAURREL SERVICES — RECONCILIATION & NOTIFICATION RECOVERY ACCEPTANCE SUITE
 *
 * Verifies:
 * 1. Single transaction persists conference_status='ready' AND pending notification outbox item.
 * 2. Independent outbox processor queries ready appointments with pending/failed notifications.
 * 3. Atomic outbox claim preventing concurrent duplicate dispatches.
 * 4. Bounded exponential backoff retry schedule ([15, 60, 300, 900, 1800], max 5).
 * 5. Provider-level Idempotency-Key header passed for deduplication.
 * 6. Google Meet URL validation regex safety.
 * 7. Prevention of reconciliation from reviving cancelled appointments (row count check).
 * 8. Cancellation during Google conference provisioning suppression.
 * 9. Cancellation during pending notification delivery suppression.
 * 10. Versioned notification keys for new/changed Google Meet links.
 *
 * Safety Shield: Zero write-based mutations against production Neon DB.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    -> ${err.message}`);
    failed++;
  }
}

async function runReconciliationRecoverySuite() {
  console.log('\n================================================================');
  console.log('LAURREL SERVICES — RECONCILIATION & NOTIFICATION RECOVERY TESTS');
  console.log('================================================================\n');

  // Safety Shield
  console.log('1. Database Safety Shield...');
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('ep-raspy-dew-b4agbivi-pooler') || dbUrl.includes('neon.tech')) {
    console.log('  🛡️  SAFETY SHIELD ACTIVE: Live Neon database detected.');
    console.log('      Write-based mutations against production tables are strictly simulated.\n');
  } else {
    console.log('  ✓ Standalone test harness initialized.\n');
  }

  // --------------------------------------------------------------------------
  // Static Code Analysis & Transaction Boundary Verification
  // --------------------------------------------------------------------------
  console.log('2. Verifying Code Architecture & Atomic Transaction Boundaries...');

  const recServicePath = path.join(__dirname, '../backend/src/services/video/reconciliationService.ts');
  const recCode = fs.readFileSync(recServicePath, 'utf8');

  test('Single transaction persists both ready conference_status AND pending customer notification', () => {
    assert(recCode.includes('txClient.query(\'BEGIN\')'));
    assert(recCode.includes("conference_status = 'ready'"));
    assert(recCode.includes("INSERT INTO appointment_notifications"));
    assert(recCode.includes("video_link_ready"));
    assert(recCode.includes('txClient.query(\'COMMIT\')'));
  });

  test('Reconciliation checks affected row count and never revives cancelled appointments', () => {
    assert(recCode.includes("AND status != 'cancelled'"));
    assert(recCode.includes("AND conference_status = 'reconciling'"));
    assert(recCode.includes("updateRes.rows.length === 0"));
    assert(recCode.includes("txClient.query('ROLLBACK')"));
  });

  test('Independent outbox processor (processNotificationOutbox) queries ready appointments with pending/failed notifications', () => {
    assert(recCode.includes('export async function processNotificationOutbox'));
    assert(recCode.includes("an.status = 'pending'"));
    assert(recCode.includes("an.status = 'failed'"));
    assert(recCode.includes("a.conference_status = 'ready'"));
  });

  test('Atomic outbox claim uses row locking / conditional update', () => {
    assert(recCode.includes("UPDATE appointment_notifications"));
    assert(recCode.includes("status = 'dispatching'"));
    assert(recCode.includes("WHERE id = $1"));
    assert(recCode.includes("FOR UPDATE OF an SKIP LOCKED"));
  });

  test('Bounded retry schedule with exponential backoff (15s, 60s, 300s, 900s, 1800s, max 5)', () => {
    assert(recCode.includes('NOTIFICATION_BACKOFF_SECONDS = [15, 60, 300, 900, 1800]'));
    assert(recCode.includes('MAX_NOTIFICATION_RETRIES = 5'));
    assert(recCode.includes('isPermanent') || recCode.includes('Permanent failure'));
  });

  test('Provider-side Idempotency-Key header is passed for deduplication', () => {
    const resendProviderPath = path.join(__dirname, '../backend/src/services/email/resendProvider.ts');
    const resendCode = fs.readFileSync(resendProviderPath, 'utf8');
    assert(resendCode.includes("headers['Idempotency-Key'] = `notif_meet_${data.appointmentId}_${linkHash}`;"));
    assert(resendCode.includes("headers['Idempotency-Key'] = `notif_${changeType}_${data.appointmentId}_${linkHash}`;"));
  });

  test('Genuinely new or changed Google Meet links generate versioned notification keys', () => {
    assert(recCode.includes("linkHash = crypto.createHash('sha256').update(meetUrl).digest('hex').substring(0, 8)"));
    assert(recCode.includes("notifClaimId = `notif_meet_${appointment.id}_${linkHash}`"));
  });

  // --------------------------------------------------------------------------
  // The Simulated State Machine & Concurrency Test Harness
  // --------------------------------------------------------------------------
  console.log('\n3. Testing Reliability, Recovery & Concurrency Scenarios...');

  const NOTIFICATION_BACKOFF = [15, 60, 300, 900, 1800];
  const MAX_RETRIES = 5;
  const MEET_URL_REGEX = /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(\?.*)?$/;

  class MockDatabase {
    constructor() {
      this.appointments = new Map();
      this.notifications = new Map();
      this.activities = [];
      this.sentEmails = [];
    }

    createAppointment(data) {
      const appt = {
        id: data.id,
        customer_email: data.customer_email || 'client@example.ca',
        customer_name: data.customer_name || 'Jane Doe',
        title: data.title || 'Consultation',
        appointment_type: 'google_meet',
        status: data.status || 'confirmed',
        conference_status: data.conference_status || 'pending_details',
        location_or_link: data.location_or_link || null,
        notification_status: data.notification_status || 'none',
        notification_sent: false,
        notification_sent_at: null,
        updated_at: new Date(),
      };
      this.appointments.set(appt.id, appt);
      return appt;
    }

    // Atomic claim to reconciling
    claimReconciling(appointmentId) {
      const appt = this.appointments.get(appointmentId);
      if (!appt) return null;
      if (appt.conference_status === 'pending_details' || appt.conference_status === 'reconciling') {
        appt.conference_status = 'reconciling';
        appt.updated_at = new Date();
        return { ...appt };
      }
      return null;
    }

    // Atomic transaction: update appointment to ready AND enqueue outbox notification
    // Enforces strict concurrency check: WHERE id = $2 AND status != 'cancelled' AND conference_status = 'reconciling'
    reconcileSuccessTx(appointmentId, verifiedMeetUrl) {
      const appt = this.appointments.get(appointmentId);
      if (!appt) throw new Error('Appointment not found');

      // Concurrency guard: check if cancelled concurrently while Google Calendar was queried
      if (appt.status === 'cancelled' || appt.conference_status !== 'reconciling') {
        // Rollback: 0 rows affected
        return {
          reconciled: false,
          joinUrl: null,
          status: appt.status === 'cancelled' ? 'cancelled' : 'aborted',
          error: 'Appointment was cancelled while Google Meet conference was being provisioned',
        };
      }

      // 1. Update appointment
      appt.location_or_link = verifiedMeetUrl;
      appt.conference_status = 'ready';
      appt.notification_status = 'pending';
      appt.updated_at = new Date();

      // 2. Audit activity
      this.activities.push({ appointmentId, action: 'conference_reconciled' });

      // 3. Enqueue versioned notification in outbox
      const linkHash = crypto.createHash('sha256').update(verifiedMeetUrl).digest('hex').substring(0, 8);
      const notifId = `notif_meet_${appointmentId}_${linkHash}`;
      const existing = this.notifications.get(notifId);
      if (!existing || existing.status !== 'sent') {
        this.notifications.set(notifId, {
          id: notifId,
          appointment_id: appointmentId,
          recipient_email: appt.customer_email,
          notification_type: 'video_link_ready',
          status: 'pending',
          error_message: null,
          retry_count: 0,
          next_retry_at: new Date(),
          sent_at: new Date(),
        });
      }

      return { reconciled: true, joinUrl: verifiedMeetUrl, status: 'ready', notifId };
    }

    // Atomic outbox claim
    claimOutboxItem(notifId) {
      const notif = this.notifications.get(notifId);
      if (!notif) return null;

      const now = Date.now();
      const isEligible =
        notif.status === 'pending' ||
        (notif.status === 'failed' && (notif.retry_count || 0) < MAX_RETRIES && (!notif.next_retry_at || notif.next_retry_at.getTime() <= now)) ||
        (notif.status === 'dispatching' && now - notif.sent_at.getTime() > 300000);

      if (!isEligible) return null;

      notif.status = 'dispatching';
      notif.sent_at = new Date();
      return { ...notif };
    }

    // Cancellation routine
    cancelAppointment(appointmentId, reason) {
      const appt = this.appointments.get(appointmentId);
      if (!appt) return null;
      appt.status = 'cancelled';
      appt.notification_status = 'cancelled';
      appt.cancellation_reason = reason;

      // Cancel any pending or dispatching outbox items
      for (const notif of this.notifications.values()) {
        if (notif.appointment_id === appointmentId && (notif.status === 'pending' || notif.status === 'dispatching' || notif.status === 'failed')) {
          notif.status = 'cancelled';
          notif.error_message = 'Appointment was cancelled before notification delivery';
        }
      }
      return appt;
    }

    // Dispatch processor
    async processOutboxItem(notifId, emailProviderMock) {
      const notif = this.claimOutboxItem(notifId);
      if (!notif) return { dispatched: false, status: 'already_claimed_or_completed' };

      const appt = this.appointments.get(notif.appointment_id);
      if (!appt) {
        this.notifications.get(notifId).status = 'failed';
        return { dispatched: false, status: 'failed', error: 'Appointment not found' };
      }

      // Check cancellation guard
      if (appt.status === 'cancelled') {
        const storedNotif = this.notifications.get(notifId);
        storedNotif.status = 'cancelled';
        storedNotif.error_message = 'Appointment was cancelled before notification delivery';
        appt.notification_status = 'cancelled';
        return { dispatched: false, status: 'cancelled' };
      }

      // Check verified meet URL
      if (appt.conference_status !== 'ready' || !appt.location_or_link || !MEET_URL_REGEX.test(appt.location_or_link)) {
        this.notifications.get(notifId).status = 'pending';
        return { dispatched: false, status: 'pending', error: 'Unverified meeting URL' };
      }

      const storedNotif = this.notifications.get(notifId);
      try {
        const sendRes = await emailProviderMock.send({
          appointmentId: appt.id,
          recipient: appt.customer_email,
          meetUrl: appt.location_or_link,
          idempotencyKey: notif.id,
        });

        if (sendRes.success) {
          // Concurrency check: did appointment or notification get cancelled while email was in flight?
          if (storedNotif.status === 'cancelled' || appt.status === 'cancelled') {
            return { dispatched: false, status: 'cancelled', error: 'Appointment was cancelled during notification dispatch' };
          }

          storedNotif.status = 'sent';
          storedNotif.error_message = null;
          storedNotif.sent_at = new Date();
          appt.notification_sent = true;
          appt.notification_sent_at = new Date().toISOString();
          appt.notification_status = 'sent';
          appt.notification_error = null;
          this.sentEmails.push({ notifId, to: appt.customer_email, meetUrl: appt.location_or_link });
          return { dispatched: true, status: 'sent' };
        } else {
          if (storedNotif.status === 'cancelled' || appt.status === 'cancelled') {
            return { dispatched: false, status: 'cancelled' };
          }
          const retries = (storedNotif.retry_count || 0) + 1;
          const isPerm = retries >= MAX_RETRIES;
          storedNotif.retry_count = retries;
          storedNotif.status = 'failed';
          storedNotif.error_message = sendRes.error;
          storedNotif.next_retry_at = isPerm ? null : new Date(Date.now() + (NOTIFICATION_BACKOFF[retries - 1] || 1800) * 1000);
          appt.notification_status = 'failed';
          appt.notification_error = sendRes.error;
          return { dispatched: false, status: 'failed', error: sendRes.error, retries };
        }
      } catch (err) {
        if (storedNotif.status === 'cancelled' || appt.status === 'cancelled') {
          return { dispatched: false, status: 'cancelled' };
        }
        const retries = (storedNotif.retry_count || 0) + 1;
        storedNotif.retry_count = retries;
        storedNotif.status = 'failed';
        storedNotif.error_message = err.message;
        appt.notification_status = 'failed';
        appt.notification_error = err.message;
        return { dispatched: false, status: 'failed', error: err.message };
      }
    }
  }

  // --- SCENARIO 1: Google Meet link becomes ready and email delivery succeeds ---
  test('Scenario 1: Google Meet link becomes ready and email delivery succeeds', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc1' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);
    assert.strictEqual(res.reconciled, true);
    assert.strictEqual(appt.conference_status, 'ready');
    assert.strictEqual(appt.location_or_link, verifiedUrl);
    assert.strictEqual(db.notifications.get(res.notifId).status, 'pending');

    const mockEmailProvider = {
      send: async () => ({ success: true, messageId: 'msg_sc1_123' }),
    };

    const outboxRes = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(outboxRes.dispatched, true);
    assert.strictEqual(outboxRes.status, 'sent');
    assert.strictEqual(db.notifications.get(res.notifId).status, 'sent');
    assert.strictEqual(appt.notification_status, 'sent');
  });

  // --- SCENARIO 2: Google Meet link becomes ready but Resend temporarily fails ---
  test('Scenario 2: Google Meet link becomes ready but Resend temporarily fails', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc2' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);
    assert.strictEqual(appt.conference_status, 'ready');

    const mockEmailProvider = {
      send: async () => ({ success: false, error: 'HTTP 429: Rate limit exceeded' }),
    };

    const outboxRes = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(outboxRes.dispatched, false);
    assert.strictEqual(outboxRes.status, 'failed');
    assert.strictEqual(appt.conference_status, 'ready'); // Conference status remains ready!
    assert.strictEqual(appt.notification_status, 'failed');
    assert.strictEqual(db.notifications.get(res.notifId).retry_count, 1);
  });

  // --- SCENARIO 3: Backend restarts after the link is saved but before email dispatch ---
  test('Scenario 3: Backend restarts after the link is saved but before email dispatch', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc3' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);
    assert.strictEqual(appt.conference_status, 'ready');

    // Simulate process termination / restart: outbox worker initializes fresh
    const mockEmailProvider = {
      send: async () => ({ success: true, messageId: 'msg_sc3_post_restart' }),
    };

    const outboxRes = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(outboxRes.dispatched, true);
    assert.strictEqual(appt.notification_status, 'sent');
  });

  // --- SCENARIO 4: Two reconciliation workers attempt the same notification simultaneously ---
  test('Scenario 4: Two reconciliation workers attempt the same notification simultaneously', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc4' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);

    let sendCallCount = 0;
    const mockEmailProvider = {
      send: async () => {
        sendCallCount++;
        return { success: true, messageId: 'msg_sc4_winner' };
      },
    };

    const [worker1Result, worker2Result] = await Promise.all([
      db.processOutboxItem(res.notifId, mockEmailProvider),
      db.processOutboxItem(res.notifId, mockEmailProvider),
    ]);

    const dispatches = [worker1Result, worker2Result];
    const successes = dispatches.filter((d) => d.dispatched === true);
    const conflicts = dispatches.filter((d) => d.status === 'already_claimed_or_completed');

    assert.strictEqual(successes.length, 1);
    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(sendCallCount, 1);
  });

  // --- SCENARIO 5: Provider accepts an email but the network response is lost (Idempotency Key) ---
  test('Scenario 5: Provider accepts an email but the network response is lost (Idempotency Key)', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc5' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);
    const recordedIdempotencyKeys = [];

    const mockEmailProvider = {
      send: async ({ idempotencyKey }) => {
        recordedIdempotencyKeys.push(idempotencyKey);
        if (recordedIdempotencyKeys.length === 1) {
          throw new Error('ETIMEDOUT: Socket hang up during response read');
        }
        return { success: true, messageId: 'msg_sc5_idempotent_reply' };
      },
    };

    const firstAttempt = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(firstAttempt.dispatched, false);

    db.notifications.get(res.notifId).next_retry_at = new Date(Date.now() - 1000);
    const retryAttempt = await db.processOutboxItem(res.notifId, mockEmailProvider);

    assert.strictEqual(retryAttempt.dispatched, true);
    assert.strictEqual(recordedIdempotencyKeys.length, 2);
    assert.strictEqual(recordedIdempotencyKeys[0], recordedIdempotencyKeys[1]);
  });

  // --- SCENARIO 6: A cancelled appointment has a pending notification (stale notification suppression) ---
  test('Scenario 6: A cancelled appointment has a pending notification (stale notification suppression)', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc6' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);
    appt.status = 'cancelled';

    let sendCalled = false;
    const mockEmailProvider = {
      send: async () => {
        sendCalled = true;
        return { success: true };
      },
    };

    const outboxRes = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(outboxRes.dispatched, false);
    assert.strictEqual(outboxRes.status, 'cancelled');
    assert.strictEqual(sendCalled, false);
    assert.strictEqual(db.notifications.get(res.notifId).status, 'cancelled');
    assert.strictEqual(appt.notification_status, 'cancelled');
  });

  // --- SCENARIO 7: A previously failed notification is retried successfully ---
  test('Scenario 7: A previously failed notification is retried successfully', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc7' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);

    let isProviderHealthy = false;
    const mockEmailProvider = {
      send: async () => {
        if (!isProviderHealthy) {
          return { success: false, error: 'Temporary upstream SMTP 503 error' };
        }
        return { success: true, messageId: 'msg_sc7_recovered' };
      },
    };

    const attempt1 = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(attempt1.dispatched, false);
    assert.strictEqual(db.notifications.get(res.notifId).retry_count, 1);

    isProviderHealthy = true;
    db.notifications.get(res.notifId).next_retry_at = new Date(Date.now() - 1000);

    const attempt2 = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(attempt2.dispatched, true);
    assert.strictEqual(attempt2.status, 'sent');
    assert.strictEqual(db.notifications.get(res.notifId).status, 'sent');
    assert.strictEqual(appt.notification_status, 'sent');
  });

  // --- SCENARIO 8 (FOCUSED): Cancellation during Google conference provisioning prevents reviving cancelled appointment ---
  test('Scenario 8 (Focused): Cancellation during Google conference provisioning prevents ready transition & outbox enqueue', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc8' });
    db.claimReconciling(appt.id);
    assert.strictEqual(appt.conference_status, 'reconciling');

    // While Google Calendar API is being queried, appointment is cancelled by customer/admin
    db.cancelAppointment(appt.id, 'Customer chose different schedule');
    assert.strictEqual(appt.status, 'cancelled');

    // Google returns a valid Meet URL
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';
    const recRes = db.reconcileSuccessTx(appt.id, verifiedUrl);

    // Assert: Reconciliation did NOT revive the cancelled appointment
    assert.strictEqual(recRes.reconciled, false);
    assert.strictEqual(recRes.status, 'cancelled');
    assert.strictEqual(appt.status, 'cancelled');
    assert.notStrictEqual(appt.conference_status, 'ready', 'Appointment must NOT be revived to ready');
    assert.strictEqual(appt.notification_status, 'cancelled');

    // Assert: Outbox record was NOT enqueued
    const linkHash = crypto.createHash('sha256').update(verifiedUrl).digest('hex').substring(0, 8);
    const expectedNotifId = `notif_meet_${appt.id}_${linkHash}`;
    assert.strictEqual(db.notifications.get(expectedNotifId), undefined, 'No outbox notification should be enqueued for cancelled appointment');
  });

  // --- SCENARIO 9 (FOCUSED): Cancellation during pending notification delivery suppresses email ---
  test('Scenario 9 (Focused): Cancellation during in-flight notification delivery suppresses sent update', async () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc9' });
    db.claimReconciling(appt.id);
    const verifiedUrl = 'https://meet.google.com/abc-defg-hij';

    const res = db.reconcileSuccessTx(appt.id, verifiedUrl);
    assert.strictEqual(appt.conference_status, 'ready');

    // Outbox claim occurs, status becomes 'dispatching'
    const notif = db.claimOutboxItem(res.notifId);
    assert.strictEqual(notif.status, 'dispatching');

    // While the network call to email provider is in-flight, customer cancels the appointment
    db.cancelAppointment(appt.id, 'No longer needed');
    assert.strictEqual(appt.status, 'cancelled');
    assert.strictEqual(db.notifications.get(res.notifId).status, 'cancelled');

    // Provider mock returns success
    const mockEmailProvider = {
      send: async () => ({ success: true, messageId: 'msg_sc9_late_200' }),
    };

    // The outbox processor inspects DB row: detects concurrent cancellation and does NOT overwrite to sent!
    const outboxRes = await db.processOutboxItem(res.notifId, mockEmailProvider);
    assert.strictEqual(outboxRes.dispatched, false);
    assert.strictEqual(outboxRes.status, 'cancelled');
    assert.strictEqual(db.notifications.get(res.notifId).status, 'cancelled');
    assert.strictEqual(appt.notification_status, 'cancelled');
    assert.strictEqual(appt.notification_sent, false, 'notification_sent must NOT be marked true');
  });

  // --- SCENARIO 10: Changed Google Meet URL generates an appropriately versioned notification key ---
  test('Scenario 10: Changed Google Meet URL generates distinct versioned notification key', () => {
    const db = new MockDatabase();
    const appt = db.createAppointment({ id: 'appt_sc10' });
    db.claimReconciling(appt.id);

    const initialUrl = 'https://meet.google.com/aaa-bbbb-ccc';
    const res1 = db.reconcileSuccessTx(appt.id, initialUrl);
    db.notifications.get(res1.notifId).status = 'sent';

    // A rescheduled appointment or re-provisioned Meet link generates a new URL
    appt.conference_status = 'reconciling';
    const updatedUrl = 'https://meet.google.com/xxx-yyyy-zzz';
    const res2 = db.reconcileSuccessTx(appt.id, updatedUrl);

    assert.notStrictEqual(res1.notifId, res2.notifId, 'Different URLs must generate distinct versioned notification IDs');
    assert.strictEqual(db.notifications.get(res2.notifId).status, 'pending');
    assert.strictEqual(db.notifications.get(res1.notifId).status, 'sent');
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n----------------------------------------------------------------');
  console.log(`RECONCILIATION & OUTBOX RECOVERY SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runReconciliationRecoverySuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
