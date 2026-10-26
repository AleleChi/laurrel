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
 * Throws an explicit Error with fatal safety message if validation fails.
 */
function assertStagingDatabaseIsolation(testDbUrl, prodDbUrl) {
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

  return {
    valid: true,
    testEndpoint,
    host: parsedTest.host,
    database: parsedTest.pathname,
  };
}

/**
 * Validates internal Neon branch identity via system settings.
 * Refuses execution if the connected database reports the production branch_id or timeline_id,
 * proving that changing the hostname or using a proxy cannot bypass database isolation.
 */
async function verifyLiveNeonBranchIdentity(clientOrPool, knownProductionBranchId = PRODUCTION_NEON_BRANCH_ID) {
  try {
    const res = await clientOrPool.query(
      "SELECT current_setting('neon.branch_id', true) as branch_id, current_setting('neon.timeline_id', true) as timeline_id, current_database() as db, current_user as user_name;"
    );
    const row = res.rows[0] || {};
    const branchId = row.branch_id;
    const timelineId = row.timeline_id;

    if (branchId && branchId === knownProductionBranchId) {
      throw new Error(
        `FATAL SAFETY GUARD: The connected database reports neon.branch_id = '${branchId}', which matches the PRODUCTION branch! ` +
        'Execution aborted immediately before any write or schema alteration.'
      );
    }

    if (timelineId && timelineId === PRODUCTION_NEON_TIMELINE_ID) {
      throw new Error(
        `FATAL SAFETY GUARD: The connected database reports neon.timeline_id = '${timelineId}', which matches the PRODUCTION timeline! ` +
        'Execution aborted immediately.'
      );
    }

    return {
      branchId: branchId || 'custom-staging-or-local',
      timelineId: timelineId || null,
      database: row.db,
      user: row.user_name,
    };
  } catch (err) {
    if (err.message.includes('FATAL SAFETY GUARD')) {
      throw err;
    }
    // If the setting doesn't exist (e.g. standard local Postgres without neon extension), log warning
    return {
      branchId: 'standard-postgresql',
      timelineId: null,
      database: 'unknown',
      user: 'unknown',
    };
  }
}

module.exports = {
  assertStagingDatabaseIsolation,
  verifyLiveNeonBranchIdentity,
  PRODUCTION_NEON_ENDPOINTS,
  PRODUCTION_NEON_BRANCH_ID,
  PRODUCTION_NEON_TIMELINE_ID,
};
