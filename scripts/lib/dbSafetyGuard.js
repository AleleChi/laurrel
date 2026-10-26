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
      protocol: u.protocol.toLowerCase(),
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
 * Validates mandatory environment variables for the dedicated staging service.
 */
function assertStagingEnvironmentConfig(options = {}) {
  const isStaging = options.isStaging ?? (
    process.env.APP_ENV === 'staging' ||
    process.env.STAGING_MODE === 'true' ||
    process.env.STAGING_SCHEMA_ONLY === 'true' ||
    Boolean(process.env.RENDER_SERVICE_NAME && process.env.RENDER_SERVICE_NAME.includes('staging')) ||
    Boolean(process.env.PUBLIC_SITE_URL && process.env.PUBLIC_SITE_URL.includes('deploy-preview'))
  );

  if (!isStaging) {
    return {
      appEnv: process.env.APP_ENV || '',
      expectedEndpoint: '',
      expectedBranchId: '',
      stagingSchemaOnly: false,
      syncHistoricalEnquiries: true,
    };
  }

  const errors = [];

  const appEnv = (options.appEnv ?? process.env.APP_ENV ?? '').trim();
  if (appEnv !== 'staging') {
    errors.push(`APP_ENV must be explicitly set to 'staging' (received: '${appEnv || 'undefined'}')`);
  }

  const expectedEndpoint = (options.expectedEndpoint ?? process.env.EXPECTED_STAGING_ENDPOINT ?? '').trim().toLowerCase();
  if (!expectedEndpoint) {
    errors.push('EXPECTED_STAGING_ENDPOINT is mandatory in staging and must not be empty');
  }

  const expectedBranchId = (options.expectedBranchId ?? process.env.EXPECTED_NEON_BRANCH_ID ?? '').trim();
  if (!expectedBranchId) {
    errors.push('EXPECTED_NEON_BRANCH_ID is mandatory in staging and must not be empty');
  }

  const stagingSchemaOnly = (options.stagingSchemaOnly ?? process.env.STAGING_SCHEMA_ONLY ?? '').trim().toLowerCase();
  if (stagingSchemaOnly !== 'true') {
    errors.push(`STAGING_SCHEMA_ONLY must be strictly 'true' (received: '${stagingSchemaOnly || 'undefined'}')`);
  }

  const syncHistorical = (options.syncHistoricalEnquiries ?? process.env.SYNC_HISTORICAL_ENQUIRIES ?? '').trim().toLowerCase();
  if (syncHistorical !== 'false') {
    errors.push(`SYNC_HISTORICAL_ENQUIRIES must be strictly 'false' (received: '${syncHistorical || 'undefined'}')`);
  }

  if (errors.length > 0) {
    throw new Error(
      `FATAL SAFETY GUARD: Staging configuration incomplete or invalid. ` +
      `Staging mandates [APP_ENV=staging, EXPECTED_STAGING_ENDPOINT, EXPECTED_NEON_BRANCH_ID, STAGING_SCHEMA_ONLY=true, SYNC_HISTORICAL_ENQUIRIES=false]. Refusal reasons:\n - ${errors.join('\n - ')}`
    );
  }

  return {
    appEnv,
    expectedEndpoint,
    expectedBranchId,
    stagingSchemaOnly: true,
    syncHistoricalEnquiries: false,
  };
}

/**
 * Validates connection string parameters before establishing any database connection.
 * Throws a fatal Error if:
 * 1. Connection string is missing.
 * 2. It points to a non-Neon destination.
 * 3. It points to the production Neon endpoint.
 * 4. It fails exact expected endpoint validation (rejects substring-spoofed hostnames).
 * 5. Connection uses insecure TLS settings.
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

  if (parsedTest.protocol !== 'postgres:' && parsedTest.protocol !== 'postgresql:') {
    throw new Error(`FATAL SAFETY GUARD: Invalid database protocol '${parsedTest.protocol}'. Expected postgres: or postgresql:.`);
  }

  // Check 1: Non-Neon Destination Check
  const hostname = parsedTest.hostname;
  const isNeonHost = hostname.endsWith('.neon.tech') || hostname === 'neon.tech';
  if (!isNeonHost) {
    throw new Error(
      `FATAL SAFETY GUARD: Staging database destination must be hosted on Neon (*.neon.tech). Non-Neon host rejected: ${hostname}`
    );
  }

  const endpointSegment = extractEndpointId(hostname);
  const baseEndpointId = endpointSegment.replace(/-pooler$/, '');

  // Check 2: Test endpoint matches known production Neon endpoint identifiers
  for (const prodEndpoint of PRODUCTION_NEON_ENDPOINTS) {
    const prodBase = prodEndpoint.replace(/-pooler$/, '');
    if (endpointSegment === prodEndpoint || baseEndpointId === prodBase) {
      throw new Error(
        `FATAL SAFETY GUARD: TEST_DATABASE_URL targets production Neon endpoint (${prodEndpoint}). ` +
        'Execution halted immediately. Mutation against production is strictly prohibited.'
      );
    }
  }

  // Check 3: Direct match against configured production DATABASE_URL
  if (prodDbUrl) {
    const parsedProd = normalizeUrl(prodDbUrl);
    if (parsedProd) {
      const prodEndpoint = extractEndpointId(parsedProd.hostname);
      const prodBase = prodEndpoint.replace(/-pooler$/, '');
      if (baseEndpointId === prodBase || endpointSegment === prodEndpoint) {
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

  // Check 4: Strict TLS requirement (no insecure disable)
  if (testDbUrl.includes('sslmode=disable') || testDbUrl.includes('sslmode=allow')) {
    throw new Error('FATAL SAFETY GUARD: Staging database connection must use TLS (sslmode=require or verify-full).');
  }

  // Check 5: Exact Expected Endpoint Match (Fail-Closed)
  const isStaging = options.isStaging ?? false;
  const expectedEndpoint = (options.expectedEndpoint || process.env.EXPECTED_STAGING_ENDPOINT || '').trim().toLowerCase();

  if (isStaging && !expectedEndpoint) {
    throw new Error('FATAL SAFETY GUARD: EXPECTED_STAGING_ENDPOINT is mandatory for staging database isolation verification.');
  }

  if (expectedEndpoint) {
    const expectedBase = expectedEndpoint.split('.')[0].replace(/-pooler$/, '');
    // Exact endpoint ID check (No permissive substring match!)
    if (baseEndpointId !== expectedBase) {
      throw new Error(
        `FATAL SAFETY GUARD: Staging database endpoint mismatch. ` +
        `Expected endpoint [${expectedEndpoint}], but connection resolved to [${endpointSegment || hostname}].`
      );
    }

    // If expected endpoint specifies a full hostname, verify full domain match
    if (expectedEndpoint.includes('.')) {
      const expectedDomain = expectedEndpoint.split('.').slice(1).join('.');
      const actualDomain = hostname.split('.').slice(1).join('.');
      if (actualDomain !== expectedDomain) {
        throw new Error(
          `FATAL SAFETY GUARD: Staging database domain mismatch. ` +
          `Expected domain [${expectedDomain}], but connection resolved to [${actualDomain}].`
        );
      }
    }
  }

  return {
    valid: true,
    testEndpoint: endpointSegment,
    baseEndpointId,
    host: parsedTest.host,
    hostname,
    database: parsedTest.pathname,
  };
}

/**
 * Validates internal Neon branch identity via system settings.
 * Fails closed if:
 * 1. The database reports the production branch_id or timeline_id.
 * 2. The database identity is missing (null/empty).
 * 3. In staging, EXPECTED_NEON_BRANCH_ID is missing or does not exactly match the database branch_id.
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
  if (!branchId) {
    throw new Error(
      'FATAL SAFETY GUARD: Staging database branch identity is MISSING (neon.branch_id returned null/empty). ' +
      'Staging fails closed when database identity cannot be verified.'
    );
  }

  // Check 4: Exact Expected Branch ID verification
  const isStaging = options.isStaging ?? false;
  const expectedBranchId = (options.expectedBranchId || process.env.EXPECTED_NEON_BRANCH_ID || '').trim();

  if (isStaging && !expectedBranchId) {
    throw new Error('FATAL SAFETY GUARD: EXPECTED_NEON_BRANCH_ID is mandatory for staging database isolation verification.');
  }

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
  assertStagingEnvironmentConfig,
  assertStagingDatabaseIsolation,
  verifyLiveNeonBranchIdentity,
  PRODUCTION_NEON_ENDPOINTS,
  PRODUCTION_NEON_BRANCH_ID,
  PRODUCTION_NEON_TIMELINE_ID,
};
