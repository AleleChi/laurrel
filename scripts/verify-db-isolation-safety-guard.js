const path = require('path');
const { spawnSync } = require('child_process');
const { assertStagingDatabaseIsolation, PRODUCTION_NEON_ENDPOINTS } = require('./lib/dbSafetyGuard');

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

console.log('========================================================================');
console.log('LAURREL SERVICES — DATABASE ISOLATION SAFETY GUARD PROOF');
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

// 7. Legitimate, isolated Neon staging branch endpoint passes
const validStagingUrl = 'postgresql://staging_user:pass@ep-staging-clean-554433-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';
try {
  const result = assertStagingDatabaseIsolation(validStagingUrl, PROD_URL);
  assert(result.valid === true, 'Accepts genuinely isolated staging Neon branch endpoint');
  assert(result.testEndpoint === 'ep-staging-clean-554433-pooler', 'Correctly parses staging endpoint ID');
} catch (err) {
  assert(false, 'Accepts genuinely isolated staging Neon branch endpoint', err.message);
}

// 8. Negative Integration Test: Invoke verify-staging-integration-acceptance.js directly without TEST_DATABASE_URL
console.log('\nTesting verify-staging-integration-acceptance.js subprocess invocation with missing TEST_DATABASE_URL...');
const child = spawnSync('node', ['scripts/verify-staging-integration-acceptance.js'], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    TEST_DATABASE_URL: '', // deliberately empty
  },
  encoding: 'utf8',
});

assert(child.status !== 0, 'verify-staging-integration-acceptance.js terminates with non-zero exit code when TEST_DATABASE_URL is absent');
assert(
  child.stdout.includes('FATAL SAFETY GUARD') || child.stderr.includes('FATAL SAFETY GUARD'),
  'verify-staging-integration-acceptance.js prints FATAL SAFETY GUARD message and halts'
);

console.log('\n------------------------------------------------------------------------');
console.log(`SAFETY GUARD VERIFICATION SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('------------------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
