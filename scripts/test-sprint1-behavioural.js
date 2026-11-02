/**
 * LAURREL SERVICES — SPRINT 1 BEHAVIOURAL TEST SUITE
 * 
 * STRICT NON-PRODUCTION SAFETY GUARD:
 * This script verifies administrative callback workflows, state transitions,
 * audit logging, and RBAC permissions.
 * 
 * Execution Requirements:
 * 1. Must NEVER run against the production database.
 * 2. Requires an explicitly configured TEST_DATABASE_URL or STAGING_DATABASE_URL.
 * 3. Enforces database identity verification (checks current_database() and isolation markers).
 * 4. Never uses real production administrator credentials (requires TEST_ADMIN_* or generates
 *    ephemeral synthetic test users in the isolated database).
 * 5. Uses standard TLS certificate verification (no rejectUnauthorized: false).
 * 6. Fixture creation is strictly synthetic and cleanup is safe, targeted, and idempotent.
 */

const path = require('path');
const dotenv = require(path.resolve('backend/node_modules/dotenv'));
dotenv.config({ path: path.resolve('backend/.env') });

const { Pool } = require(path.resolve('backend/node_modules/pg'));

const API_BASE = process.env.TEST_API_BASE_URL || 'http://localhost:5000';

// Known production identifiers that must NEVER be targeted
const KNOWN_PROD_HOST_FRAGMENT = 'ep-raspy-dew-b4agbivi-pooler';
const KNOWN_PROD_DB_NAME = 'neondb';

async function validateDatabaseIsolation(dbUrl) {
  if (!dbUrl) {
    return {
      safe: false,
      reason: 'No test database URL provided. Refusing to run without explicit TEST_DATABASE_URL or STAGING_DATABASE_URL.',
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(dbUrl);
  } catch (err) {
    return {
      safe: false,
      reason: `Malformed test database URL: ${err.message}`,
    };
  }

  // Guard 1: Hostname check against production host
  if (parsedUrl.host.includes(KNOWN_PROD_HOST_FRAGMENT)) {
    return {
      safe: false,
      reason: `SAFETY VIOLATION: Database host "${parsedUrl.host}" matches known production cluster. Behavioural tests are strictly forbidden on production.`,
    };
  }

  // Guard 2: Refuse if identical to main application DATABASE_URL unless explicit non-prod environment is verified
  if (process.env.DATABASE_URL && dbUrl === process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production' || parsedUrl.pathname === `/${KNOWN_PROD_DB_NAME}`) {
      return {
        safe: false,
        reason: 'SAFETY VIOLATION: TEST_DATABASE_URL is identical to production application DATABASE_URL.',
      };
    }
  }

  // Guard 3: Database name must indicate test/staging isolation
  const dbName = parsedUrl.pathname.replace(/^\//, '').toLowerCase();
  const isIsolatedDbName =
    dbName.includes('test') ||
    dbName.includes('staging') ||
    dbName.includes('isolated') ||
    dbName.includes('ci');

  // Guard 4: Explicit operator confirmation flag
  const hasOperatorConfirmation = process.env.ALLOW_ISOLATED_TEST_DB_RUN === 'true';

  if (!isIsolatedDbName && !hasOperatorConfirmation) {
    return {
      safe: false,
      reason: `SAFETY REJECTION: Database "${dbName}" does not have a recognized isolation name (must contain 'test', 'staging', 'isolated', or 'ci') and ALLOW_ISOLATED_TEST_DB_RUN is not set to 'true'.`,
    };
  }

  return { safe: true, dbName, host: parsedUrl.host };
}

async function runTests() {
  console.log('====================================================');
  console.log('LAURREL SERVICES — SPRINT 1 BEHAVIOURAL TEST RUNNER');
  console.log('====================================================\n');

  // Verify non-production environment
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL SAFETY ERROR: NODE_ENV is set to "production".');
    console.error('Behavioural tests cannot execute in a production environment.');
    process.exit(1);
  }

  const testDbUrl = process.env.TEST_DATABASE_URL || process.env.STAGING_DATABASE_URL;
  const safetyCheck = await validateDatabaseIsolation(testDbUrl);

  if (!safetyCheck.safe) {
    console.error('----------------------------------------------------');
    console.error('ENVIRONMENT SAFETY GUARD REJECTION');
    console.error('----------------------------------------------------');
    console.error(safetyCheck.reason);
    console.error('\nTo run behavioural integration tests safely:');
    console.error('1. Provision an isolated local or cloud PostgreSQL test database.');
    console.error('2. Set TEST_DATABASE_URL=<isolated_connection_string>');
    console.error('3. Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD with non-production credentials.');
    console.error('4. (Optional) Set ALLOW_ISOLATED_TEST_DB_RUN=true if using a custom staging branch.');
    console.error('----------------------------------------------------');
    process.exit(1);
  }

  console.log(`[SAFETY CHECK PASSED] Connected to isolated test database: ${safetyCheck.dbName} on ${safetyCheck.host}`);

  // TLS verification: Standard TLS without disabling cert verification
  const pool = new Pool({
    connectionString: testDbUrl,
    ssl: process.env.TEST_DB_NO_SSL === 'true' ? false : { rejectUnauthorized: true },
  });

  // Verify actual database identity via active query
  let client;
  try {
    client = await pool.connect();
    const idCheck = await client.query('SELECT current_database() as db, current_user as user');
    const activeDb = idCheck.rows[0]?.db;
    console.log(`[DB IDENTITY VERIFIED] Active database: ${activeDb}`);

    if (activeDb === KNOWN_PROD_DB_NAME && safetyCheck.host.includes('neon.tech')) {
      throw new Error(`Connected database "${activeDb}" matches production schema name. Aborting immediately.`);
    }
  } catch (connErr) {
    console.error(`FATAL: Could not verify test database identity: ${connErr.message}`);
    if (client) client.release();
    await pool.end();
    process.exit(1);
  } finally {
    if (client) client.release();
  }

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

  // Non-production credentials
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('FATAL: TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be configured with test credentials.');
    console.error('Real production administrator credentials are strictly prohibited in behavioural tests.');
    await pool.end();
    process.exit(1);
  }

  let sessionId = null;
  const uniqueRunId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const fixtureId = `test_fixture_sprint1_${uniqueRunId}`;

  try {
    // ----------------------------------------------------
    // TEST 1: Unauthenticated Endpoint Security
    // ----------------------------------------------------
    console.log('\n--- SUITE 1: Security & Authentication Gates ---');
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
      [fixtureId, `sess_${uniqueRunId}`, 'Synthetic Test Client', `synthetic_${uniqueRunId}@laurrelservices.internal`]
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
    const allAudits = await pool.query(
      'SELECT event_type, payload FROM audit_logs WHERE entity_id = $1 ORDER BY created_at ASC',
      [fixtureId]
    );
    assert(
      allAudits.rows.length === 4,
      `Audit Trail Integrity: Recorded exactly 4 valid transitions in audit_logs (found ${allAudits.rows.length})`
    );

  } finally {
    // ----------------------------------------------------
    // CLEANUP: Purge strictly the synthetic fixtures created in this run
    // ----------------------------------------------------
    console.log('\n--- CLEANUP: Purging Synthetic Test Fixtures ---');
    try {
      // Targeted deletion: strictly matches the unique fixture ID for this execution
      const delAudit = await pool.query('DELETE FROM audit_logs WHERE entity_id = $1', [fixtureId]);
      const delHandoff = await pool.query('DELETE FROM ai_handoffs WHERE id = $1', [fixtureId]);
      console.log(`[CLEANUP] Deleted ${delHandoff.rowCount} test handoff record and ${delAudit.rowCount} audit logs.`);

      if (sessionId) {
        const delSession = await pool.query('DELETE FROM admin_sessions WHERE id = $1', [sessionId]);
        console.log(`[CLEANUP] Revoked test admin session (${delSession.rowCount} session).`);
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
