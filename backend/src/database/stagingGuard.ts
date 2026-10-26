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
}

export function isStagingEnvironment(): boolean {
  return (
    process.env.APP_ENV === 'staging' ||
    process.env.STAGING_MODE === 'true' ||
    process.env.STAGING_SCHEMA_ONLY === 'true' ||
    Boolean(process.env.PUBLIC_SITE_URL && process.env.PUBLIC_SITE_URL.includes('deploy-preview')) ||
    Boolean(process.env.RENDER_SERVICE_NAME && process.env.RENDER_SERVICE_NAME.includes('staging'))
  );
}

/**
 * Validates connection string parameters before establishing any database connection.
 * Throws a fatal Error if:
 * 1. Connection string is missing.
 * 2. It points to the production Neon endpoint.
 * 3. It does not match the expected staging endpoint (when configured).
 */
export function assertStagingConnectionUrl(
  connectionString: string | undefined,
  options: StagingGuardOptions = {}
): { host: string; endpointId: string } {
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

  const hostname = parsed.hostname.toLowerCase();
  const endpointId = hostname.split('.')[0] || '';

  // Check 1: Production Endpoint Blacklist — Strictly reject any connection matching production Neon endpoint
  for (const prodEndpoint of PRODUCTION_NEON_ENDPOINTS) {
    if (hostname.includes(prodEndpoint) || endpointId === prodEndpoint) {
      throw new Error(
        `FATAL SAFETY GUARD: DATABASE_URL targets production Neon endpoint (${prodEndpoint}). ` +
        'Staging execution halted immediately to protect production data.'
      );
    }
  }

  // Check 2: Expected Endpoint Match (Fail-Closed)
  const expectedEndpoint = (options.expectedEndpoint || process.env.EXPECTED_STAGING_ENDPOINT || '').trim().toLowerCase();
  if (expectedEndpoint) {
    if (!hostname.includes(expectedEndpoint) && endpointId !== expectedEndpoint) {
      throw new Error(
        `FATAL SAFETY GUARD: Staging database endpoint mismatch. ` +
        `Expected endpoint [${expectedEndpoint}], but connection string resolved to [${endpointId || hostname}].`
      );
    }
  }

  return { host: parsed.host, endpointId };
}

/**
 * Validates internal Neon branch identity via system settings.
 * Fails closed if:
 * 1. The database reports the production branch_id or timeline_id.
 * 2. The database identity is missing (null/empty) in a Neon environment.
 * 3. The branch_id does not match the expected staging branch (when configured).
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

  // Check 3: FAIL-CLOSED on missing Neon branch identity in Neon environments
  const dbUrl = process.env.DATABASE_URL || '';
  const isNeonHost = dbUrl.includes('neon.tech');
  if (isNeonHost && !branchId) {
    throw new Error(
      'FATAL SAFETY GUARD: Staging database branch identity is MISSING (neon.branch_id returned null/empty). ' +
      'Staging fails closed when Neon database identity cannot be proven.'
    );
  }

  // Check 4: Expected Branch ID verification (if configured)
  const expectedBranchId = (options.expectedBranchId || process.env.EXPECTED_NEON_BRANCH_ID || '').trim();
  if (expectedBranchId && branchId !== expectedBranchId) {
    throw new Error(
      `FATAL SAFETY GUARD: Staging database branch mismatch. ` +
      `Expected branch [${expectedBranchId}], but database reports [${branchId || 'none'}].`
    );
  }

  return {
    branchId: branchId || 'verified-non-neon-staging',
    timelineId,
    database: dbName,
  };
}
