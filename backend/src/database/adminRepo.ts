import crypto from 'crypto';
import { getDbPool } from './pool';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'dispatcher';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminUserRecord extends AdminUser {
  passwordHash: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
}

/**
 * Cryptographically hash a password using scrypt with unique salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verify a plain password against stored salt:hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 2) return false;
    const [salt, key] = parts;
    const derivedKey = crypto.scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, 'hex');
    return crypto.timingSafeEqual(derivedKey, keyBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Find admin user by email (case-insensitive)
 */
export async function findAdminByEmail(email: string): Promise<AdminUserRecord | null> {
  const pool = getDbPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT id, email, password_hash as "passwordHash", name, role, is_active as "isActive",
              password_reset_token as "passwordResetToken", password_reset_expires as "passwordResetExpires",
              last_login_at as "lastLoginAt", created_at as "createdAt"
       FROM admin_users
       WHERE LOWER(email) = LOWER($1) AND is_active = TRUE
       LIMIT 1`,
      [email.trim()]
    );

    if (res.rows.length === 0) return null;
    return res.rows[0];
  } catch (err) {
    console.warn('[AdminRepo] Query failed or table does not exist:', err);
    return null;
  }
}

/**
 * Create a new administrator account
 */
export async function createAdminUser(params: {
  email: string;
  password: string;
  name: string;
  role: 'owner' | 'admin' | 'dispatcher';
}): Promise<AdminUser | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const id = `admin_${crypto.randomBytes(8).toString('hex')}`;
  const passwordHash = hashPassword(params.password);

  try {
    const res = await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, name, role, is_active)
       VALUES ($1, LOWER($2), $3, $4, $5, TRUE)
       ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           updated_at = NOW()
       RETURNING id, email, name, role, is_active as "isActive", created_at as "createdAt"`,
      [id, params.email.trim(), passwordHash, params.name.trim(), params.role]
    );

    return res.rows[0];
  } catch (err) {
    console.error('[AdminRepo] createAdminUser failed:', err);
    return null;
  }
}

/**
 * Record last login timestamp
 */
export async function recordAdminLogin(id: string): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  try {
    await pool.query(
      `UPDATE admin_users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  } catch (err) {
    console.warn('[AdminRepo] recordAdminLogin failed:', err);
  }
}

/**
 * Generate password reset token
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  try {
    const res = await pool.query(
      `UPDATE admin_users
       SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
       WHERE LOWER(email) = LOWER($3) AND is_active = TRUE
       RETURNING id`,
      [token, expires.toISOString(), email.trim()]
    );

    if (res.rows.length === 0) return null;
    return token;
  } catch (err) {
    console.error('[AdminRepo] createPasswordResetToken failed:', err);
    return null;
  }
}

/**
 * Reset password using token
 */
export async function resetAdminPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;

  const passwordHash = hashPassword(newPassword);

  try {
    const res = await pool.query(
      `UPDATE admin_users
       SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW()
       WHERE password_reset_token = $2 AND password_reset_expires > NOW() AND is_active = TRUE
       RETURNING id`,
      [passwordHash, token]
    );

    return (res.rowCount || 0) > 0;
  } catch (err) {
    console.error('[AdminRepo] resetAdminPasswordWithToken failed:', err);
    return false;
  }
}

/**
 * Bootstrap the primary Owner administrator account from environment variables if set.
 */
export async function bootstrapOwnerAccount(): Promise<void> {
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL || 'owner@laurrelservices.ca';
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD;

  if (!ownerPassword) {
    // No explicit password provided via env; bootstrap skipped until administrator sets ADMIN_OWNER_PASSWORD
    return;
  }

  const existing = await findAdminByEmail(ownerEmail);
  if (!existing) {
    console.log(`[Admin] Bootstrapping primary owner administrator account: ${ownerEmail}`);
    await createAdminUser({
      email: ownerEmail,
      password: ownerPassword,
      name: 'Laurrel Owner Admin',
      role: 'owner',
    });
  }
}
