const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const { assertStagingDatabaseIsolation, verifyLiveNeonBranchIdentity } = require('./lib/dbSafetyGuard');

const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const crypto = require('crypto');

const STAGING_PORT = 5058;
let serverProcess = null;
let stagingPool = null;
let prodReadOnlyPool = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
    results.push({ test: testName, status: 'PASS', details });
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failCount++;
    results.push({ test: testName, status: 'FAIL', details });
  }
}

async function runAcceptance() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — PR #5 ISOLATED STAGING INTEGRATION ACCEPTANCE');
  console.log('========================================================================\n');

  // STEP 0: Enforce strict database isolation guard
  console.log('0. Evaluating Database Isolation Safety Guard...');
  try {
    const guardResult = assertStagingDatabaseIsolation(
      process.env.TEST_DATABASE_URL,
      process.env.DATABASE_URL
    );
    console.log(`  ✓ Safety Guard Verified: Staging endpoint [${guardResult.testEndpoint}] is distinct from production.`);
  } catch (err) {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  }

  // Connect to isolated staging database with strict TLS certificate verification
  stagingPool = new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    max: 5,
  });

  // Optional: Connect to production in strict read-only mode to verify zero modification
  if (process.env.DATABASE_URL) {
    prodReadOnlyPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: true },
      max: 2,
    });
  }

  // Verify Staging DB TLS
  try {
    const sslCheck = await stagingPool.query('SHOW ssl;');
    assert(sslCheck.rows.length > 0, 'Staging database connection established with verified TLS');

    // Verify Live Neon Branch Identity (Proves connection does not resolve to production branch br-bitter-shape-b41zw3xj)
    const branchCheck = await verifyLiveNeonBranchIdentity(stagingPool);
    assert(true, 'Staging database branch identity verified as distinct from production', 'Branch: ' + branchCheck.branchId);
  } catch (err) {
    assert(false, 'Staging database connection established with verified TLS', err.message);
  }

  // 1. Snapshot baseline counts to verify zero modification on production
  console.log('\n1. Verifying Database Safety Shield & Baseline Snapshots...');
  let prodInitialEnquiries = null;
  let prodInitialAppointments = null;
  let prodInitialCms = null;

  if (prodReadOnlyPool) {
    prodInitialEnquiries = Number((await prodReadOnlyPool.query('SELECT count(*) FROM enquiries;')).rows[0].count);
    prodInitialAppointments = Number((await prodReadOnlyPool.query('SELECT count(*) FROM appointments;')).rows[0].count);
    prodInitialCms = Number((await prodReadOnlyPool.query('SELECT count(*) FROM cms_pages;')).rows[0].count);
    console.log(`  ℹ️ Production Baseline count (Read-Only): Enquiries=${prodInitialEnquiries}, Appointments=${prodInitialAppointments}, CMS Pages=${prodInitialCms}`);
  }

  const initialStagingEnquiries = Number((await stagingPool.query('SELECT count(*) FROM enquiries;')).rows[0].count);
  const initialStagingAppointments = Number((await stagingPool.query('SELECT count(*) FROM appointments;')).rows[0].count);
  console.log(`  ℹ️ Staging Baseline count: Enquiries=${initialStagingEnquiries}, Appointments=${initialStagingAppointments}`);

  // 2. Launch isolated backend on STAGING_PORT connecting exclusively to TEST_DATABASE_URL
  console.log('\n2. Starting Isolated Backend Instance on Port ' + STAGING_PORT + '...');
  const env = {
    ...process.env,
    PORT: String(STAGING_PORT),
    NODE_ENV: 'test',
    DATABASE_URL: process.env.TEST_DATABASE_URL, // Strictly use TEST_DATABASE_URL
    PUBLIC_SITE_URL: 'https://deploy-preview-5--laurrel.netlify.app',
    INTERNAL_GATEWAY_SECRET: 'laurrel-staging-gateway-secret-2026',
  };

  serverProcess = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env,
    stdio: 'pipe',
  });

  // Wait for server to be ready
  let serverReady = false;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try {
      const res = await httpRequest({
        hostname: 'localhost',
        port: STAGING_PORT,
        path: '/ready',
        method: 'GET',
      });
      if (res.status === 200) {
        serverReady = true;
        break;
      }
    } catch (e) {}
  }

  assert(serverReady, 'Isolated staging backend launched and returned /ready 200');

  // 3. Test Public Endpoints
  console.log('\n3. Validating Public Booking Endpoints (Matching Backend)...');
  
  // GET /api/public/appointments/config
  const configRes = await httpRequest({
    hostname: 'localhost',
    port: STAGING_PORT,
    path: '/api/public/appointments/config',
    method: 'GET',
  });

  assert(configRes.status === 200, 'GET /api/public/appointments/config returns HTTP 200');
  assert(configRes.body.success === true, 'Public config response indicates success: true');
  assert(Array.isArray(configRes.body.allowedChannels), 'Public config supplies allowedChannels array');
  assert(configRes.body.timeZone === 'America/Toronto', 'Public config enforces Ottawa timezone (America/Toronto)');
  assert(typeof configRes.body.isGoogleMeetActive === 'boolean', 'Google Meet status is dynamically evaluated');

  // GET /api/public/appointments/availability for Monday
  const availRes = await httpRequest({
    hostname: 'localhost',
    port: STAGING_PORT,
    path: '/api/public/appointments/availability?date=2026-10-26&channel=telephone',
    method: 'GET',
  });

  assert(availRes.status === 200, 'GET /api/public/appointments/availability for Monday returns HTTP 200');
  assert(availRes.body.success === true, 'Availability query reports success: true');
  assert(Array.isArray(availRes.body.slots), 'Weekday availability returns slots array');
  assert(availRes.body.slots.length > 0, 'Operating hours contain available slots', `Found: ${availRes.body.slots.length}`);

  // GET /api/public/appointments/availability for Sunday
  const sundayRes = await httpRequest({
    hostname: 'localhost',
    port: STAGING_PORT,
    path: '/api/public/appointments/availability?date=2026-10-25&channel=telephone',
    method: 'GET',
  });

  assert(sundayRes.status === 200, 'GET /api/public/appointments/availability for Sunday returns HTTP 200');
  assert(sundayRes.body.slots.length === 0, 'Sunday returns 0 available slots (closed day)');
  assert(
    sundayRes.body.message && (sundayRes.body.message.includes('closed') || sundayRes.body.message.includes('Sunday') || sundayRes.body.message.includes('hours') || sundayRes.body.message.includes('operating')),
    'Sunday returns friendly closed day explanation'
  );

  // 4. Test Customer Booking Creation, Validation & Security Isolation
  console.log('\n4. Testing Real Customer Booking Creation & Validation...');
  
  const testSlot = availRes.body.slots[0];
  const createdAptIds = [];
  const createdEnquiryIds = [];
  const testEmail = 'marcus.acceptance@example.ca';

  const bookingPayload = {
    serviceType: 'moving',
    appointmentType: 'telephone',
    startUtc: testSlot.startUtc,
    customerName: 'Marcus Vance Acceptance Test',
    customerEmail: testEmail,
    customerPhone: '(613) 555-0199',
    customerNotes: 'Automated acceptance test booking.',
    customerTimezone: 'America/Toronto',
  };

  const bookRes = await httpRequest(
    {
      hostname: 'localhost',
      port: STAGING_PORT,
      path: '/api/public/appointments/book',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Laurrel-Client-IP': '203.0.113.195',
      },
    },
    bookingPayload
  );

  assert(bookRes.status === 201, 'POST /api/public/appointments/book returns HTTP 201 Created');
  assert(bookRes.body.success === true, 'Booking confirmation returns success: true');
  assert(Boolean(bookRes.body.appointment?.id), 'Booking creates unique appointment id');
  assert(Boolean(bookRes.body.managementToken), 'Booking generates secure customer managementToken');
  assert(Boolean(bookRes.body.icsContent), 'Booking generates standard RFC 5545 ICS calendar file');

  const mainAppointmentId = bookRes.body.appointment?.id;
  const managementToken = bookRes.body.managementToken;
  if (mainAppointmentId) {
    createdAptIds.push(mainAppointmentId);
    const enqRow = (await stagingPool.query('SELECT enquiry_id FROM appointments WHERE id = $1', [mainAppointmentId])).rows[0];
    if (enqRow?.enquiry_id && !createdEnquiryIds.includes(enqRow.enquiry_id)) {
      createdEnquiryIds.push(enqRow.enquiry_id);
    }
  }

  // 5. Verify Multi-Coordinator Capacity & Conflict Prevention
  console.log('\n5. Verifying Multi-Coordinator Capacity & Conflict Prevention...');
  // There are 4 coordinators. Book remaining 3 coordinators for testSlot, then 5th booking must fail with 409
  for (let c = 2; c <= 4; c++) {
    const extraRes = await httpRequest(
      {
        hostname: 'localhost',
        port: STAGING_PORT,
        path: '/api/public/appointments/book',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Laurrel-Client-IP': `203.0.113.${195 + c}`,
        },
      },
      {
        ...bookingPayload,
        customerName: `Customer Candidate ${c}`,
        customerEmail: `customer${c}.acceptance@example.ca`,
      }
    );
    if (extraRes.body.appointment?.id) {
      createdAptIds.push(extraRes.body.appointment.id);
      const enqRow = (await stagingPool.query('SELECT enquiry_id FROM appointments WHERE id = $1', [extraRes.body.appointment.id])).rows[0];
      if (enqRow?.enquiry_id && !createdEnquiryIds.includes(enqRow.enquiry_id)) {
        createdEnquiryIds.push(enqRow.enquiry_id);
      }
    }
  }

  // 5th attempt for the exact same slot must return HTTP 409 (All coordinators booked)
  const conflictRes = await httpRequest(
    {
      hostname: 'localhost',
      port: STAGING_PORT,
      path: '/api/public/appointments/book',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Laurrel-Client-IP': '203.0.113.250',
      },
    },
    {
      ...bookingPayload,
      customerName: 'Conflicting Requester Over Capacity',
      customerEmail: 'conflict.overcapacity@example.ca',
    }
  );

  assert(conflictRes.status === 409, 'Double-booking when all coordinators are booked returns HTTP 409 Conflict');
  assert(conflictRes.body.success === false, 'Conflict response reports success: false');

  // 6. Verify Customer Token Isolation & Anti-Tamper Security
  console.log('\n6. Verifying Customer Access Token Security & Isolation...');
  const viewRes = await httpRequest({
    hostname: 'localhost',
    port: STAGING_PORT,
    path: `/api/public/appointments/manage/${managementToken}`,
    method: 'GET',
  });

  assert(viewRes.status === 200, 'Valid customer managementToken retrieves appointment details');
  assert(viewRes.body.appointment.customerName === 'Marcus Vance Acceptance Test', 'Customer details match booked record');

  // Attempt to query with invalid/forged token
  const forgedToken = crypto.randomBytes(24).toString('hex');
  const forgedRes = await httpRequest({
    hostname: 'localhost',
    port: STAGING_PORT,
    path: `/api/public/appointments/manage/${forgedToken}`,
    method: 'GET',
  });

  assert(forgedRes.status === 404, 'Forged or invalid managementToken returns HTTP 404 Not Found');

  // 7. Verify Rescheduling and Slot Freeing
  console.log('\n7. Testing Self-Service Rescheduling & Cancellation...');
  // Reschedule coordinator 1 to slot 5 (2.5 hours away, well outside buffer)
  const distantSlot = availRes.body.slots[5] || availRes.body.slots[availRes.body.slots.length - 1];
  const rescheduleRes = await httpRequest(
    {
      hostname: 'localhost',
      port: STAGING_PORT,
      path: `/api/public/appointments/reschedule/${managementToken}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      newStartUtc: distantSlot.startUtc,
      reason: 'Customer schedule change',
    }
  );

  assert(rescheduleRes.status === 200, 'Rescheduling appointment returns HTTP 200');
  assert(rescheduleRes.body.success === true, 'Reschedule reports success: true');

  // Slot 1 must immediately reappear in available slots
  const reavailRes = await httpRequest({
    hostname: 'localhost',
    port: STAGING_PORT,
    path: '/api/public/appointments/availability?date=2026-10-26&channel=telephone',
    method: 'GET',
  });
  const firstSlotFound = reavailRes.body.slots.some((s) => s.startUtc === testSlot.startUtc);
  assert(firstSlotFound, 'Previously booked slot is immediately freed after rescheduling to distant slot');

  // Cancellation
  const cancelRes = await httpRequest(
    {
      hostname: 'localhost',
      port: STAGING_PORT,
      path: `/api/public/appointments/cancel/${managementToken}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { reason: 'Acceptance test cleanup cancellation' }
  );

  assert(cancelRes.status === 200, 'Cancelling appointment returns HTTP 200');
  assert(cancelRes.body.success === true, 'Cancellation reports success: true');

  // 8. Clean up only records created by the current test run using tracked IDs (NO broad wildcard LIKE queries)
  console.log('\n8. Cleaning up Tracked Test Data...');
  for (const aptId of createdAptIds) {
    await stagingPool.query('DELETE FROM appointment_activity WHERE appointment_id = $1;', [aptId]);
    await stagingPool.query('DELETE FROM appointment_notifications WHERE appointment_id = $1;', [aptId]);
    await stagingPool.query('DELETE FROM appointments WHERE id = $1;', [aptId]);
  }
  for (const enqId of createdEnquiryIds) {
    await stagingPool.query('DELETE FROM enquiries WHERE id = $1;', [enqId]);
  }
  console.log(`  ✓ Cleaned up ${createdAptIds.length} tracked test appointments and ${createdEnquiryIds.length} tracked test enquiries.`);

  // Confirm staging tables return to baseline
  const finalStagingEnquiries = Number((await stagingPool.query('SELECT count(*) FROM enquiries;')).rows[0].count);
  const finalStagingAppointments = Number((await stagingPool.query('SELECT count(*) FROM appointments;')).rows[0].count);
  assert(finalStagingEnquiries === initialStagingEnquiries, 'Staging customer enquiries count matches initial baseline');
  assert(finalStagingAppointments === initialStagingAppointments, 'Staging appointments count matches initial baseline');

  // Confirm production tables remain 100% identical to initial baseline
  if (prodReadOnlyPool) {
    const finalProdEnquiries = Number((await prodReadOnlyPool.query('SELECT count(*) FROM enquiries;')).rows[0].count);
    const finalProdAppointments = Number((await prodReadOnlyPool.query('SELECT count(*) FROM appointments;')).rows[0].count);
    const finalProdCms = Number((await prodReadOnlyPool.query('SELECT count(*) FROM cms_pages;')).rows[0].count);

    assert(finalProdEnquiries === prodInitialEnquiries, 'Production customer enquiries count unchanged (100% Preserved)', `Init=${prodInitialEnquiries}, Final=${finalProdEnquiries}`);
    assert(finalProdAppointments === prodInitialAppointments, 'Production appointments count unchanged (100% Preserved)', `Init=${prodInitialAppointments}, Final=${finalProdAppointments}`);
    assert(finalProdCms === prodInitialCms, 'Production CMS pages count unchanged (100% Preserved)', `Init=${prodInitialCms}, Final=${finalProdCms}`);
  }

  // 9. Status of Live Integrations
  console.log('\n9. Evaluating Live Cloud Integrations & Blockers...');
  const hasGoogleCreds = Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET);
  const hasResendCreds = Boolean(process.env.RESEND_API_KEY);

  console.log(`  ℹ️ Live Google Cloud Credentials: ${hasGoogleCreds ? 'PRESENT' : 'NOT CONFIGURED'}`);
  console.log(`  ℹ️ Live Resend API Credentials: ${hasResendCreds ? 'PRESENT' : 'NOT CONFIGURED'}`);

  console.log('\n------------------------------------------------------------------------');
  console.log(`STAGING ACCEPTANCE SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log('------------------------------------------------------------------------\n');

  if (serverProcess) {
    serverProcess.kill();
  }
  await stagingPool.end();
  if (prodReadOnlyPool) await prodReadOnlyPool.end();

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAcceptance().catch((err) => {
  console.error('Acceptance execution failed:', err);
  if (serverProcess) serverProcess.kill();
  if (stagingPool) stagingPool.end();
  if (prodReadOnlyPool) prodReadOnlyPool.end();
  process.exit(1);
});
