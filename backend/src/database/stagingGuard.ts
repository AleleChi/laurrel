import { URL } from 'url';

export const PRODUCTION_NEON_ENDPOINTS = [
  'ep-raspy-dew-b4agbivi',
  'ep-raspy-dew-b4agbivi-pooler',
];

export const PRODUCTION_NEON_BRANCH_ID = 'br-bitter-shape-b41zw3xj';
export const PRODUCTION_NEON_TIMELINE_ID = 'cd34760fe0c1cd5a2b30fa0f3403f9e4';

export interface StagingGuardOptions {
  expectedEndpoint?: string;
  expectedBranchId?: string;
  isStaging?: boolean;
  appEnv?: string;
  stagingSchemaOnly?: string;
  syncHistoricalEnquiries?: string;
}

/**
 * Determines whether the current process is running as the dedicated staging service.
 */
export function isStagingEnvironment(): boolean {
  return (
    process.env.APP_ENV === 'staging' ||
    process.env.STAGING_MODE === 'true' ||
    process.env.STAGING_SCHEMA_ONLY === 'true' ||
    Boolean(process.env.RENDER_SERVICE_NAME && process.env.RENDER_SERVICE_NAME.includes('staging')) ||
    Boolean(process.env.PUBLIC_SITE_URL && process.env.PUBLIC_SITE_URL.includes('deploy-preview'))
  );
}

/**
 * Validates mandatory environment variables for the dedicated staging service.
 * Refuses startup (fails closed) if any required setting is missing or incorrect:
 * - APP_ENV=staging
 * - EXPECTED_STAGING_ENDPOINT (non-empty)
 * - EXPECTED_NEON_BRANCH_ID (non-empty)
 * - STAGING_SCHEMA_ONLY=true
 * - SYNC_HISTORICAL_ENQUIRIES=false
 */
export function assertStagingEnvironmentConfig(options: StagingGuardOptions = {}): {
  appEnv: string;
  expectedEndpoint: string;
  expectedBranchId: string;
  stagingSchemaOnly: boolean;
  syncHistoricalEnquiries: boolean;
} {
  const isStaging = options.isStaging ?? isStagingEnvironment();
  if (!isStaging) {
    return {
      appEnv: process.env.APP_ENV || '',
      expectedEndpoint: '',
      expectedBranchId: '',
      stagingSchemaOnly: false,
      syncHistoricalEnquiries: true,
    };
  }

  const errors: string[] = [];

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
 * 2. It points to a non-Neon destination (*.neon.tech is required).
 * 3. It points to the production Neon endpoint (ep-raspy-dew-b4agbivi).
 * 4. It fails exact expected endpoint validation (rejects substring-spoofed hostnames).
 * 5. Connection uses insecure TLS settings.
 */
export function assertStagingConnectionUrl(
  connectionString: string | undefined,
  options: StagingGuardOptions = {}
): { host: string; hostname: string; endpointId: string; baseEndpointId: string } {
  if (!connectionString || !connectionString.trim()) {
    throw new Error(
      'FATAL SAFETY GUARD: DATABASE_URL is not set. Staging backend refuses to run without an explicit connection string.'
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString.trim());
  } catch (err: any) {
    throw new Error(`FATAL SAFETY GUARD: DATABASE_URL is not a valid URL: ${err.message}`);
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'postgres:' && protocol !== 'postgresql:') {
    throw new Error(`FATAL SAFETY GUARD: Invalid database protocol '${protocol}'. Expected postgres: or postgresql:.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check 1: Non-Neon Destination Check
  // Neon staging database must be hosted on *.neon.tech
  const isNeonHost = hostname.endsWith('.neon.tech') || hostname === 'neon.tech';
  if (!isNeonHost) {
    throw new Error(
      `FATAL SAFETY GUARD: Staging database destination must be hosted on Neon (*.neon.tech). Non-Neon host rejected: ${hostname}`
    );
  }

  const endpointSegment = hostname.split('.')[0] || '';
  const baseEndpointId = endpointSegment.replace(/-pooler$/, '');

  // Check 2: Production Endpoint Blacklist — Strictly reject any connection targeting production Neon endpoint
  for (const prodEndpoint of PRODUCTION_NEON_ENDPOINTS) {
    const prodBase = prodEndpoint.replace(/-pooler$/, '');
    if (endpointSegment === prodEndpoint || baseEndpointId === prodBase) {
      throw new Error(
        `FATAL SAFETY GUARD: DATABASE_URL targets production Neon endpoint (${prodEndpoint}). ` +
        'Staging execution halted immediately to protect production data.'
      );
    }
  }

  // Check 3: TLS Requirement
  if (connectionString.includes('sslmode=disable') || connectionString.includes('sslmode=allow')) {
    throw new Error('FATAL SAFETY GUARD: Staging database connection must use TLS (sslmode=require).');
  }

  // Check 4: Exact Expected Endpoint Validation (Mandatory in Staging)
  const isStaging = options.isStaging ?? isStagingEnvironment();
  const expectedEndpoint = (options.expectedEndpoint || process.env.EXPECTED_STAGING_ENDPOINT || '').trim().toLowerCase();

  if (isStaging && !expectedEndpoint) {
    throw new Error(
      'FATAL SAFETY GUARD: EXPECTED_STAGING_ENDPOINT is mandatory for staging database isolation verification.'
    );
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
    host: parsed.host,
    hostname,
    endpointId: endpointSegment,
    baseEndpointId,
  };
}

/**
 * Validates internal Neon branch identity via system settings.
 * Fails closed if:
 * 1. The database reports the production branch_id or timeline_id.
 * 2. The database identity is missing (null/empty).
 * 3. In staging, EXPECTED_NEON_BRANCH_ID is missing or does not exactly match the database branch_id.
 */
export async function verifyLiveDatabaseIdentity(
  clientOrPool: { query: (sql: string, params?: any[]) => Promise<any> },
  options: StagingGuardOptions = {}
): Promise<{ branchId: string; timelineId: string | null; database: string }> {
  let res: any;
  try {
    res = await clientOrPool.query(
      "SELECT current_setting('neon.branch_id', true) as branch_id, " +
      "current_setting('neon.timeline_id', true) as timeline_id, " +
      "current_database() as db_name, " +
      "current_user as user_name;"
    );
  } catch (err: any) {
    throw new Error(
      `FATAL SAFETY GUARD: Failed to query database system settings for identity verification: ${err.message}`
    );
  }

  const row = res.rows?.[0] || {};
  const branchId = row.branch_id ? String(row.branch_id).trim() : '';
  const timelineId = row.timeline_id ? String(row.timeline_id).trim() : null;
  const dbName = row.db_name || 'unknown';

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
      'Staging fails closed when Neon database identity cannot be proven.'
    );
  }

  // Check 4: Exact Expected Branch ID verification (MANDATORY IN STAGING)
  const isStaging = options.isStaging ?? isStagingEnvironment();
  const expectedBranchId = (options.expectedBranchId || process.env.EXPECTED_NEON_BRANCH_ID || '').trim();

  if (isStaging && !expectedBranchId) {
    throw new Error(
      'FATAL SAFETY GUARD: EXPECTED_NEON_BRANCH_ID is mandatory for staging database isolation verification.'
    );
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
    database: dbName,
  };
}
