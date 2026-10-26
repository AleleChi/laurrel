const path = require('path');
const { spawnSync } = require('child_process');
const {
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
  console.log('LAURREL SERVICES — FAIL-CLOSED DATABASE ISOLATION SAFETY GUARD PROOF');
  console.log('========================================================================\n');

  // 1. Missing TEST_DATABASE_URL
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

  // 2. Empty TEST_DATABASE_URL
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

  // 3. Exact match with production DATABASE_URL
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

  // 4. Same production endpoint with altered credentials/params
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

  // 5. Direct (non-pooler) production endpoint
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

  // 6. Insecure TLS (sslmode=disable)
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

  // 7. Legitimate, isolated Neon staging branch endpoint passes URL assertion
  const validStagingUrl = 'postgresql://staging_user:pass@ep-staging-clean-554433-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
  try {
    const result = assertStagingDatabaseIsolation(validStagingUrl, PROD_URL);
    assert(result.valid === true, 'Accepts genuinely isolated staging Neon branch endpoint');
    assert(result.testEndpoint === 'ep-staging-clean-554433-pooler', 'Correctly parses staging endpoint ID');
  } catch (err) {
    assert(false, 'Accepts genuinely isolated staging Neon branch endpoint', err.message);
  }

  // 8. Expected Endpoint Mismatch Test (Fail-Closed)
  try {
    assertStagingDatabaseIsolation(
      'postgresql://staging_user:pass@ep-actual-12345-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require',
      PROD_URL,
      { expectedEndpoint: 'ep-expected-99999' }
    );
    assert(false, 'Refuses execution when expected staging endpoint does not match');
  } catch (err) {
    assert(
      err.message.includes('endpoint mismatch') && err.message.includes('ep-expected-99999'),
      'Refuses execution when expected staging endpoint does not match',
      err.message
    );
  }

  // 9. Expected Endpoint Match Test
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

  // 10. Live Neon Branch Identity Guard: Rejects production branch ID even if accessed via custom/spoofed host
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

  // 11. Fail-closed on Missing Database Identity (null/empty branch_id)
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

  // 12. Live Neon Branch Identity Guard: Accepts isolated staging branch ID
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
    const stagingIdentity = await verifyLiveNeonBranchIdentity(mockStagingClient);
    assert(
      stagingIdentity.branchId === 'br-staging-isolated-998877',
      'Accepts verified isolated staging branch identity',
      stagingIdentity.branchId
    );
  } catch (err) {
    assert(false, 'Accepts verified isolated staging branch identity', err.message);
  }

  // 13. Expected Branch ID Mismatch Test
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

  // 14. Subprocess negative test: invoke verify-staging-integration-acceptance.js with missing TEST_DATABASE_URL
  console.log('\nTesting verify-staging-integration-acceptance.js subprocess invocation with missing TEST_DATABASE_URL...');
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

  // 15. Subprocess negative test: invoke verify-staging-integration-acceptance.js with production DATABASE_URL
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
