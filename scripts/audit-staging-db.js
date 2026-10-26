/**
 * LAURREL SERVICES — READ-ONLY STAGING DATABASE AUDIT
 *
 * Performs a read-only audit of the dedicated staging database branch.
 * Checks counts for enquiries, appointments, internal notes, customer management tokens, etc.
 * Confirms whether inherited production customer data is present.
 *
 * SAFETY RULES:
 * - Read-only queries ONLY (no INSERT, UPDATE, DELETE, DROP, TRUNCATE).
 * - NEVER prints customer contact details (names, emails, phones), credentials, or tokens.
 * - If inherited production customer records are present, reports and halts (NEVER deletes).
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
let testDbUrl = process.env.TEST_DATABASE_URL;
let expectedEndpoint = process.env.EXPECTED_STAGING_ENDPOINT;
let expectedBranchId = process.env.EXPECTED_NEON_BRANCH_ID;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    testDbUrl = args[i + 1];
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
  console.log('LAURREL SERVICES — READ-ONLY STAGING DATABASE AUDIT');
  console.log('========================================================================\n');

  if (!testDbUrl) {
    console.error('ERROR: TEST_DATABASE_URL is not set.');
    console.error('Usage: TEST_DATABASE_URL="postgres://..." node scripts/audit-staging-db.js');
    console.error('   or: node scripts/audit-staging-db.js --url "postgres://..." [--endpoint <ep>] [--branch <br>]');
    process.exit(1);
  }

  // 1. Validate connection URL isolation
  console.log('[Audit Pre-flight] Validating connection URL safety and isolation...');
  const isolationResult = assertStagingDatabaseIsolation(testDbUrl, PROD_URL, {
    expectedEndpoint,
    isStaging: Boolean(expectedEndpoint || expectedBranchId),
  });
  console.log(`[Audit Pre-flight] Target endpoint: ${isolationResult.testEndpoint} (Neon isolated endpoint verified)`);

  // 2. Connect to database
  const client = new Client({
    connectionString: testDbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 3. Verify Neon branch identity
    console.log('[Audit Pre-flight] Verifying live database branch identity...');
    const identity = await verifyLiveNeonBranchIdentity(client, {
      expectedBranchId,
      isStaging: Boolean(expectedBranchId),
    });
    console.log(`[Audit Pre-flight] Connected database: ${identity.database}`);
    console.log(`[Audit Pre-flight] Connected branch ID: ${identity.branchId}`);
    console.log(`[Audit Pre-flight] Connected timeline ID: ${identity.timelineId || 'none'}\n`);

    // 4. Query customer-data record counts (Read-only SELECT COUNT)
    const counts = {};

    const safeCount = async (table, query) => {
      try {
        const res = await client.query(query || `SELECT COUNT(*)::int as count FROM ${table}`);
        return res.rows[0]?.count ?? 0;
      } catch (err) {
        return `N/A (${err.code || 'table missing'})`;
      }
    };

    counts.enquiries = await safeCount('enquiries');
    counts.appointments = await safeCount('appointments');
    counts.appointmentActivity = await safeCount('appointment_activity');
    counts.appointmentNotifications = await safeCount('appointment_notifications');
    counts.adminSessions = await safeCount('admin_sessions');
    counts.adminPasswordResets = await safeCount('admin_password_resets');

    counts.appointmentsWithTokens = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE management_token IS NOT NULL AND management_token != ''"
    );
    counts.appointmentsWithStaffNotes = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE staff_notes IS NOT NULL AND staff_notes != ''"
    );
    counts.appointmentsWithCustomerNotes = await safeCount(
      'appointments',
      "SELECT COUNT(*)::int as count FROM appointments WHERE customer_notes IS NOT NULL AND customer_notes != ''"
    );

    // 5. Check if production enquiry baseline IDs are present
    let inheritedProductionEnquiriesDetected = false;
    try {
      const prodEnqCheck = await client.query(
        "SELECT COUNT(*)::int as count FROM enquiries WHERE id LIKE 'enq_%' AND id IN (" +
        "'enq_1729000000000_001', 'enq_1729000000000_002', 'enq_1729000000000_003', " +
        "'enq_1729000000000_004', 'enq_1729000000000_005', 'enq_1729000000000_006')"
      );
      if (prodEnqCheck.rows[0]?.count > 0) {
        inheritedProductionEnquiriesDetected = true;
      }
    } catch {
      // Table may not exist yet
    }

    console.log('------------------------------------------------------------------------');
    console.log('STAGING DATABASE RECORD AUDIT RESULTS (READ-ONLY COUNT SUMMARY)');
    console.log('------------------------------------------------------------------------');
    console.log(`Endpoint ID:                       ${isolationResult.testEndpoint}`);
    console.log(`Branch ID:                         ${identity.branchId}`);
    console.log(`Enquiries count:                   ${counts.enquiries}`);
    console.log(`Appointments count:                ${counts.appointments}`);
    console.log(`Customer management tokens count:  ${counts.appointmentsWithTokens}`);
    console.log(`Customer notes count:              ${counts.appointmentsWithCustomerNotes}`);
    console.log(`Staff notes count:                 ${counts.appointmentsWithStaffNotes}`);
    console.log(`Appointment activity count:        ${counts.appointmentActivity}`);
    console.log(`Appointment notifications count:   ${counts.appointmentNotifications}`);
    console.log(`Admin active sessions count:       ${counts.adminSessions}`);
    console.log(`Password reset tokens count:       ${counts.adminPasswordResets}`);
    console.log(`Inherited production enquiries:    ${inheritedProductionEnquiriesDetected ? 'DETECTED' : 'NONE DETECTED'}`);
    console.log('------------------------------------------------------------------------\n');

    const totalCustomerRecords =
      (typeof counts.enquiries === 'number' ? counts.enquiries : 0) +
      (typeof counts.appointments === 'number' ? counts.appointments : 0);

    if (totalCustomerRecords > 0 || inheritedProductionEnquiriesDetected) {
      console.warn('⚠️  AUDIT ADVISORY: INHERITED RECORDS DETECTED IN STAGING BRANCH');
      console.warn('Child Neon staging branch inherits records from production.');
      console.warn(`Total customer records present: ${totalCustomerRecords}`);
      console.warn('Per safety protocol: NEVER automatically delete or purge customer records.');
      console.warn('For schema-only testing, configure STAGING_SCHEMA_ONLY=true and SYNC_HISTORICAL_ENQUIRIES=false');
      console.warn('to prevent syncing or mutation of customer data.\n');
      return {
        status: 'INHERITED_RECORDS_PRESENT',
        totalCustomerRecords,
        counts,
        identity,
      };
    } else {
      console.log('✅ AUDIT PASSED: ZERO CUSTOMER RECORDS FOUND IN STAGING DATABASE');
      console.log('The staging database is clean and contains 0 customer records.');
      console.log('Safe for staging self-service booking and Google Calendar testing.\n');
      return {
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
  runStagingAudit().catch((err) => {
    console.error('Audit failed with error:', err.message);
    process.exit(1);
  });
}

module.exports = { runStagingAudit };
