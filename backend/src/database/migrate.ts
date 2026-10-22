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
  {
    version: '20261021_associate_staging_r2_bucket',
    description: 'Safely associate confirmed staging R2 assets with laurrel-media-staging without guessing',
    run: async (client) => {
      const updateRes = await client.query(`
        UPDATE media_assets
        SET storage_bucket = 'laurrel-media-staging', updated_at = NOW()
        WHERE storage_provider = 'r2'
          AND storage_bucket IS NULL
          AND public_url LIKE 'https://pub-185e32b3a8d04a9e92249aa5108b673f.r2.dev%'
      `);
      console.log(`[Migration] Associated ${updateRes.rowCount} confirmed staging R2 asset(s) with laurrel-media-staging.`);
    },
  },
  {
    version: '20261022_module_04_appointments',
    description: 'Add appointments, appointment_activity, and appointment_notifications tables for consultation scheduling',
    run: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS appointments (
            id VARCHAR(32) PRIMARY KEY,
            enquiry_id VARCHAR(32) NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            purpose TEXT,
            appointment_type VARCHAR(64) NOT NULL DEFAULT 'telephone',
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            scheduled_start TIMESTAMPTZ NOT NULL,
            scheduled_end TIMESTAMPTZ NOT NULL,
            duration_minutes INT NOT NULL DEFAULT 30,
            timezone VARCHAR(64) NOT NULL DEFAULT 'America/Toronto',
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(64),
            location_or_link TEXT,
            assigned_staff_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
            assigned_staff_name VARCHAR(255),
            staff_notes TEXT,
            notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
            notification_sent_at TIMESTAMPTZ,
            idempotency_key VARCHAR(128) UNIQUE,
            cancellation_reason TEXT,
            rescheduled_from_id VARCHAR(32) REFERENCES appointments(id) ON DELETE SET NULL,
            created_by VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_appointments_enquiry_id ON appointments(enquiry_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_start ON appointments(scheduled_start);
        CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
        CREATE INDEX IF NOT EXISTS idx_appointments_assigned_staff_id ON appointments(assigned_staff_id);
        CREATE INDEX IF NOT EXISTS idx_appointments_idempotency_key ON appointments(idempotency_key);
        CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at DESC);

        CREATE TABLE IF NOT EXISTS appointment_activity (
            id VARCHAR(64) PRIMARY KEY,
            appointment_id VARCHAR(32) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
            action VARCHAR(64) NOT NULL,
            performed_by VARCHAR(128) NOT NULL,
            details TEXT,
            metadata JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_appointment_activity_appointment_id ON appointment_activity(appointment_id);
        CREATE INDEX IF NOT EXISTS idx_appointment_activity_created_at ON appointment_activity(created_at DESC);

        CREATE TABLE IF NOT EXISTS appointment_notifications (
            id VARCHAR(64) PRIMARY KEY,
            appointment_id VARCHAR(32) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
            recipient_email VARCHAR(255) NOT NULL,
            notification_type VARCHAR(64) NOT NULL,
            status VARCHAR(32) NOT NULL,
            error_message TEXT,
            sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_appointment_notifications_appointment_id ON appointment_notifications(appointment_id);
        CREATE INDEX IF NOT EXISTS idx_appointment_notifications_sent_at ON appointment_notifications(sent_at DESC);
      `);
      console.log('[Migration] Appointments tables and indexes created successfully.');
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
