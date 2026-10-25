const { URL } = require('url');

const PRODUCTION_NEON_ENDPOINTS = [
  'ep-raspy-dew-b4agbivi',
  'ep-raspy-dew-b4agbivi-pooler',
];

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
 * Validates that testDbUrl is an isolated, verified staging database.
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

module.exports = {
  assertStagingDatabaseIsolation,
  PRODUCTION_NEON_ENDPOINTS,
};
