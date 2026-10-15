import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const isDbConfigured = Boolean(connectionString);

let poolInstance: Pool | null = null;

export function getDbPool(): Pool | null {
  if (!connectionString) {
    return null;
  }

  if (!poolInstance) {
    const isProduction = process.env.NODE_ENV === 'production';
    const useSsl = isProduction || connectionString.includes('sslmode=require') || connectionString.includes('render.com');

    poolInstance = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    poolInstance.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]: Unexpected client error', err.message);
    });
  }

  return poolInstance;
}

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
