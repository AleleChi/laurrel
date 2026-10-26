const { URL } = require('url');

const PRODUCTION_NEON_ENDPOINTS = [
  'ep-raspy-dew-b4agbivi',
  'ep-raspy-dew-b4agbivi-pooler',
];

const PRODUCTION_NEON_BRANCH_ID = 'br-bitter-shape-b41zw3xj';
const PRODUCTION_NEON_TIMELINE_ID = 'cd34760fe0c1cd5a2b30fa0f3403f9e4';

function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  try {
    const u = new URL(rawUrl.trim());
    return {
      host: u.host.toLowerCase(),
      hostname: u.hostname.toLowerCase(),
      pathname: u.pathname.toLowerCase(),
      port: u.port || '5432',
      search: u.search,
    };
  } catch {
    return null;
  }
}

function extractEndpointId(hostname) {
  if (!hostname) return '';
  const parts = hostname.split('.');
  return parts[0] || '';
}

/**
 * Validates connection string parameters before establishing any database connection.
 * Throws a fatal Error if:
 * 1. Connection string is missing.
 * 2. It points to the production Neon endpoint.
 * 3. It does not match the expected staging endpoint (when configured).
 */
function assertStagingDatabaseIsolation(testDbUrl, prodDbUrl, options = {}) {
  if (!testDbUrl || typeof testDbUrl !== 'string' || !testDbUrl.trim()) {
    throw new Error(
      'FATAL SAFETY GUARD: TEST_DATABASE_URL environment variable is missing. ' +
      'Write-based staging integration tests refuse to run without an explicit staging database connection string.'
    );
  }

  const parsedTest = normalizeUrl(testDbUrl);
  if (!parsedTest) {
    throw new Error('FATAL SAFETY GUARD: TEST_DATABASE_URL is not a valid PostgreSQL connection URL.');
  }

  const testEndpoint = extractEndpointId(parsedTest.hostname);

  // Check 1: Test endpoint matches known production Neon endpoint identifiers
  for (const prodEndpoint of PRODUCTION_NEON_ENDPOINTS) {
    if (parsedTest.hostname.includes(prodEndpoint) || testEndpoint === prodEndpoint) {
      throw new Error(
        `FATAL SAFETY GUARD: TEST_DATABASE_URL targets production Neon endpoint (${prodEndpoint}). ` +
        'Execution halted immediately. Mutation against production is strictly prohibited.'
      );
    }
  }

  // Check 2: Direct match against configured production DATABASE_URL
  if (prodDbUrl) {
    const parsedProd = normalizeUrl(prodDbUrl);
    if (parsedProd) {
      const prodEndpoint = extractEndpointId(parsedProd.hostname);
      if (testEndpoint && prodEndpoint && testEndpoint === prodEndpoint) {
        throw new Error(
          `FATAL SAFETY GUARD: TEST_DATABASE_URL resolves to the same Neon endpoint as production (${prodEndpoint}). ` +
          'Execution halted immediately.'
        );
      }
      if (parsedTest.host === parsedProd.host && parsedTest.pathname === parsedProd.pathname) {
        throw new Error(
          'FATAL SAFETY GUARD: TEST_DATABASE_URL is identical to production DATABASE_URL. Execution halted immediately.'
        );
      }
    }
  }

  // Check 3: Check for strict TLS requirement (no insecure disable)
  if (testDbUrl.includes('sslmode=disable') || testDbUrl.includes('sslmode=allow')) {
    throw new Error('FATAL SAFETY GUARD: Staging database connection must use TLS (sslmode=require or verify-full).');
  }

  // Check 4: Expected Endpoint Match (Fail-Closed when expected endpoint is configured)
  const expectedEndpoint = (options.expectedEndpoint || process.env.EXPECTED_STAGING_ENDPOINT || '').trim().toLowerCase();
  if (expectedEndpoint) {
    if (!parsedTest.hostname.includes(expectedEndpoint) && testEndpoint !== expectedEndpoint) {
      throw new Error(
        `FATAL SAFETY GUARD: Staging database endpoint mismatch. ` +
        `Expected endpoint [${expectedEndpoint}], but connection string resolved to [${testEndpoint || parsedTest.hostname}].`
      );
    }
  }

  return {
    valid: true,
    testEndpoint,
    host: parsedTest.host,
    database: parsedTest.pathname,
  };
}

/**
 * Validates internal Neon branch identity via system settings.
 * Fails closed if:
 * 1. The database reports the production branch_id or timeline_id.
 * 2. The database identity is missing (null/empty) in a Neon environment.
 * 3. The branch_id does not match the expected staging branch (when configured).
 */
async function verifyLiveNeonBranchIdentity(clientOrPool, options = {}) {
  let res;
  try {
    res = await clientOrPool.query(
      "SELECT current_setting('neon.branch_id', true) as branch_id, " +
      "current_setting('neon.timeline_id', true) as timeline_id, " +
      "current_database() as db, " +
      "current_user as user_name;"
    );
  } catch (err) {
    throw new Error(
      `FATAL SAFETY GUARD: Failed to query database system settings for identity verification: ${err.message}`
    );
  }

  const row = res.rows[0] || {};
  const branchId = row.branch_id ? String(row.branch_id).trim() : '';
  const timelineId = row.timeline_id ? String(row.timeline_id).trim() : null;

  // Check 1: Reject Production Branch ID
  if (branchId && branchId === PRODUCTION_NEON_BRANCH_ID) {
    throw new Error(
      `FATAL SAFETY GUARD: The connected database reports neon.branch_id = '${branchId}', which matches the PRODUCTION branch! ` +
      'Staging execution aborted immediately before any write or schema alteration.'
    );
  }

  // Check 2: Reject Production Timeline ID
  if (timelineId && timelineId === PRODUCTION_NEON_TIMELINE_ID) {
    throw new Error(
      `FATAL SAFETY GUARD: The connected database reports neon.timeline_id = '${timelineId}', which matches the PRODUCTION timeline! ` +
      'Staging execution aborted immediately.'
    );
  }

  // Check 3: FAIL-CLOSED on missing Neon branch identity
  // If branch identity cannot be proven, refuse execution
  if (!branchId) {
    throw new Error(
      'FATAL SAFETY GUARD: Staging database branch identity is MISSING (neon.branch_id returned null/empty). ' +
      'Staging fails closed when database identity cannot be verified.'
    );
  }

  // Check 4: Expected Branch ID verification (if configured)
  const expectedBranchId = (options.expectedBranchId || process.env.EXPECTED_NEON_BRANCH_ID || '').trim();
  if (expectedBranchId && branchId !== expectedBranchId) {
    throw new Error(
      `FATAL SAFETY GUARD: Staging database branch mismatch. ` +
      `Expected branch [${expectedBranchId}], but database reports [${branchId}].`
    );
  }

  return {
    branchId,
    timelineId,
    database: row.db,
    user: row.user_name,
  };
}

module.exports = {
  assertStagingDatabaseIsolation,
  verifyLiveNeonBranchIdentity,
  PRODUCTION_NEON_ENDPOINTS,
  PRODUCTION_NEON_BRANCH_ID,
  PRODUCTION_NEON_TIMELINE_ID,
};
