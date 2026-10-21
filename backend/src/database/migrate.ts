import fs from 'fs';
import path from 'path';
import { getDbPool } from './pool';

const ADVISORY_LOCK_ID = 74239842;

interface MigrationStep {
  version: string;
  description: string;
  run: (client: any, baseSql: string) => Promise<void>;
}

const MIGRATION_PIPELINE: MigrationStep[] = [
  {
    version: '20261021_module_01_02_03_consolidated',
    description: 'Initial consolidated DDL for Modules 01, 02, and 03',
    run: async (client, baseSql) => {
      await client.query(baseSql);
    },
  },
  {
    version: '20261021_storage_bucket_and_integrity',
    description: 'Add storage_bucket column and index to media_assets for multi-bucket isolation',
    run: async (client) => {
      await client.query(`
        ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(128);
        CREATE INDEX IF NOT EXISTS idx_media_assets_storage_bucket ON media_assets(storage_bucket);
      `);
    },
  },
];

export async function runMigrations(): Promise<{ success: boolean; message: string; appliedCount?: number }> {
  const pool = getDbPool();
  if (!pool) {
    return {
      success: false,
      message: 'DATABASE_URL is not configured. Migrations skipped.',
    };
  }

  const candidatePaths = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '..', '..', 'src', 'database', 'schema.sql'),
    path.join(process.cwd(), 'backend', 'src', 'database', 'schema.sql'),
    path.join(process.cwd(), 'src', 'database', 'schema.sql'),
  ];

  const schemaPath = candidatePaths.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    return {
      success: false,
      message: `Schema file not found in candidates: ${candidatePaths.join(', ')}`,
    };
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Concurrency safeguard: PostgreSQL transaction-level advisory lock
      // Ensures only one worker runs migrations at any given time during scale-up
      await client.query('SELECT pg_advisory_xact_lock($1)', [ADVISORY_LOCK_ID]);

      // 2. Migration tracking table
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version VARCHAR(64) PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // 3. Query existing applied migrations
      const appliedRes = await client.query('SELECT version FROM schema_migrations');
      const appliedVersions = new Set<string>(appliedRes.rows.map((r: any) => r.version));

      let newCount = 0;
      for (const step of MIGRATION_PIPELINE) {
        if (!appliedVersions.has(step.version)) {
          console.log(`[Migration] Applying ${step.version}: ${step.description}...`);
          await step.run(client, sql);
          await client.query(
            'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
            [step.version]
          );
          newCount++;
          console.log(`[Migration] Successfully applied ${step.version}.`);
        }
      }

      await client.query('COMMIT');

      if (newCount === 0) {
        console.log('[Migration] All schema migrations are up-to-date.');
        return {
          success: true,
          message: 'All schema migrations are up-to-date.',
          appliedCount: 0,
        };
      }

      console.log(`[Migration] Successfully executed ${newCount} schema migration(s).`);
      return {
        success: true,
        message: `Successfully executed ${newCount} schema migration(s).`,
        appliedCount: newCount,
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[Migration Error]:', err.message);
      return { success: false, message: err.message };
    } finally {
      client.release();
    }
  } catch (connectErr: any) {
    return { success: false, message: `Could not connect to database: ${connectErr.message}` };
  }
}

// Standalone CLI execution
const isDirectCall =
  (typeof require !== 'undefined' && require.main === module) ||
  (process.argv[1] && process.argv[1].includes('migrate'));

if (isDirectCall) {
  runMigrations().then((result) => {
    console.log('[Migration Result]:', result.message);
    process.exit(result.success ? 0 : 1);
  });
}
