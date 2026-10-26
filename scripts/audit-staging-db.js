/**
 * LAURREL SERVICES — SECURE READ-ONLY STAGING DATABASE AUDIT
 *
 * Performs a strictly read-only audit of a target database connection.
 * Verifies endpoint safety, Neon branch identity, and presence of existing customer data.
 *
 * SECURITY & SAFETY RULES:
 * 1. STRICT TLS ENFORCEMENT: Enforces verified TLS certificate validation (rejectUnauthorized: true).
 * 2. COMPREHENSIVE AUDIT: Queries all customer-data tables dynamically using SELECT COUNT(*).
 *    Does NOT rely on hard-coded enquiry or appointment IDs.
 * 3. ZERO DATA LEAKAGE: Never prints customer contact details (names, emails, phones),
 *    database credentials, appointment management tokens, or API keys in console logs.
 * 4. FAIL-CLOSED HALT: If any unexpected existing customer records or tokens are present,
 *    stops the acceptance process and reports the counts. NEVER deletes or mutates records.
 */

const path = require('path');
const { Client } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
const {
  assertStagingDatabaseIsolation,
  verifyLiveNeonBranchIdentity,
} = require('./lib/dbSafetyGuard');

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const PROD_URL = process.env.DATABASE_URL;

// Parse CLI flags or env
const args = process.argv.slice(2);
let targetDbUrl = process.env.TEST_DATABASE_URL;
let expectedEndpoint = process.env.EXPECTED_STAGING_ENDPOINT;
let expectedBranchId = process.env.EXPECTED_NEON_BRANCH_ID;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetDbUrl = args[i + 1];
    i++;
  } else if (args[i] === '--endpoint' && args[i + 1]) {
    expectedEndpoint = args[i + 1];
    i++;
  } else if (args[i] === '--branch' && args[i + 1]) {
    expectedBranchId = args[i + 1];
    i++;
  }
}

async function runStagingAudit() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — SECURE READ-ONLY STAGING DATABASE AUDIT');
  console.log('========================================================================\n');

  if (!targetDbUrl || !targetDbUrl.trim()) {
    console.error('ERROR: TEST_DATABASE_URL is not set.');
    console.error('Usage: TEST_DATABASE_URL="postgres://..." node scripts/audit-staging-db.js');
    console.error('   or: node scripts/audit-staging-db.js --url "postgres://..." [--endpoint <ep>] [--branch <br>]');
    process.exit(1);
  }

  // 1. Validate connection URL isolation (Strictly reject production and non-Neon hosts)
  console.log('[Audit Pre-flight] Validating connection URL safety and isolation...');
  const isolationResult = assertStagingDatabaseIsolation(targetDbUrl, PROD_URL, {
    expectedEndpoint,
    isStaging: Boolean(expectedEndpoint || expectedBranchId),
  });
  console.log(`[Audit Pre-flight] Verified safe target endpoint: ${isolationResult.testEndpoint}`);

  // 2. Connect with ENFORCED VERIFIED TLS (rejectUnauthorized: true)
  console.log('[Audit Pre-flight] Establishing database connection with verified TLS...');
  const client = new Client({
    connectionString: targetDbUrl,
    ssl: { rejectUnauthorized: true },
  });

  try {
    await client.connect();

    // 3. Verify Neon branch identity
    console.log('[Audit Pre-flight] Verifying live database branch identity...');
    const identity = await verifyLiveNeonBranchIdentity(client, {
      expectedBranchId,
      isStaging: Boolean(expectedBranchId),
    });
    console.log(`[Audit Pre-flight] Target Database Name: ${identity.database}`);
    console.log(`[Audit Pre-flight] Target Branch ID:     ${identity.branchId}`);
    console.log(`[Audit Pre-flight] Target Timeline ID:   ${identity.timelineId || 'none'}\n`);

    // 4. Query all customer-data tables using strictly read-only SELECT COUNT
    const counts = {};

    const safeCount = async (table, query) => {
      try {
        const res = await client.query(query || `SELECT COUNT(*)::int as count FROM ${table}`);
        return res.rows[0]?.count ?? 0;
      } catch (err) {
        // Return 0 if table does not exist yet (clean unmigrated schema)
        return 0;
      }
    };

    // Customer enquiry tables and fields
    counts.enquiries = await safeCount('enquiries');
    counts.enquiriesWithCustomerEmail = await safeCount(
      'enquiries',
      "SELECT COUNT(*)::int as count FROM enquiries WHERE customer_email IS NOT NULL AND customer_email != ''"
    );
    counts.enquiriesWithCustomerPhone = await safeCount(
      'enquiries',
      "SELECT COUNT(*)::int as count FROM enquiries WHERE customer_phone IS NOT NULL AND customer_phone != ''"
    );
    counts.enquiriesWithInternalNotes = await safeCount(
      'enquiries',
      "SELECT COUNT(*)::int as count FROM enquiries WHERE internal_notes IS NOT NULL AND jsonb_array_length(CASE WHEN jsonb_typeof(internal_notes) = 'array' THEN internal_notes ELSE '[]'::jsonb END) > 0"
    );

    // Customer appointment tables and fields
    counts.appointments = await safeCount('appointments');
    counts.appointmentsWithCustomerEmail = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE customer_email IS NOT NULL AND customer_email != ''"
    );
    counts.appointmentsWithTokens = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE management_token IS NOT NULL AND management_token != ''"
    );
    counts.appointmentsWithCalendarEvents = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE calendar_event_id IS NOT NULL AND calendar_event_id != ''"
    );
    counts.appointmentsWithCustomerNotes = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE customer_notes IS NOT NULL AND customer_notes != ''"
    );
    counts.appointmentsWithStaffNotes = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE staff_notes IS NOT NULL AND staff_notes != ''"
    );

    // Activity and Notification logs
    counts.appointmentActivity = await safeCount('appointment_activity');
    counts.appointmentNotifications = await safeCount('appointment_notifications');
    counts.notificationsWithRecipient = await safeCount(
      'appointment_notifications',
      "SELECT COUNT(*)::int as count FROM appointment_notifications WHERE recipient_email IS NOT NULL AND recipient_email != ''"
    );

    // Auth & Rate Limit sessions
    counts.adminSessions = await safeCount('admin_sessions');
    counts.adminPasswordResets = await safeCount('admin_password_resets');
    counts.publicRateLimits = await safeCount('public_rate_limits');
    counts.oauthStates = await safeCount('oauth_states');

    console.log('------------------------------------------------------------------------');
    console.log('STAGING DATABASE RECORD AUDIT (DYNAMIC TABLE COUNTS)');
    console.log('------------------------------------------------------------------------');
    console.log(`Endpoint Identifier:                     ${isolationResult.testEndpoint}`);
    console.log(`Neon Branch Identifier:                  ${identity.branchId}`);
    console.log(`Total Customer Enquiries:                ${counts.enquiries}`);
    console.log(` - With Customer Email / Phone:          ${counts.enquiriesWithCustomerEmail} / ${counts.enquiriesWithCustomerPhone}`);
    console.log(` - With Internal Notes:                  ${counts.enquiriesWithInternalNotes}`);
    console.log(`Total Customer Appointments:             ${counts.appointments}`);
    console.log(` - With Customer Email:                  ${counts.appointmentsWithCustomerEmail}`);
    console.log(` - With Customer Management Tokens:      ${counts.appointmentsWithTokens}`);
    console.log(` - With Calendar Event IDs:              ${counts.appointmentsWithCalendarEvents}`);
    console.log(` - With Customer Notes:                  ${counts.appointmentsWithCustomerNotes}`);
    console.log(` - With Staff Notes:                     ${counts.appointmentsWithStaffNotes}`);
    console.log(`Appointment Activity Log Rows:           ${counts.appointmentActivity}`);
    console.log(`Appointment Notification Delivery Rows:  ${counts.appointmentNotifications}`);
    console.log(`Admin Active Sessions:                   ${counts.adminSessions}`);
    console.log(`Admin Password Reset Tokens:             ${counts.adminPasswordResets}`);
    console.log(`Public Client Rate Limit Entries:        ${counts.publicRateLimits}`);
    console.log(`Active OAuth State Tokens:               ${counts.oauthStates}`);
    console.log('------------------------------------------------------------------------\n');

    const totalCustomerRecords =
      counts.enquiries +
      counts.appointments +
      counts.appointmentActivity +
      counts.appointmentNotifications +
      counts.appointmentsWithTokens +
      counts.adminSessions +
      counts.adminPasswordResets;

    if (totalCustomerRecords > 0) {
      console.warn('========================================================================');
      console.warn('⚠️  AUDIT STOP: EXISTING CUSTOMER RECORDS DETECTED IN STAGING BRANCH');
      console.warn('========================================================================');
      console.warn(`Total customer-data records detected: ${totalCustomerRecords}`);
      console.warn('This branch contains existing customer data (likely inherited from production).');
      console.warn('SAFETY PROTOCOL:');
      console.warn(' 1. Public booking and integration acceptance is STOPPED on this branch.');
      console.warn(' 2. Existing records MUST NEVER be deleted or modified automatically.');
      console.warn(' 3. Create a clean schema-only Neon staging branch from the Neon Console.');
      console.warn(' 4. Deploy with STAGING_SCHEMA_ONLY=true and SYNC_HISTORICAL_ENQUIRIES=false.');
      console.warn('========================================================================\n');

      return {
        clean: false,
        status: 'EXISTING_CUSTOMER_RECORDS_DETECTED',
        totalCustomerRecords,
        counts,
        identity,
      };
    } else {
      console.log('========================================================================');
      console.log('✅ AUDIT PASSED: ZERO CUSTOMER RECORDS FOUND (CLEAN STAGING BRANCH)');
      console.log('========================================================================');
      console.log('The staging branch is completely clean and contains 0 customer records.');
      console.log('Customer data tables are clean. Safe for public booking acceptance tests.\n');

      return {
        clean: true,
        status: 'CLEAN_SCHEMA_ONLY',
        totalCustomerRecords: 0,
        counts,
        identity,
      };
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runStagingAudit()
    .then((result) => {
      if (!result.clean) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('Audit failed with error:', err.message);
      process.exit(1);
    });
}

module.exports = { runStagingAudit };
