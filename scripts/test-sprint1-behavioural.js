const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (options && options.all) {
        return callback(
          null,
          addresses.map((a) => ({ address: a, family: 4 }))
        );
      }
      return callback(null, addresses[0], 4);
    }
    return origLookup(hostname, options, callback);
  });
};

const path = require('path');
const dotenv = require(path.resolve('backend/node_modules/dotenv'));
dotenv.config({ path: path.resolve('backend/.env') });

const { Pool } = require(path.resolve('backend/node_modules/pg'));

const API_BASE = 'http://localhost:5000';
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('FATAL: DATABASE_URL not set in backend/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

async function runTests() {
  console.log('====================================================');
  console.log('LAURREL SERVICES — SPRINT 1 BEHAVIOURAL TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? '- ' + details : ''}`);
      failed++;
    }
  }

  const email = process.env.ADMIN_OWNER_EMAIL;
  const password = process.env.ADMIN_OWNER_PASSWORD;

  if (!email || !password) {
    console.error('FATAL: Admin credentials missing from backend/.env');
    process.exit(1);
  }

  let sessionId = null;
  const fixtureId = `test_fixture_sprint1_${Date.now()}`;

  try {
    // ----------------------------------------------------
    // TEST 1: Unauthenticated Endpoint Security
    // ----------------------------------------------------
    console.log('--- SUITE 1: Security & Authentication Gates ---');
    const unauthSettings = await fetch(`${API_BASE}/api/admin/appointments/settings`);
    assert(
      unauthSettings.status === 401,
      'Endpoint Security: GET /api/admin/appointments/settings rejects unauthenticated request with 401',
      `Got status ${unauthSettings.status}`
    );

    const unauthHandoffs = await fetch(`${API_BASE}/api/admin/handoffs`);
    assert(
      unauthHandoffs.status === 401,
      'Endpoint Security: GET /api/admin/handoffs rejects unauthenticated request with 401',
      `Got status ${unauthHandoffs.status}`
    );

    const unauthPatch = await fetch(`${API_BASE}/api/admin/handoffs/fake_id/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'contacted' }),
    });
    assert(
      unauthPatch.status === 401,
      'Endpoint Security: PATCH /api/admin/handoffs/:id/status rejects unauthenticated request with 401',
      `Got status ${unauthPatch.status}`
    );

    // ----------------------------------------------------
    // TEST 2: Admin Authentication & Session Issuance
    // ----------------------------------------------------
    console.log('\n--- SUITE 2: Admin Authentication ---');
    const loginRes = await fetch(`${API_BASE}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    assert(loginRes.status === 200, 'Admin Login: Authenticates administrator credentials', `Got status ${loginRes.status}`);
    const loginData = await loginRes.json();
    assert(Boolean(loginData.sessionId), 'Admin Login: Returns valid session ID');
    assert(
      loginData.user && ['owner', 'admin'].includes(loginData.user.role),
      'Admin Login: Authenticated user has authorized administrative role'
    );
    sessionId = loginData.sessionId;

    const authHeaders = {
      'Content-Type': 'application/json',
      'x-admin-session-id': sessionId,
    };

    // ----------------------------------------------------
    // TEST 3: Appointment Settings Retrieval
    // ----------------------------------------------------
    console.log('\n--- SUITE 3: Appointment Settings ---');
    const settingsRes = await fetch(`${API_BASE}/api/admin/appointments/settings`, {
      headers: authHeaders,
    });
    assert(settingsRes.status === 200, 'Appointment Settings: GET succeeds with valid session', `Got status ${settingsRes.status}`);
    const settingsData = await settingsRes.json();
    assert(settingsData.success === true, 'Appointment Settings: Returns success true');
    assert(Boolean(settingsData.settings), 'Appointment Settings: Returns settings object');
    assert(Array.isArray(settingsData.integrations), 'Appointment Settings: Returns integrations list');

    // ----------------------------------------------------
    // TEST 4: Handoffs List, Pagination & Accurate Counts
    // ----------------------------------------------------
    console.log('\n--- SUITE 4: Callback Management & Counts ---');
    const handoffsRes = await fetch(`${API_BASE}/api/admin/handoffs?limit=5&page=1`, {
      headers: authHeaders,
    });
    assert(handoffsRes.status === 200, 'Handoffs API: GET succeeds with valid session', `Got status ${handoffsRes.status}`);
    const handoffsData = await handoffsRes.json();
    assert(Array.isArray(handoffsData.handoffs), 'Handoffs API: Returns handoffs array');
    assert(typeof handoffsData.total === 'number', 'Handoffs API: Returns total numeric count');
    assert(typeof handoffsData.page === 'number' && handoffsData.page === 1, 'Handoffs API: Returns page 1');
    assert(typeof handoffsData.limit === 'number' && handoffsData.limit === 5, 'Handoffs API: Returns limit 5');
    assert(
      handoffsData.statusCounts &&
        typeof handoffsData.statusCounts.all === 'number' &&
        typeof handoffsData.statusCounts.pending === 'number' &&
        typeof handoffsData.statusCounts.contacted === 'number' &&
        typeof handoffsData.statusCounts.resolved === 'number' &&
        typeof handoffsData.statusCounts.dismissed === 'number',
      'Handoffs API: Returns complete statusCounts totals across all pages'
    );

    // ----------------------------------------------------
    // TEST 5: Synthetic Test Fixture Insertion
    // ----------------------------------------------------
    console.log('\n--- SUITE 5: Callback Transition State Machine & Integrity ---');
    await pool.query(
      `INSERT INTO ai_handoffs (id, session_id, customer_name, customer_email, status, reason, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'pending', 'Automated synthetic verification', NOW(), NOW())`,
      [fixtureId, 'sess_sprint1_test', 'Synthetic Test Client', 'synthetic-test@laurrelservices.internal']
    );
    console.log(`[SETUP] Inserted temporary synthetic fixture: ${fixtureId}`);

    // Transition A: pending -> contacted (VALID)
    const t1Res = await fetch(`${API_BASE}/api/admin/handoffs/${fixtureId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'contacted', note: 'Contacted customer via telephone' }),
    });
    assert(t1Res.status === 200, 'Transition [pending -> contacted]: Accepted with HTTP 200', `Got status ${t1Res.status}`);
    const t1Data = await t1Res.json();
    assert(t1Data.handoff?.status === 'contacted', 'Transition [pending -> contacted]: Record status updated in response');

    // Verify in PostgreSQL database
    const dbT1 = await pool.query('SELECT status FROM ai_handoffs WHERE id = $1', [fixtureId]);
    assert(dbT1.rows[0]?.status === 'contacted', 'Database Verification: Status persisted as "contacted" in PostgreSQL');

    // Verify audit log entry
    const auditT1 = await pool.query(
      `SELECT * FROM audit_logs WHERE entity_id = $1 AND event_type = 'handoff_status_updated' ORDER BY created_at DESC LIMIT 1`,
      [fixtureId]
    );
    assert(auditT1.rows.length === 1, 'Audit Log Verification: Audit record created for pending -> contacted');
    assert(
      auditT1.rows[0]?.payload?.previousStatus === 'pending' &&
        auditT1.rows[0]?.payload?.newStatus === 'contacted',
      'Audit Log Verification: Previous and new statuses accurately recorded in audit payload'
    );

    // Transition B: contacted -> resolved (VALID)
    const t2Res = await fetch(`${API_BASE}/api/admin/handoffs/${fixtureId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'resolved', note: 'Customer requirements resolved' }),
    });
    assert(t2Res.status === 200, 'Transition [contacted -> resolved]: Accepted with HTTP 200', `Got status ${t2Res.status}`);
    const dbT2 = await pool.query('SELECT status FROM ai_handoffs WHERE id = $1', [fixtureId]);
    assert(dbT2.rows[0]?.status === 'resolved', 'Database Verification: Status persisted as "resolved" in PostgreSQL');

    // Transition C: resolved -> contacted (INVALID - SKIPPING PERMITTED REOPENING)
    const t3Res = await fetch(`${API_BASE}/api/admin/handoffs/${fixtureId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'contacted' }),
    });
    assert(
      t3Res.status === 422,
      'Transition [resolved -> contacted]: REJECTED with HTTP 422 Unprocessable Entity',
      `Got status ${t3Res.status}`
    );
    const t3Data = await t3Res.json();
    assert(
      t3Data.currentStatus === 'resolved' &&
        t3Data.requestedStatus === 'contacted' &&
        Array.isArray(t3Data.allowedTransitions) &&
        t3Data.allowedTransitions.includes('pending'),
      'Transition Error Contract: Response specifies currentStatus, requestedStatus, and allowedTransitions'
    );
    const dbT3 = await pool.query('SELECT status FROM ai_handoffs WHERE id = $1', [fixtureId]);
    assert(dbT3.rows[0]?.status === 'resolved', 'Database Integrity: Status remained "resolved" after invalid transition');

    // Transition D: resolved -> resolved (INVALID - SAME STATUS)
    const t4Res = await fetch(`${API_BASE}/api/admin/handoffs/${fixtureId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'resolved' }),
    });
    assert(
      t4Res.status === 422,
      'Transition [resolved -> resolved]: REJECTED with HTTP 422 (same-status no-op prohibited)',
      `Got status ${t4Res.status}`
    );

    // Transition E: resolved -> pending (VALID REOPENING)
    const t5Res = await fetch(`${API_BASE}/api/admin/handoffs/${fixtureId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'pending', note: 'Customer followed up with new questions, reopening' }),
    });
    assert(t5Res.status === 200, 'Transition [resolved -> pending]: Reopening accepted with HTTP 200', `Got status ${t5Res.status}`);
    const dbT5 = await pool.query('SELECT status FROM ai_handoffs WHERE id = $1', [fixtureId]);
    assert(dbT5.rows[0]?.status === 'pending', 'Database Verification: Status persisted as "pending" (reopened)');

    // Transition F: pending -> dismissed (VALID DISMISSAL)
    const t6Res = await fetch(`${API_BASE}/api/admin/handoffs/${fixtureId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'dismissed', note: 'Customer cancelled inquiry' }),
    });
    assert(t6Res.status === 200, 'Transition [pending -> dismissed]: Dismissal accepted with HTTP 200', `Got status ${t6Res.status}`);
    const dbT6 = await pool.query('SELECT status FROM ai_handoffs WHERE id = $1', [fixtureId]);
    assert(dbT6.rows[0]?.status === 'dismissed', 'Database Verification: Status persisted as "dismissed"');

    // Transition G: non-existent ID
    const t7Res = await fetch(`${API_BASE}/api/admin/handoffs/non_existent_fixture_999999/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'contacted' }),
    });
    assert(t7Res.status === 404, 'Non-existent Handoff: Returns HTTP 404 Not Found', `Got status ${t7Res.status}`);

    // Total audit records for this fixture
    const allAudits = await pool.query('SELECT event_type, payload FROM audit_logs WHERE entity_id = $1 ORDER BY created_at ASC', [
      fixtureId,
    ]);
    assert(
      allAudits.rows.length === 4,
      `Audit Trail Integrity: Recorded exactly 4 valid transitions in audit_logs (found ${allAudits.rows.length})`
    );

  } finally {
    // ----------------------------------------------------
    // CLEANUP: Purge all synthetic test data
    // ----------------------------------------------------
    console.log('\n--- CLEANUP: Purging Synthetic Test Fixtures ---');
    try {
      const delAudit = await pool.query('DELETE FROM audit_logs WHERE entity_id = $1', [fixtureId]);
      const delHandoff = await pool.query('DELETE FROM ai_handoffs WHERE id = $1', [fixtureId]);
      console.log(`[CLEANUP] Deleted ${delHandoff.rowCount} test handoff record and ${delAudit.rowCount} audit logs.`);

      if (sessionId) {
        const delSession = await pool.query('DELETE FROM admin_sessions WHERE id = $1', [sessionId]);
        console.log(`[CLEANUP] Revoked and purged test admin session (${delSession.rowCount} session).`);
      }
    } catch (cleanupErr) {
      console.error('[CLEANUP ERROR]:', cleanupErr.message);
    }

    await pool.end();
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test failure:', err);
  process.exit(1);
});
