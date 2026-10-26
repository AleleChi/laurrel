const path = require('path');
const { spawnSync } = require('child_process');
const {
  assertStagingEnvironmentConfig,
  assertStagingDatabaseIsolation,
  verifyLiveNeonBranchIdentity,
  PRODUCTION_NEON_ENDPOINTS,
  PRODUCTION_NEON_BRANCH_ID,
  PRODUCTION_NEON_TIMELINE_ID,
} = require('./lib/dbSafetyGuard');

const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const PROD_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:secret@ep-raspy-dew-b4agbivi-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    failCount++;
  }
}

async function runProof() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — MANDATORY STAGING & FAIL-CLOSED ISOLATION PROOF');
  console.log('========================================================================\n');

  console.log('--- 1. Mandatory Staging Configuration Guard Tests ---');

  // Test 1: Refusal when APP_ENV is missing or not 'staging'
  try {
    assertStagingEnvironmentConfig({
      isStaging: true,
      appEnv: '',
      expectedEndpoint: 'ep-staging-12345',
      expectedBranchId: 'br-staging-12345',
      stagingSchemaOnly: 'true',
      syncHistoricalEnquiries: 'false',
    });
    assert(false, 'Refuses when APP_ENV is empty in staging');
  } catch (err) {
    assert(
      err.message.includes("APP_ENV must be explicitly set to 'staging'"),
      'Refuses when APP_ENV is empty in staging',
      err.message
    );
  }

  // Test 2: Refusal when EXPECTED_STAGING_ENDPOINT is missing
  try {
    assertStagingEnvironmentConfig({
      isStaging: true,
      appEnv: 'staging',
      expectedEndpoint: '',
      expectedBranchId: 'br-staging-12345',
      stagingSchemaOnly: 'true',
      syncHistoricalEnquiries: 'false',
    });
    assert(false, 'Refuses when EXPECTED_STAGING_ENDPOINT is missing');
  } catch (err) {
    assert(
      err.message.includes('EXPECTED_STAGING_ENDPOINT is mandatory in staging'),
      'Refuses when EXPECTED_STAGING_ENDPOINT is missing',
      err.message
    );
  }

  // Test 3: Refusal when EXPECTED_NEON_BRANCH_ID is missing
  try {
    assertStagingEnvironmentConfig({
      isStaging: true,
      appEnv: 'staging',
      expectedEndpoint: 'ep-staging-12345',
      expectedBranchId: '',
      stagingSchemaOnly: 'true',
      syncHistoricalEnquiries: 'false',
    });
    assert(false, 'Refuses when EXPECTED_NEON_BRANCH_ID is missing');
  } catch (err) {
    assert(
      err.message.includes('EXPECTED_NEON_BRANCH_ID is mandatory in staging'),
      'Refuses when EXPECTED_NEON_BRANCH_ID is missing',
      err.message
    );
  }

  // Test 4: Refusal when STAGING_SCHEMA_ONLY is not 'true'
  try {
    assertStagingEnvironmentConfig({
      isStaging: true,
      appEnv: 'staging',
      expectedEndpoint: 'ep-staging-12345',
      expectedBranchId: 'br-staging-12345',
      stagingSchemaOnly: 'false',
      syncHistoricalEnquiries: 'false',
    });
    assert(false, 'Refuses when STAGING_SCHEMA_ONLY is not true');
  } catch (err) {
    assert(
      err.message.includes("STAGING_SCHEMA_ONLY must be strictly 'true'"),
      'Refuses when STAGING_SCHEMA_ONLY is not true',
      err.message
    );
  }

  // Test 5: Refusal when SYNC_HISTORICAL_ENQUIRIES is not 'false'
  try {
    assertStagingEnvironmentConfig({
      isStaging: true,
      appEnv: 'staging',
      expectedEndpoint: 'ep-staging-12345',
      expectedBranchId: 'br-staging-12345',
      stagingSchemaOnly: 'true',
      syncHistoricalEnquiries: 'true',
    });
    assert(false, 'Refuses when SYNC_HISTORICAL_ENQUIRIES is true in staging');
  } catch (err) {
    assert(
      err.message.includes("SYNC_HISTORICAL_ENQUIRIES must be strictly 'false'"),
      'Refuses when SYNC_HISTORICAL_ENQUIRIES is true in staging',
      err.message
    );
  }

  // Test 6: Accepts fully valid staging configuration
  try {
    const config = assertStagingEnvironmentConfig({
      isStaging: true,
      appEnv: 'staging',
      expectedEndpoint: 'ep-staging-12345',
      expectedBranchId: 'br-staging-12345',
      stagingSchemaOnly: 'true',
      syncHistoricalEnquiries: 'false',
    });
    assert(config.appEnv === 'staging' && config.stagingSchemaOnly === true, 'Accepts valid staging configuration');
  } catch (err) {
    assert(false, 'Accepts valid staging configuration', err.message);
  }

  console.log('\n--- 2. Database Connection URL & Hostname Guard Tests ---');

  // Test 7: Missing TEST_DATABASE_URL
  try {
    assertStagingDatabaseIsolation(undefined, PROD_URL);
    assert(false, 'Refuses execution when TEST_DATABASE_URL is missing');
  } catch (err) {
    assert(
      err.message.includes('TEST_DATABASE_URL environment variable is missing'),
      'Refuses execution when TEST_DATABASE_URL is missing',
      err.message
    );
  }

  // Test 8: Empty TEST_DATABASE_URL
  try {
    assertStagingDatabaseIsolation('   ', PROD_URL);
    assert(false, 'Refuses execution when TEST_DATABASE_URL is empty string');
  } catch (err) {
    assert(
      err.message.includes('TEST_DATABASE_URL environment variable is missing'),
      'Refuses execution when TEST_DATABASE_URL is empty string',
      err.message
    );
  }

  // Test 9: Non-Neon Destination Check (Refuses AWS RDS, Supabase, self-hosted, etc.)
  try {
    assertStagingDatabaseIsolation('postgresql://user:pass@mydb.rds.amazonaws.com:5432/neondb?sslmode=require', PROD_URL);
    assert(false, 'Refuses non-Neon database destination');
  } catch (err) {
    assert(
      err.message.includes('must be hosted on Neon (*.neon.tech)'),
      'Refuses non-Neon database destination',
      err.message
    );
  }

  // Test 10: Exact match with production DATABASE_URL
  try {
    assertStagingDatabaseIsolation(PROD_URL, PROD_URL);
    assert(false, 'Refuses execution when TEST_DATABASE_URL equals production DATABASE_URL');
  } catch (err) {
    assert(
      err.message.includes('targets production Neon endpoint') || err.message.includes('identical to production'),
      'Refuses execution when TEST_DATABASE_URL equals production DATABASE_URL',
      err.message
    );
  }

  // Test 11: Production endpoint with altered credentials/params
  const alteredProdUrl = 'postgresql://staging_user:dummy_password@ep-raspy-dew-b4agbivi-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  try {
    assertStagingDatabaseIsolation(alteredProdUrl, PROD_URL);
    assert(false, 'Refuses execution when TEST_DATABASE_URL targets production Neon endpoint with different credentials');
  } catch (err) {
    assert(
      err.message.includes('targets production Neon endpoint (ep-raspy-dew-b4agbivi)'),
      'Refuses execution when TEST_DATABASE_URL targets production Neon endpoint with different credentials',
      err.message
    );
  }

  // Test 12: Direct (non-pooler) production endpoint
  const directProdUrl = 'postgresql://neondb_owner:secret@ep-raspy-dew-b4agbivi.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  try {
    assertStagingDatabaseIsolation(directProdUrl, PROD_URL);
    assert(false, 'Refuses execution when TEST_DATABASE_URL targets non-pooler production endpoint');
  } catch (err) {
    assert(
      err.message.includes('targets production Neon endpoint (ep-raspy-dew-b4agbivi)'),
      'Refuses execution when TEST_DATABASE_URL targets non-pooler production endpoint',
      err.message
    );
  }

  // Test 13: Insecure TLS (sslmode=disable)
  const insecureUrl = 'postgresql://staging_user:pass@ep-staging-branch-12345.c-6.us-east-2.aws.neon.tech/neondb?sslmode=disable';
  try {
    assertStagingDatabaseIsolation(insecureUrl, PROD_URL);
    assert(false, 'Refuses execution when staging connection uses insecure sslmode=disable');
  } catch (err) {
    assert(
      err.message.includes('must use TLS'),
      'Refuses execution when staging connection uses insecure sslmode=disable',
      err.message
    );
  }

  // Test 14: Substring spoofing attack rejected (e.g. ep-staging-12345-spoof when expecting ep-staging-12345)
  try {
    assertStagingDatabaseIsolation(
      'postgresql://staging_user:pass@ep-staging-12345-spoof.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
      PROD_URL,
      { expectedEndpoint: 'ep-staging-12345' }
    );
    assert(false, 'Refuses execution when endpoint has substring spoof of expected endpoint');
  } catch (err) {
    assert(
      err.message.includes('endpoint mismatch') && err.message.includes('ep-staging-12345'),
      'Refuses execution when endpoint has substring spoof of expected endpoint',
      err.message
    );
  }

  // Test 15: Legitimate, isolated Neon staging branch endpoint passes URL assertion
  const validStagingUrl = 'postgresql://staging_user:pass@ep-staging-clean-554433-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  try {
    const result = assertStagingDatabaseIsolation(validStagingUrl, PROD_URL);
    assert(result.valid === true, 'Accepts genuinely isolated staging Neon branch endpoint');
    assert(result.testEndpoint === 'ep-staging-clean-554433-pooler', 'Correctly parses staging endpoint ID');
    assert(result.baseEndpointId === 'ep-staging-clean-554433', 'Correctly parses base endpoint ID');
  } catch (err) {
    assert(false, 'Accepts genuinely isolated staging Neon branch endpoint', err.message);
  }

  // Test 16: Expected Endpoint Match
  try {
    const matched = assertStagingDatabaseIsolation(
      'postgresql://staging_user:pass@ep-expected-99999-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
      PROD_URL,
      { expectedEndpoint: 'ep-expected-99999' }
    );
    assert(matched.valid === true, 'Accepts connection when expected staging endpoint matches');
  } catch (err) {
    assert(false, 'Accepts connection when expected staging endpoint matches', err.message);
  }

  console.log('\n--- 3. Live Neon Branch Identity Guard Tests ---');

  // Test 17: Rejects production branch ID
  const mockProdClient = {
    query: async () => ({
      rows: [{
        branch_id: PRODUCTION_NEON_BRANCH_ID,
        timeline_id: PRODUCTION_NEON_TIMELINE_ID,
        db: 'neondb',
        user_name: 'neondb_owner',
      }],
    }),
  };

  try {
    await verifyLiveNeonBranchIdentity(mockProdClient);
    assert(false, 'Refuses execution when connected database reports production neon.branch_id');
  } catch (err) {
    assert(
      err.message.includes('matches the PRODUCTION branch'),
      'Refuses execution when connected database reports production neon.branch_id',
      err.message
    );
  }

  // Test 18: Rejects production timeline ID
  const mockProdTimelineClient = {
    query: async () => ({
      rows: [{
        branch_id: 'br-some-other-branch',
        timeline_id: PRODUCTION_NEON_TIMELINE_ID,
        db: 'neondb',
        user_name: 'neondb_owner',
      }],
    }),
  };

  try {
    await verifyLiveNeonBranchIdentity(mockProdTimelineClient);
    assert(false, 'Refuses execution when connected database reports production neon.timeline_id');
  } catch (err) {
    assert(
      err.message.includes('matches the PRODUCTION timeline'),
      'Refuses execution when connected database reports production neon.timeline_id',
      err.message
    );
  }

  // Test 19: Fail-closed on Missing Database Identity (null/empty branch_id)
  const mockNullBranchClient = {
    query: async () => ({
      rows: [{
        branch_id: null,
        timeline_id: null,
        db: 'neondb_staging',
        user_name: 'staging_user',
      }],
    }),
  };

  try {
    await verifyLiveNeonBranchIdentity(mockNullBranchClient);
    assert(false, 'Refuses execution when staging database branch identity is null/empty (Fail-Closed)');
  } catch (err) {
    assert(
      err.message.includes('branch identity is MISSING') || err.message.includes('fails closed'),
      'Refuses execution when staging database branch identity is null/empty (Fail-Closed)',
      err.message
    );
  }

  // Test 20: Missing EXPECTED_NEON_BRANCH_ID in staging
  const mockStagingClient = {
    query: async () => ({
      rows: [{
        branch_id: 'br-staging-isolated-998877',
        timeline_id: 'timeline-staging-abcdef123456',
        db: 'neondb_staging',
        user_name: 'staging_user',
      }],
    }),
  };

  try {
    await verifyLiveNeonBranchIdentity(mockStagingClient, { isStaging: true, expectedBranchId: '' });
    assert(false, 'Refuses execution when EXPECTED_NEON_BRANCH_ID is empty in staging');
  } catch (err) {
    assert(
      err.message.includes('EXPECTED_NEON_BRANCH_ID is mandatory'),
      'Refuses execution when EXPECTED_NEON_BRANCH_ID is empty in staging',
      err.message
    );
  }

  // Test 21: Expected Branch ID Mismatch
  try {
    await verifyLiveNeonBranchIdentity(mockStagingClient, { expectedBranchId: 'br-different-branch-443322' });
    assert(false, 'Refuses execution when expected database branch ID does not match');
  } catch (err) {
    assert(
      err.message.includes('branch mismatch') && err.message.includes('br-different-branch-443322'),
      'Refuses execution when expected database branch ID does not match',
      err.message
    );
  }

  // Test 22: Accepts matching isolated staging branch ID
  try {
    const stagingIdentity = await verifyLiveNeonBranchIdentity(mockStagingClient, {
      expectedBranchId: 'br-staging-isolated-998877',
    });
    assert(
      stagingIdentity.branchId === 'br-staging-isolated-998877',
      'Accepts verified isolated staging branch identity',
      stagingIdentity.branchId
    );
  } catch (err) {
    assert(false, 'Accepts verified isolated staging branch identity', err.message);
  }

  console.log('\n--- 4. Backend Unguarded Startup Refusal Subprocess Tests ---');

  // Test 23: Backend startup refuses when EXPECTED_STAGING_ENDPOINT missing
  console.log('Testing backend dist/index.js startup refusal when EXPECTED_STAGING_ENDPOINT missing...');
  const childBackendMissingEndpoint = spawnSync('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPECTED_STAGING_ENDPOINT: '', // missing
      EXPECTED_NEON_BRANCH_ID: 'br-staging-12345',
      STAGING_SCHEMA_ONLY: 'true',
      SYNC_HISTORICAL_ENQUIRIES: 'false',
      PORT: '5999',
    },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert(
    childBackendMissingEndpoint.status === 1,
    'Backend terminates with exit code 1 on missing EXPECTED_STAGING_ENDPOINT'
  );
  assert(
    (childBackendMissingEndpoint.stderr && childBackendMissingEndpoint.stderr.includes('FATAL STAGING REFUSAL')) ||
    (childBackendMissingEndpoint.stdout && childBackendMissingEndpoint.stdout.includes('FATAL STAGING REFUSAL')),
    'Backend outputs FATAL STAGING REFUSAL message and halts before binding port'
  );

  // Test 24: Backend startup refuses when EXPECTED_NEON_BRANCH_ID missing
  console.log('Testing backend dist/index.js startup refusal when EXPECTED_NEON_BRANCH_ID missing...');
  const childBackendMissingBranch = spawnSync('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPECTED_STAGING_ENDPOINT: 'ep-staging-clean-554433',
      EXPECTED_NEON_BRANCH_ID: '', // missing
      STAGING_SCHEMA_ONLY: 'true',
      SYNC_HISTORICAL_ENQUIRIES: 'false',
      PORT: '5999',
    },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert(
    childBackendMissingBranch.status === 1,
    'Backend terminates with exit code 1 on missing EXPECTED_NEON_BRANCH_ID'
  );
  assert(
    (childBackendMissingBranch.stderr && childBackendMissingBranch.stderr.includes('EXPECTED_NEON_BRANCH_ID is mandatory')) ||
    (childBackendMissingBranch.stdout && childBackendMissingBranch.stdout.includes('EXPECTED_NEON_BRANCH_ID is mandatory')),
    'Backend outputs EXPECTED_NEON_BRANCH_ID is mandatory error and halts'
  );

  // Test 25: Backend startup refuses when STAGING_SCHEMA_ONLY is not true
  console.log('Testing backend dist/index.js startup refusal when STAGING_SCHEMA_ONLY is not true...');
  const childBackendInvalidSchema = spawnSync('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPECTED_STAGING_ENDPOINT: 'ep-staging-clean-554433',
      EXPECTED_NEON_BRANCH_ID: 'br-staging-12345',
      STAGING_SCHEMA_ONLY: 'false', // invalid
      SYNC_HISTORICAL_ENQUIRIES: 'false',
      PORT: '5999',
    },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert(
    childBackendInvalidSchema.status === 1,
    'Backend terminates with exit code 1 when STAGING_SCHEMA_ONLY is not true'
  );

  // Test 26: Backend startup refuses when SYNC_HISTORICAL_ENQUIRIES is not false
  console.log('Testing backend dist/index.js startup refusal when SYNC_HISTORICAL_ENQUIRIES is not false...');
  const childBackendInvalidSync = spawnSync('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPECTED_STAGING_ENDPOINT: 'ep-staging-clean-554433',
      EXPECTED_NEON_BRANCH_ID: 'br-staging-12345',
      STAGING_SCHEMA_ONLY: 'true',
      SYNC_HISTORICAL_ENQUIRIES: 'true', // invalid
      PORT: '5999',
    },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert(
    childBackendInvalidSync.status === 1,
    'Backend terminates with exit code 1 when SYNC_HISTORICAL_ENQUIRIES is true'
  );

  // Test 27: Backend startup refuses when DATABASE_URL targets production
  console.log('Testing backend dist/index.js startup refusal when DATABASE_URL targets production...');
  const childBackendProdDb = spawnSync('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPECTED_STAGING_ENDPOINT: 'ep-staging-clean-554433',
      EXPECTED_NEON_BRANCH_ID: 'br-staging-12345',
      STAGING_SCHEMA_ONLY: 'true',
      SYNC_HISTORICAL_ENQUIRIES: 'false',
      DATABASE_URL: PROD_URL, // production DB
      PORT: '5998',
    },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert(
    childBackendProdDb.status === 1,
    'Backend terminates with exit code 1 when DATABASE_URL targets production'
  );
  assert(
    (childBackendProdDb.stderr && childBackendProdDb.stderr.includes('targets production Neon endpoint')) ||
    (childBackendProdDb.stdout && childBackendProdDb.stdout.includes('targets production Neon endpoint')),
    'Backend halts before binding port or running migrations against production'
  );

  // Test 28: Backend startup refuses when DATABASE_URL is a non-Neon destination
  console.log('Testing backend dist/index.js startup refusal when DATABASE_URL is non-Neon...');
  const childBackendNonNeon = spawnSync('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPECTED_STAGING_ENDPOINT: 'ep-staging-clean-554433',
      EXPECTED_NEON_BRANCH_ID: 'br-staging-12345',
      STAGING_SCHEMA_ONLY: 'true',
      SYNC_HISTORICAL_ENQUIRIES: 'false',
      DATABASE_URL: 'postgresql://user:pass@mydb.rds.amazonaws.com:5432/neondb?sslmode=require',
      PORT: '5997',
    },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert(
    childBackendNonNeon.status === 1,
    'Backend terminates with exit code 1 when DATABASE_URL is non-Neon'
  );
  assert(
    (childBackendNonNeon.stderr && childBackendNonNeon.stderr.includes('must be hosted on Neon')) ||
    (childBackendNonNeon.stdout && childBackendNonNeon.stdout.includes('must be hosted on Neon')),
    'Backend halts before binding port on non-Neon database destination'
  );

  // Test 29: Backend startup refuses when endpoint mismatches EXPECTED_STAGING_ENDPOINT
  console.log('Testing backend dist/index.js startup refusal when endpoint mismatches expected...');
  const childBackendMismatchEndpoint = spawnSync('node', ['dist/index.js'], {
    cwd: path.join(__dirname, '..', 'backend'),
    env: {
      ...process.env,
      APP_ENV: 'staging',
      EXPECTED_STAGING_ENDPOINT: 'ep-expected-staging-99999',
      EXPECTED_NEON_BRANCH_ID: 'br-staging-12345',
      STAGING_SCHEMA_ONLY: 'true',
      SYNC_HISTORICAL_ENQUIRIES: 'false',
      DATABASE_URL: 'postgresql://user:pass@ep-actual-staging-11111.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
      PORT: '5996',
    },
    encoding: 'utf8',
    timeout: 10000,
  });

  assert(
    childBackendMismatchEndpoint.status === 1,
    'Backend terminates with exit code 1 when endpoint mismatches expected'
  );
  assert(
    (childBackendMismatchEndpoint.stderr && childBackendMismatchEndpoint.stderr.includes('endpoint mismatch')) ||
    (childBackendMismatchEndpoint.stdout && childBackendMismatchEndpoint.stdout.includes('endpoint mismatch')),
    'Backend halts before binding port on endpoint mismatch'
  );

  console.log('\n--- 5. Read-Only Audit & Acceptance Scripts Subprocess Tests ---');

  // Test 30: audit-staging-db.js terminates when TEST_DATABASE_URL is absent
  const childAuditMissing = spawnSync('node', ['scripts/audit-staging-db.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, TEST_DATABASE_URL: '' },
    encoding: 'utf8',
  });
  assert(childAuditMissing.status === 1, 'audit-staging-db.js terminates with exit code 1 when TEST_DATABASE_URL is absent');

  // Test 31: audit-staging-db.js terminates when given production DATABASE_URL
  const childAuditProd = spawnSync('node', ['scripts/audit-staging-db.js', '--url', PROD_URL], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  });
  assert(childAuditProd.status === 1, 'audit-staging-db.js terminates with exit code 1 when given production DATABASE_URL');
  assert(
    childAuditProd.stderr.includes('targets production Neon endpoint') || childAuditProd.stdout.includes('targets production Neon endpoint'),
    'audit-staging-db.js prints safety refusal and halts against production URL'
  );

  // Test 32: audit-staging-db.js terminates when given non-Neon URL
  const childAuditNonNeon = spawnSync('node', ['scripts/audit-staging-db.js', '--url', 'postgresql://user:pass@mydb.rds.amazonaws.com:5432/neondb?sslmode=require'], {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
  });
  assert(childAuditNonNeon.status === 1, 'audit-staging-db.js terminates with exit code 1 when given non-Neon URL');

  // Test 33: Subprocess refusal: verify-staging-integration-acceptance.js with missing TEST_DATABASE_URL
  console.log('Testing verify-staging-integration-acceptance.js subprocess invocation with missing TEST_DATABASE_URL...');
  const childMissing = spawnSync('node', ['scripts/verify-staging-integration-acceptance.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      TEST_DATABASE_URL: '', // deliberately empty
    },
    encoding: 'utf8',
  });

  assert(childMissing.status !== 0, 'verify-staging-integration-acceptance.js terminates with non-zero exit code when TEST_DATABASE_URL is absent');
  assert(
    childMissing.stdout.includes('FATAL SAFETY GUARD') || childMissing.stderr.includes('FATAL SAFETY GUARD'),
    'verify-staging-integration-acceptance.js prints FATAL SAFETY GUARD message and halts when URL missing'
  );

  // Test 34: Subprocess refusal: verify-staging-integration-acceptance.js with production DATABASE_URL
  console.log('Testing verify-staging-integration-acceptance.js subprocess invocation with production DATABASE_URL...');
  const childProd = spawnSync('node', ['scripts/verify-staging-integration-acceptance.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      TEST_DATABASE_URL: PROD_URL, // deliberately passing production URL
    },
    encoding: 'utf8',
  });

  assert(childProd.status !== 0, 'verify-staging-integration-acceptance.js terminates with non-zero exit code when production URL is configured');
  assert(
    childProd.stdout.includes('FATAL SAFETY GUARD') || childProd.stderr.includes('FATAL SAFETY GUARD'),
    'verify-staging-integration-acceptance.js prints FATAL SAFETY GUARD message and halts against production URL'
  );

  console.log('\n------------------------------------------------------------------------');
  console.log(`SAFETY GUARD VERIFICATION SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log('------------------------------------------------------------------------\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runProof().catch((err) => {
  console.error('Safety proof runner failed:', err);
  process.exit(1);
});
