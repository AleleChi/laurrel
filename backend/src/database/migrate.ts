import fs from 'fs';
import path from 'path';
import { getDbPool } from './pool';

const MIGRATION_VERSION = '20261021_module_01_02_03_consolidated';
const ADVISORY_LOCK_ID = 74239842;

export async function runMigrations(): Promise<{ success: boolean; message: string }> {
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

      // 3. Check if this consolidated migration has already been applied
      const existing = await client.query(
        'SELECT version, applied_at FROM schema_migrations WHERE version = $1',
        [MIGRATION_VERSION]
      );

      if (existing.rows.length > 0) {
        await client.query('COMMIT');
        console.log(`[Migration] Version ${MIGRATION_VERSION} already applied at ${existing.rows[0].applied_at}. Skipping redundant DDL.`);
        return {
          success: true,
          message: `Schema version ${MIGRATION_VERSION} is already current.`,
        };
      }

      // 4. Execute non-destructive schema DDL
      await client.query(sql);

      // 5. Record completed migration version
      await client.query(
        'INSERT INTO schema_migrations (version, applied_at) VALUES ($1, NOW())',
        [MIGRATION_VERSION]
      );

      await client.query('COMMIT');
      console.log(`[Migration] PostgreSQL schema migration ${MIGRATION_VERSION} executed successfully.`);
      return { success: true, message: `Migration ${MIGRATION_VERSION} initialized successfully.` };
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
