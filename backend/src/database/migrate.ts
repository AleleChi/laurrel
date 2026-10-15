import fs from 'fs';
import path from 'path';
import { getDbPool } from './pool';

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
      await client.query(sql);
      await client.query('COMMIT');
      console.log('[Migration] PostgreSQL schema migration executed successfully.');
      return { success: true, message: 'All tables and indexes initialized.' };
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
if (require.main === module) {
  runMigrations().then((result) => {
    console.log(result);
    process.exit(result.success ? 0 : 1);
  });
}
