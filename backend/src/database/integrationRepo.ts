import { getDbPool } from './pool';
import { encryptSecure, decryptSecure } from '../services/security/crypto';

export type ProviderType = 'google_meet' | 'ms_teams' | 'zoom';
export type ProviderStatus = 'connected' | 'disconnected' | 'error';

export interface OAuthCredentials {
  refreshToken: string;
  accessToken?: string;
  tokenExpiry?: number;
  scope?: string;
  tokenType?: string;
}

export interface ProviderIntegration {
  id: string;
  providerName: ProviderType;
  status: ProviderStatus;
  accountEmail: string | null;
  credentials?: OAuthCredentials | null;
  syncCalendarConflicts: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getProviderIntegration(providerName: ProviderType): Promise<ProviderIntegration | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const query = `
    SELECT
      id,
      provider_name AS "providerName",
      status,
      account_email AS "accountEmail",
      encrypted_credentials AS "encryptedCredentials",
      sync_calendar_conflicts AS "syncCalendarConflicts",
      last_synced_at AS "lastSyncedAt",
      last_error AS "lastError",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM provider_integrations
    WHERE provider_name = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [providerName]);
  if (rows.length === 0) return null;

  const row = rows[0];
  let credentials: OAuthCredentials | null = null;

  if (row.encryptedCredentials) {
    try {
      const decrypted = decryptSecure(row.encryptedCredentials);
      credentials = JSON.parse(decrypted);
    } catch (err: any) {
      console.error(`[Integration Repo] Failed to decrypt credentials for ${providerName}:`, err.message);
    }
  }

  return {
    id: row.id,
    providerName: row.providerName,
    status: row.status,
    accountEmail: row.accountEmail,
    credentials,
    syncCalendarConflicts: row.syncCalendarConflicts,
    lastSyncedAt: row.lastSyncedAt,
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listProviderIntegrations(): Promise<Omit<ProviderIntegration, 'credentials'>[]> {
  const pool = getDbPool();
  if (!pool) return [];

  const query = `
    SELECT
      id,
      provider_name AS "providerName",
      status,
      account_email AS "accountEmail",
      sync_calendar_conflicts AS "syncCalendarConflicts",
      last_synced_at AS "lastSyncedAt",
      last_error AS "lastError",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
    FROM provider_integrations
    ORDER BY provider_name ASC
  `;

  const { rows } = await pool.query(query);
  return rows;
}

export async function saveProviderCredentials(
  providerName: ProviderType,
  accountEmail: string,
  credentials: OAuthCredentials
): Promise<ProviderIntegration> {
  const pool = getDbPool();
  if (!pool) throw new Error('Database pool unavailable.');

  const encrypted = encryptSecure(JSON.stringify(credentials));
  const id = `prov_${providerName}`;

  const query = `
    INSERT INTO provider_integrations (
      id,
      provider_name,
      status,
      account_email,
      encrypted_credentials,
      sync_calendar_conflicts,
      last_synced_at,
      last_error,
      updated_at
    )
    VALUES ($1, $2, 'connected', $3, $4, TRUE, NOW(), NULL, NOW())
    ON CONFLICT (id) DO UPDATE SET
      status = 'connected',
      account_email = EXCLUDED.account_email,
      encrypted_credentials = EXCLUDED.encrypted_credentials,
      last_synced_at = NOW(),
      last_error = NULL,
      updated_at = NOW()
    RETURNING
      id,
      provider_name AS "providerName",
      status,
      account_email AS "accountEmail",
      sync_calendar_conflicts AS "syncCalendarConflicts",
      last_synced_at AS "lastSyncedAt",
      last_error AS "lastError",
      created_at AS "createdAt",
      updated_at AS "updatedAt"
  `;

  const { rows } = await pool.query(query, [id, providerName, accountEmail, encrypted]);
  return {
    ...rows[0],
    credentials,
  };
}

export async function updateProviderStatus(
  providerName: ProviderType,
  status: ProviderStatus,
  lastError?: string | null
): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  await pool.query(
    `
    UPDATE provider_integrations
    SET
      status = $1,
      last_error = $2,
      last_synced_at = CASE WHEN $1 = 'connected' THEN NOW() ELSE last_synced_at END,
      updated_at = NOW()
    WHERE provider_name = $3
  `,
    [status, lastError || null, providerName]
  );
}

export async function disconnectProvider(providerName: ProviderType): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  await pool.query(
    `
    UPDATE provider_integrations
    SET
      status = 'disconnected',
      encrypted_credentials = NULL,
      account_email = NULL,
      last_error = NULL,
      updated_at = NOW()
    WHERE provider_name = $1
  `,
    [providerName]
  );
}
