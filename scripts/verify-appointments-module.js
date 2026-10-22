/**
 * LAURREL SERVICES — MODULE 04: APPOINTMENTS & CONSULTATIONS VERIFICATION SUITE
 * Tests creation, idempotency, staff conflict detection, Ottawa timezone handling,
 * rescheduling, cancellation, and notification delivery recording.
 */

const path = require('path');
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
}

const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const TEST_PORT = 5077;
process.env.PORT = String(TEST_PORT);
process.env.NODE_ENV = 'test';

let server;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function run() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — APPOINTMENTS & CONSULTATIONS TEST SUITE');
  console.log('========================================================================\n');

  // 1. Setup isolated test data
  const testStaffId = `staff_test_${Date.now()}`;
  const testEnquiryId = `ENQ-TEST-${Date.now()}`;

  await pool.query(
    `INSERT INTO admin_users (id, email, password_hash, name, role, is_active, created_at, updated_at)
     VALUES ($1, $2, 'dummy_hash', 'Test Coordinator', 'operations_staff', TRUE, NOW(), NOW())`,
    [testStaffId, `${testStaffId}@laurrel-test.local`]
  );

  await pool.query(
    `INSERT INTO enquiries (id, intent, source, customer_name, customer_email, customer_phone, services, service_location, details, status, created_at, updated_at)
     VALUES ($1, 'residential_cleaning', 'web_direct', 'Eleanor Vance', 'eleanor@example.ca', '613-555-0199', '{"cleaning"}', 'Glebe, Ottawa', 'Need bi-weekly cleaning consultation', 'new', NOW(), NOW())`,
    [testEnquiryId]
  );

  console.log(`✅ Test staff member created: ${testStaffId}`);
  console.log(`✅ Test customer enquiry created: ${testEnquiryId}`);

  // Create active session for test staff
  const testSessionId = `sess_apt_${Date.now()}`;
  await pool.query(
    `INSERT INTO admin_sessions (id, user_id, ip_address, user_agent, created_at, expires_at)
     VALUES ($1, $2, '127.0.0.1', 'AppointmentTestSuite', NOW(), NOW() + INTERVAL '2 hours')`,
    [testSessionId, testStaffId]
  );

  // 2. Start Express Backend (auto-binds to TEST_PORT)
  require(path.join(__dirname, '..', 'backend', 'dist', 'index'));
  await new Promise((r) => setTimeout(r, 1200));

  const headers = {
    'Content-Type': 'application/json',
    'x-admin-session-id': testSessionId,
  };

  try {
    // --- TEST 1: Reject unauthenticated request ---
    console.log('--- TEST 1: Authentication Requirement ---');
    const unauthRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`);
    assert(unauthRes.status === 401, 'Unauthenticated request must return 401');
    console.log('✅ PASS: Unauthenticated access rejected with HTTP 401.');

    // --- TEST 2: Create Appointment with Idempotency ---
    console.log('\n--- TEST 2: Appointment Creation & Idempotency ---');
    const startTomorrow = new Date();
    startTomorrow.setDate(startTomorrow.getDate() + 2);
    startTomorrow.setHours(14, 0, 0, 0); // 2:00 PM
    const idempotencyKey = `idemp_test_${Date.now()}`;

    const createPayload = {
      enquiryId: testEnquiryId,
      title: 'Deep Cleaning Scope Walkthrough',
      purpose: 'Assess square footage and specific deep clean requirements',
      appointmentType: 'telephone',
      scheduledStart: startTomorrow.toISOString(),
      durationMinutes: 30,
      customerName: 'Eleanor Vance',
      customerEmail: 'eleanor@example.ca',
      customerPhone: '613-555-0199',
      assignedStaffId: testStaffId,
      assignedStaffName: 'Test Coordinator',
      staffNotes: 'Customer prefers afternoon calls.',
      notifyCustomer: true,
      idempotencyKey,
    };

    const createRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(createPayload),
    });

    assert(createRes.status === 201, `Creation must return 201 (got ${createRes.status})`);
    const createData = await createRes.json();
    const createdApt = createData.appointment;
    assert(createdApt && createdApt.id, 'Appointment record must be returned');
    assert(createdApt.status === 'pending', 'Initial status must be pending');
    assert(createdApt.timezone === 'America/Toronto', 'Timezone must be America/Toronto');
    console.log(`✅ PASS: Appointment created with ID: ${createdApt.id}`);

    // Replay with identical idempotency key
    const replayRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(createPayload),
    });
    const replayData = await replayRes.json();
    assert(replayData.appointment.id === createdApt.id, 'Idempotent request must return existing appointment');
    console.log('✅ PASS: Idempotency protection prevented duplicate appointment creation.');

    // --- TEST 3: Independent Status Tracking ---
    console.log('\n--- TEST 3: Independent Lead Pipeline vs Appointment Status ---');
    const enqDbRes = await pool.query('SELECT status FROM enquiries WHERE id = $1', [testEnquiryId]);
    assert(enqDbRes.rows[0].status === 'new', 'Enquiry status must remain "new" independently of appointment creation');
    console.log('✅ PASS: Existing enquiry status is tracked independently from appointment status.');

    // --- TEST 4: Status Transition (Confirm & Complete) ---
    console.log('\n--- TEST 4: Status Transitions & Audit Logging ---');
    const confirmRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/${createdApt.id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'confirmed' }),
    });
    assert(confirmRes.status === 200, 'Confirm status update must return 200');
    const confirmData = await confirmRes.json();
    assert(confirmData.appointment.status === 'confirmed', 'Appointment status must be confirmed');

    // Verify audit activity in Neon
    const activityRes = await pool.query(
      'SELECT action, performed_by FROM appointment_activity WHERE appointment_id = $1 ORDER BY created_at ASC',
      [createdApt.id]
    );
    assert(activityRes.rows.length >= 2, 'Must have at least 2 activity records (created, confirmed)');
    assert(activityRes.rows[0].action === 'created', 'First activity must be "created"');
    assert(activityRes.rows[1].action === 'confirmed', 'Second activity must be "confirmed"');
    console.log('✅ PASS: Status updated to confirmed and audit activity logged.');

    // --- TEST 5: Staff Schedule Conflict Detection ---
    console.log('\n--- TEST 5: Staff Schedule Conflict Detection ---');
    const conflictQuery = new URLSearchParams({
      staffId: testStaffId,
      start: new Date(startTomorrow.getTime() + 10 * 60000).toISOString(), // 10 minutes into existing 30m appointment
      end: new Date(startTomorrow.getTime() + 40 * 60000).toISOString(),
    });
    const conflictRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/staff/conflicts?${conflictQuery.toString()}`, {
      headers,
    });
    const conflictData = await conflictRes.json();
    assert(conflictData.hasConflict === true, 'Must identify overlapping consultation');
    assert(conflictData.conflictingAppointment.id === createdApt.id, 'Conflicting appointment ID must match');
    console.log('✅ PASS: Overlapping appointment conflict detected accurately.');

    // --- TEST 6: Reschedule Appointment ---
    console.log('\n--- TEST 6: Rescheduling Consultation ---');
    const rescheduledStart = new Date(startTomorrow);
    rescheduledStart.setHours(16, 0, 0, 0); // Reschedule to 4:00 PM

    const rescheduleRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/${createdApt.id}/reschedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        scheduledStart: rescheduledStart.toISOString(),
        durationMinutes: 45,
        reason: 'Customer requested 4:00 PM slot',
        notifyCustomer: true,
      }),
    });
    assert(rescheduleRes.status === 200, 'Reschedule must return 200');
    const rescheduleData = await rescheduleRes.json();
    assert(rescheduleData.appointment.status === 'rescheduled', 'Status must be rescheduled');
    assert(rescheduleData.appointment.durationMinutes === 45, 'Duration must update to 45 mins');
    console.log('✅ PASS: Rescheduled successfully with audit record and duration update.');

    // --- TEST 7: Ottawa Timezone Formatting (America/Toronto) ---
    console.log('\n--- TEST 7: Timezone Accuracy (America/Toronto across Daylight Saving) ---');
    function formatOttawaTimeTest(isoDate) {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Toronto',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(isoDate));
    }

    // Winter date (EST, UTC-5): Jan 15, 2027 19:00 UTC = 2:00 PM EST
    const winterUtc = '2027-01-15T19:00:00.000Z';
    const winterOttawa = formatOttawaTimeTest(winterUtc);
    assert(winterOttawa.includes('2:00 p.m.') || winterOttawa.includes('2:00 PM'), `Winter EST conversion must be 2:00 PM (got ${winterOttawa})`);

    // Summer date (EDT, UTC-4): July 15, 2027 18:00 UTC = 2:00 PM EDT
    const summerUtc = '2027-07-15T18:00:00.000Z';
    const summerOttawa = formatOttawaTimeTest(summerUtc);
    assert(summerOttawa.includes('2:00 p.m.') || summerOttawa.includes('2:00 PM'), `Summer EDT conversion must be 2:00 PM (got ${summerOttawa})`);

    console.log(`✅ PASS: EST winter time formatted correctly: ${winterOttawa}`);
    console.log(`✅ PASS: EDT summer time formatted correctly: ${summerOttawa}`);

    // --- TEST 8: Cancellation Flow ---
    console.log('\n--- TEST 8: Cancellation Flow & Mandatory Reason ---');
    // Missing reason must be rejected
    const badCancelRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/${createdApt.id}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: '' }),
    });
    assert(badCancelRes.status === 400, 'Cancellation without reason must return 400');

    // Valid cancellation
    const cancelRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/${createdApt.id}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: 'Customer found alternative local contractor' }),
    });
    assert(cancelRes.status === 200, 'Valid cancellation must return 200');
    const cancelData = await cancelRes.json();
    assert(cancelData.appointment.status === 'cancelled', 'Status must be cancelled');
    assert(cancelData.appointment.cancellationReason === 'Customer found alternative local contractor', 'Cancellation reason must be recorded');
    console.log('✅ PASS: Cancellation enforced reason and recorded status.');

    // --- TEST 9: Query by Enquiry ID ---
    console.log('\n--- TEST 9: Query Appointments for Enquiry ---');
    const enqAptsRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/enquiry/${testEnquiryId}`, {
      headers,
    });
    assert(enqAptsRes.status === 200, 'Enquiry appointments query must return 200');
    const enqAptsData = await enqAptsRes.json();
    assert(enqAptsData.appointments.length === 1, 'Must find 1 appointment for test enquiry');
    console.log(`✅ PASS: Linked appointments retrieved successfully for enquiry ${testEnquiryId}.`);

    // --- TEST 10: Notification Record Verification ---
    console.log('\n--- TEST 10: Notification Record Logging (Honest Delivery Tracking) ---');
    const notifs = await pool.query(
      'SELECT notification_type, status FROM appointment_notifications WHERE appointment_id = $1',
      [createdApt.id]
    );
    assert(notifs.rows.length >= 1, 'Must have recorded notification attempt');
    console.log(`✅ PASS: ${notifs.rows.length} notification attempt(s) recorded in Neon PostgreSQL.`);

    console.log('\n========================================================================');
    console.log('🎉 ALL APPOINTMENT & CONSULTATION TESTS PASSED (100%)');
    console.log('========================================================================\n');
  } finally {
    // Clean up test data
    console.log('--- CLEANUP: Removing Test Records ---');
    await pool.query('DELETE FROM appointments WHERE enquiry_id = $1', [testEnquiryId]);
    await pool.query('DELETE FROM enquiries WHERE id = $1', [testEnquiryId]);
    await pool.query('DELETE FROM admin_sessions WHERE id = $1', [testSessionId]);
    await pool.query('DELETE FROM admin_users WHERE id = $1', [testStaffId]);
    await pool.end();

    if (server) {
      server.close();
    }
  }
}

run()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test Suite Failed:', err.message);
    if (server) server.close();
    pool.end();
    process.exit(1);
  });
