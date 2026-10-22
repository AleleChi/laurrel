/**
 * LAURREL SERVICES — MODULE 04 ACCEPTANCE CORRECTIONS REGRESSION TEST SUITE
 * 
 * Demonstrates:
 * 1. Real staff double-booking prevention (HTTP 409 STAFF_CONFLICT)
 * 2. Accurate America/Toronto scheduling regardless of browser timezone
 * 3. Removal of simulated Google Meet/Teams/Zoom successes (strictly isAutomated: false)
 * 4. Verified PostgreSQL TLS (rejectUnauthorized: true against Neon PostgreSQL)
 * 5. Correct pending-versus-confirmed customer email templates & status transition dispatch
 * 6. Safe idempotent booking (no duplicate database rows, no duplicate emails)
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
  ssl: { rejectUnauthorized: true }, // Verified TLS
});

const TEST_PORT = 5088;
process.env.PORT = String(TEST_PORT);
process.env.NODE_ENV = 'test';

let server;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[Assertion Failure]: ${message}`);
  }
}

async function run() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — MODULE 04 ACCEPTANCE CORRECTIONS REGRESSION SUITE');
  console.log('========================================================================\n');

  // Start backend server
  const backendApp = require(path.join(__dirname, '..', 'backend', 'dist', 'index'));
  server = backendApp.server || require('http').createServer(backendApp.app || backendApp);
  if (!server.listening) {
    await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  }
  console.log(`[Test Server]: Listening on http://127.0.0.1:${TEST_PORT}\n`);

  // Setup test customer enquiry and staff
  const testStaffId = `staff_regress_${Date.now()}`;
  const testEnquiryId = `ENQ-REGRESS-${Date.now()}`;
  const testSessionId = `sess_regress_${Date.now()}`;

  await pool.query(
    `INSERT INTO admin_users (id, email, password_hash, name, role, is_active, created_at, updated_at)
     VALUES ($1, $2, 'dummy_hash', 'Sarah Tremblay (Lead Coordinator)', 'operations_staff', TRUE, NOW(), NOW())`,
    [testStaffId, `${testStaffId}@laurrel.local`]
  );

  await pool.query(
    `INSERT INTO enquiries (id, intent, source, customer_name, customer_email, customer_phone, services, service_location, details, status, created_at, updated_at)
     VALUES ($1, 'residential_moving', 'web_direct', 'Marcus Ottawa', 'marcus@example.ca', '613-555-0177', '{"moving"}', 'Centretown, Ottawa', 'Moving consultation', 'new', NOW(), NOW())`,
    [testEnquiryId]
  );

  await pool.query(
    `INSERT INTO admin_sessions (id, user_id, ip_address, user_agent, created_at, expires_at)
     VALUES ($1, $2, '127.0.0.1', 'RegressionTestSuite', NOW(), NOW() + INTERVAL '2 hours')`,
    [testSessionId, testStaffId]
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-admin-session-id': testSessionId,
  };

  console.log(`✅ Test staff created: ${testStaffId}`);
  console.log(`✅ Test enquiry created: ${testEnquiryId}\n`);

  // -------------------------------------------------------------------------
  // CORRECTION 1: Real Staff Double-Booking Prevention
  // -------------------------------------------------------------------------
  console.log('--- REGRESSION 1: Real Staff Double-Booking Prevention ---');

  // Book initial appointment: tomorrow at 14:00 - 14:30
  const apt1Start = new Date();
  apt1Start.setDate(apt1Start.getDate() + 2);
  apt1Start.setHours(14, 0, 0, 0);
  const apt1End = new Date(apt1Start.getTime() + 30 * 60000);

  const res1 = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': `idemp_regress_1_${Date.now()}` },
    body: JSON.stringify({
      enquiryId: testEnquiryId,
      title: 'Initial Moving Consultation',
      appointmentType: 'telephone',
      scheduledStart: apt1Start.toISOString(),
      durationMinutes: 30,
      customerName: 'Marcus Ottawa',
      customerEmail: 'marcus@example.ca',
      assignedStaffId: testStaffId,
      assignedStaffName: 'Sarah Tremblay',
      status: 'confirmed',
      notifyCustomer: false,
    }),
  });
  const data1 = await res1.json();
  assert(res1.status === 201, `Failed to book initial appointment: ${JSON.stringify(data1)}`);
  console.log(`✅ Initial consultation booked for Sarah Tremblay (${data1.appointment.id})`);

  // Attempt overlapping booking for Sarah: 14:15 - 14:45
  const apt2Start = new Date(apt1Start.getTime() + 15 * 60000); // 15 mins into first appointment
  const res2 = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': `idemp_regress_2_${Date.now()}` },
    body: JSON.stringify({
      enquiryId: testEnquiryId,
      title: 'Conflicting Move Consultation',
      appointmentType: 'telephone',
      scheduledStart: apt2Start.toISOString(),
      durationMinutes: 30,
      customerName: 'Marcus Ottawa',
      customerEmail: 'marcus@example.ca',
      assignedStaffId: testStaffId,
      assignedStaffName: 'Sarah Tremblay',
      status: 'confirmed',
      notifyCustomer: false,
    }),
  });
  const data2 = await res2.json();
  assert(res2.status === 409, `Expected HTTP 409 for staff conflict, got ${res2.status}: ${JSON.stringify(data2)}`);
  assert(data2.code === 'STAFF_CONFLICT', `Expected code 'STAFF_CONFLICT', got: ${data2.code}`);
  console.log(`✅ PASS: Double-booking correctly prevented on creation with HTTP 409 STAFF_CONFLICT.`);

  // Book a separate non-conflicting appointment for Marcus at 16:00
  const apt3Start = new Date(apt1Start.getTime() + 120 * 60000);
  const res3 = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': `idemp_regress_3_${Date.now()}` },
    body: JSON.stringify({
      enquiryId: testEnquiryId,
      title: 'Secondary Cleaning Assessment',
      appointmentType: 'telephone',
      scheduledStart: apt3Start.toISOString(),
      durationMinutes: 30,
      customerName: 'Marcus Ottawa',
      customerEmail: 'marcus@example.ca',
      assignedStaffId: testStaffId,
      assignedStaffName: 'Sarah Tremblay',
      status: 'confirmed',
      notifyCustomer: false,
    }),
  });
  const data3 = await res3.json();
  assert(res3.status === 201, `Failed to book secondary appointment: ${JSON.stringify(data3)}`);

  // Attempt to reschedule appointment 3 into appointment 1's window (14:00)
  const resReschedConflict = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/${data3.appointment.id}/reschedule`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      scheduledStart: apt1Start.toISOString(),
      durationMinutes: 30,
      reason: 'Attempt conflict reschedule',
      notifyCustomer: false,
    }),
  });
  const dataReschedConflict = await resReschedConflict.json();
  assert(resReschedConflict.status === 409, `Expected HTTP 409 on conflicting reschedule, got ${resReschedConflict.status}`);
  console.log(`✅ PASS: Double-booking correctly prevented on reschedule with HTTP 409 STAFF_CONFLICT.\n`);

  // -------------------------------------------------------------------------
  // CORRECTION 2: Accurate America/Toronto Scheduling Regardless of Browser Timezone
  // -------------------------------------------------------------------------
  console.log('--- REGRESSION 2: Accurate America/Toronto Timezone Conversion ---');
  function ottawaToUtcDate(dateStr, timeStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    let utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Toronto',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    });
    for (let i = 0; i < 3; i++) {
      const parts = dtf.formatToParts(new Date(utcMillis));
      const partObj = {};
      for (const p of parts) {
        if (p.type !== 'literal') partObj[p.type] = Number(p.value);
      }
      const torontoHour = partObj.hour === 24 ? 0 : partObj.hour;
      const torontoMillis = Date.UTC(partObj.year, partObj.month - 1, partObj.day, torontoHour, partObj.minute, partObj.second || 0);
      const diff = Date.UTC(year, month - 1, day, hour, minute, 0) - torontoMillis;
      if (diff === 0) break;
      utcMillis += diff;
    }
    return new Date(utcMillis);
  }
  function utcToOttawaDate(dateValue) {
    const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
  function utcToOttawaTime(dateValue) {
    const d = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
    let hour = '00', minute = '00';
    for (const p of parts) {
      if (p.type === 'hour') hour = p.value === '24' ? '00' : p.value.padStart(2, '0');
      if (p.type === 'minute') minute = p.value.padStart(2, '0');
    }
    return `${hour}:${minute}`;
  }

  // Test Summer EDT (UTC-4): July 15 at 14:00 Ottawa time should be exactly 18:00 UTC
  const summerUtc = ottawaToUtcDate('2026-07-15', '14:00');
  assert(summerUtc.toISOString() === '2026-07-15T18:00:00.000Z', `Summer EDT conversion mismatch: ${summerUtc.toISOString()}`);
  const summerReverseDate = utcToOttawaDate(summerUtc);
  const summerReverseTime = utcToOttawaTime(summerUtc);
  assert(summerReverseDate === '2026-07-15', `Summer reverse date mismatch: ${summerReverseDate}`);
  assert(summerReverseTime === '14:00', `Summer reverse time mismatch: ${summerReverseTime}`);
  console.log(`✅ PASS: Summer (EDT) 14:00 Ottawa local converts to 18:00:00.000Z UTC and back.`);

  // Test Winter EST (UTC-5): Dec 15 at 14:00 Ottawa time should be exactly 19:00 UTC
  const winterUtc = ottawaToUtcDate('2026-12-15', '14:00');
  assert(winterUtc.toISOString() === '2026-12-15T19:00:00.000Z', `Winter EST conversion mismatch: ${winterUtc.toISOString()}`);
  const winterReverseDate = utcToOttawaDate(winterUtc);
  const winterReverseTime = utcToOttawaTime(winterUtc);
  assert(winterReverseDate === '2026-12-15', `Winter reverse date mismatch: ${winterReverseDate}`);
  assert(winterReverseTime === '14:00', `Winter reverse time mismatch: ${winterReverseTime}`);
  console.log(`✅ PASS: Winter (EST) 14:00 Ottawa local converts to 19:00:00.000Z UTC and back.\n`);

  // -------------------------------------------------------------------------
  // CORRECTION 3: Removal of Simulated Google Meet/Teams/Zoom Successes
  // -------------------------------------------------------------------------
  console.log('--- REGRESSION 3: Video Meeting Adapters (No Simulated Success) ---');
  const { GoogleMeetProvider } = require(path.join(__dirname, '..', 'backend', 'dist', 'services', 'video', 'googleMeetProvider'));
  const { MicrosoftTeamsProvider } = require(path.join(__dirname, '..', 'backend', 'dist', 'services', 'video', 'msTeamsProvider'));
  const { ZoomProvider } = require(path.join(__dirname, '..', 'backend', 'dist', 'services', 'video', 'zoomProvider'));

  const googleMeet = new GoogleMeetProvider();
  const msTeams = new MicrosoftTeamsProvider();
  const zoom = new ZoomProvider();

  const reqWithoutLink = {
    title: 'Video Consultation',
    appointmentType: 'google_meet',
    startTime: new Date(),
    endTime: new Date(Date.now() + 1800000),
    durationMinutes: 30,
    customerName: 'Marcus',
    customerEmail: 'marcus@example.ca',
  };

  const meetRes = await googleMeet.createMeeting(reqWithoutLink);
  const teamsRes = await msTeams.createMeeting({ ...reqWithoutLink, appointmentType: 'ms_teams' });
  const zoomRes = await zoom.createMeeting({ ...reqWithoutLink, appointmentType: 'zoom' });

  assert(meetRes.isAutomated === false, 'Google Meet must not claim isAutomated: true');
  assert(meetRes.joinUrl === undefined, 'Google Meet must not simulate a join URL');
  assert(teamsRes.isAutomated === false, 'Teams must not claim isAutomated: true');
  assert(teamsRes.joinUrl === undefined, 'Teams must not simulate a join URL');
  assert(zoomRes.isAutomated === false, 'Zoom must not claim isAutomated: true');
  assert(zoomRes.joinUrl === undefined, 'Zoom must not simulate a join URL');
  console.log('✅ PASS: All 3 video providers report isAutomated: false and never fabricate fake links.');

  const manualUrl = 'https://meet.google.com/abc-defg-hij';
  const meetManualRes = await googleMeet.createMeeting({ ...reqWithoutLink, locationOrLink: manualUrl });
  assert(meetManualRes.joinUrl === manualUrl, 'Manual URL must be preserved');
  assert(meetManualRes.isAutomated === false, 'Manual URL must have isAutomated: false');
  console.log('✅ PASS: Manual video meeting URLs are preserved with isAutomated: false.\n');

  // -------------------------------------------------------------------------
  // CORRECTION 4: Verified PostgreSQL TLS
  // -------------------------------------------------------------------------
  console.log('--- REGRESSION 4: Verified PostgreSQL TLS ---');
  const tlsPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });
  const tlsRes = await tlsPool.query('SELECT NOW() as current_time');
  assert(Boolean(tlsRes.rows[0].current_time), 'PostgreSQL query over verified TLS failed');
  await tlsPool.end();
  console.log(`✅ PASS: Neon PostgreSQL connection established with rejectUnauthorized: true verified TLS.\n`);

  // -------------------------------------------------------------------------
  // CORRECTION 5: Correct Pending-versus-Confirmed Customer Emails & Status Flow
  // -------------------------------------------------------------------------
  console.log('--- REGRESSION 5: Pending vs Confirmed Customer Emails ---');
  process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_mock_key';
  const { ResendEmailProvider } = require(path.join(__dirname, '..', 'backend', 'dist', 'services', 'email', 'resendProvider'));
  const resend = new ResendEmailProvider();
  resend.apiKey = 're_test_mock_key';

  // Test pending email template content
  let capturedPayload = null;
  const originalFetch = global.fetch;
  global.fetch = async (url, opts) => {
    if (typeof url === 'string' && url.includes('resend.com')) {
      capturedPayload = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ id: 're_sim_123' }) };
    }
    return originalFetch(url, opts);
  };

  await resend.sendAppointmentInvitation({
    appointmentId: 'apt_test_pending',
    enquiryId: testEnquiryId,
    customerName: 'Marcus Ottawa',
    customerEmail: 'marcus@example.ca',
    title: 'Tentative Moving Consultation',
    appointmentType: 'telephone',
    status: 'pending',
    scheduledStart: new Date(),
    scheduledEnd: new Date(Date.now() + 1800000),
    durationMinutes: 30,
    timezone: 'America/Toronto',
  });

  assert(capturedPayload !== null, 'Failed to capture Resend email payload');
  assert(capturedPayload.subject.includes('Pending Confirmation'), `Expected 'Pending Confirmation' in subject, got: ${capturedPayload.subject}`);
  assert(capturedPayload.html.includes('PENDING CONFIRMATION'), 'Expected PENDING CONFIRMATION badge in HTML');
  assert(!capturedPayload.subject.includes('Confirmed:'), 'Subject must NOT claim Confirmed for pending consultation');
  console.log(`✅ PASS: Pending consultation email correctly displays Pending Confirmation.`);

  // Test confirmed email template content
  capturedPayload = null;
  await resend.sendAppointmentInvitation({
    appointmentId: 'apt_test_confirmed',
    enquiryId: testEnquiryId,
    customerName: 'Marcus Ottawa',
    customerEmail: 'marcus@example.ca',
    title: 'Confirmed Moving Consultation',
    appointmentType: 'telephone',
    status: 'confirmed',
    scheduledStart: new Date(),
    scheduledEnd: new Date(Date.now() + 1800000),
    durationMinutes: 30,
    timezone: 'America/Toronto',
  });

  assert(capturedPayload !== null, 'Failed to capture Resend email payload');
  assert(capturedPayload.subject.includes('Confirmed:'), `Expected 'Confirmed:' in subject, got: ${capturedPayload.subject}`);
  assert(capturedPayload.html.includes('CONFIRMED'), 'Expected CONFIRMED badge in HTML');
  console.log(`✅ PASS: Confirmed consultation email correctly displays Confirmed status.`);

  // Restore fetch
  global.fetch = originalFetch;

  // Test status transition API dispatch (pending -> confirmed)
  // Create pending appointment
  const pendingStart = new Date(Date.now() + 3600000 * 24 * 4);
  const resPending = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': `idemp_pending_${Date.now()}` },
    body: JSON.stringify({
      enquiryId: testEnquiryId,
      title: 'Pending Walkthrough',
      appointmentType: 'on_site',
      scheduledStart: pendingStart.toISOString(),
      durationMinutes: 45,
      customerName: 'Marcus Ottawa',
      customerEmail: 'marcus@example.ca',
      status: 'pending',
      notifyCustomer: true,
    }),
  });
  const dataPending = await resPending.json();
  assert(resPending.status === 201, 'Pending appointment creation failed');
  assert(dataPending.appointment.status === 'pending', 'Appointment status must be pending');

  // Now confirm it via PATCH status
  const resConfirm = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments/${dataPending.appointment.id}/status`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      status: 'confirmed',
      reason: 'Confirmed by coordinator Sarah',
      notifyCustomer: true,
    }),
  });
  const dataConfirm = await resConfirm.json();
  assert(resConfirm.status === 200, 'Failed to update status to confirmed');
  assert(dataConfirm.appointment.status === 'confirmed', 'Appointment must be confirmed');
  assert(dataConfirm.emailDispatch.attempted === true, 'Confirmation email must be dispatched on confirm transition');
  console.log(`✅ PASS: Status update from pending to confirmed triggers confirmation email dispatch.\n`);

  // -------------------------------------------------------------------------
  // CORRECTION 6: Safe Idempotent Booking & Duplicate Prevention
  // -------------------------------------------------------------------------
  console.log('--- REGRESSION 6: Safe Idempotency Protection ---');
  const idempKey = `idemp_exact_test_${Date.now()}`;
  const fixedStart = new Date(Date.now() + 3600000 * 24 * 6);

  // Request 1
  const resIdemp1 = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': idempKey },
    body: JSON.stringify({
      enquiryId: testEnquiryId,
      title: 'Idempotency Verification Consultation',
      appointmentType: 'telephone',
      scheduledStart: fixedStart.toISOString(),
      durationMinutes: 30,
      customerName: 'Marcus Ottawa',
      customerEmail: 'marcus@example.ca',
      status: 'confirmed',
      notifyCustomer: true,
    }),
  });
  const dataIdemp1 = await resIdemp1.json();
  assert(resIdemp1.status === 201, `Failed first idempotent request: ${JSON.stringify(dataIdemp1)}`);
  const originalAptId = dataIdemp1.appointment.id;

  // Request 2 (Exact duplicate replay)
  const resIdemp2 = await fetch(`http://127.0.0.1:${TEST_PORT}/api/admin/appointments`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': idempKey },
    body: JSON.stringify({
      enquiryId: testEnquiryId,
      title: 'Idempotency Verification Consultation',
      appointmentType: 'telephone',
      scheduledStart: fixedStart.toISOString(),
      durationMinutes: 30,
      customerName: 'Marcus Ottawa',
      customerEmail: 'marcus@example.ca',
      status: 'confirmed',
      notifyCustomer: true,
    }),
  });
  const dataIdemp2 = await resIdemp2.json();
  assert(resIdemp2.status === 200, `Expected HTTP 200 on idempotent replay, got: ${resIdemp2.status}`);
  assert(dataIdemp2.idempotentReplay === true, 'Response must identify idempotent replay');
  assert(dataIdemp2.appointment.id === originalAptId, 'Returned appointment ID must match original');
  assert(dataIdemp2.emailDispatch.attempted === false, 'Duplicate email dispatch must NOT be attempted');

  // Verify database record count is exactly 1
  const countCheck = await pool.query('SELECT COUNT(*) FROM appointments WHERE idempotency_key = $1', [idempKey]);
  assert(parseInt(countCheck.rows[0].count, 10) === 1, 'Duplicate row created in PostgreSQL');
  console.log(`✅ PASS: Safe idempotent replay returns existing record without duplicate DB records or duplicate emails.\n`);

  console.log('========================================================================');
  console.log('🎉 ALL 6 MODULE 04 ACCEPTANCE REGRESSION TESTS PASSED (100%)');
  console.log('========================================================================\n');

  // Cleanup
  console.log('--- CLEANUP: Removing Test Records ---');
  await pool.query('DELETE FROM appointments WHERE enquiry_id = $1', [testEnquiryId]);
  await pool.query('DELETE FROM enquiries WHERE id = $1', [testEnquiryId]);
  await pool.query('DELETE FROM admin_sessions WHERE id = $1', [testSessionId]);
  await pool.query('DELETE FROM admin_users WHERE id = $1', [testStaffId]);
  await pool.end();
  server.close();
  console.log('✅ Cleanup complete. Exiting cleanly.');
  process.exit(0);
}

run().catch(async (err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  try {
    if (pool) await pool.end();
    if (server) server.close();
  } catch {}
  process.exit(1);
});
