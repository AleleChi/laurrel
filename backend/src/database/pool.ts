import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Attempt loading environment variables from common location candidates
const envCandidates = [
  path.resolve(process.cwd(), 'backend', '.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
  path.resolve(__dirname, '..', '..', '..', '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config(); // fallback to standard process.cwd()

let poolInstance: Pool | null = null;

export function getDbPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!poolInstance) {
    const isProduction = process.env.NODE_ENV === 'production';
    const isNeon = connectionString.includes('neon.tech');
    const isRender = connectionString.includes('render.com');
    const hasSslMode = connectionString.includes('sslmode=require');
    const useSsl = isProduction || isNeon || isRender || hasSslMode;

    poolInstance = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]:', err.message);
    });
  }

  return poolInstance;
}

export const isDbConfigured = () => Boolean(process.env.DATABASE_URL);

export async function testDbConnection(): Promise<{ connected: boolean; message: string }> {
  const pool = getDbPool();
  if (!pool) {
    return {
      connected: false,
      message: 'DATABASE_URL environment variable is not configured. Falling back to local durable store.',
    };
  }

  try {
    const client = await pool.connect();
    try {
      const res = await client.query('SELECT NOW() as server_time');
      return {
        connected: true,
        message: `PostgreSQL connected successfully (server time: ${res.rows[0].server_time})`,
      };
    } finally {
      client.release();
    }
  } catch (error: any) {
    return {
      connected: false,
      message: `Database connection failed: ${error.message}`,
    };
  }
}
