import crypto from 'crypto';
import * as argon2 from 'argon2';
import { getDbPool } from './pool';

export type AdminRole = 'owner' | 'admin' | 'content_editor' | 'operations_staff' | 'viewer';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AdminUserRecord extends AdminUser {
  passwordHash: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
}

export interface AdminSession {
  id: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Hash password using Argon2id (memory-hard, resistant to GPU/ASIC attacks)
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verify password against stored hash.
 * Supports Argon2id, and backward-compatible scrypt with automatic transparent rehash.
 */
export async function verifyAndUpgradePassword(
  userId: string,
  plainPassword: string,
  storedHash: string
): Promise<boolean> {
  try {
    // 1. Argon2id check
    if (storedHash.startsWith('$argon2')) {
      return await argon2.verify(storedHash, plainPassword);
    }

    // 2. Legacy scrypt check (salt:derivedKey)
    if (storedHash.includes(':')) {
      const [salt, key] = storedHash.split(':');
      if (!salt || !key) return false;
      const derivedKey = crypto.scryptSync(plainPassword, salt, 64);
      const keyBuffer = Buffer.from(key, 'hex');
      const matches = crypto.timingSafeEqual(derivedKey, keyBuffer);

      if (matches) {
        // Upgrade legacy hash to Argon2id transparently
        try {
          const newHash = await hashPassword(plainPassword);
          const pool = getDbPool();
          if (pool) {
            await pool.query(
              `UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
              [newHash, userId]
            );
            console.log(`[Admin Security] Successfully upgraded legacy password hash to Argon2id for user ${userId}`);
          }
        } catch (upgradeErr) {
          console.warn('[Admin Security] Failed to rehash legacy password:', upgradeErr);
        }
      }

      return matches;
    }

    return false;
  } catch (err) {
    console.error('[Admin Security] Password verification error:', err);
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
              failed_login_attempts as "failedLoginAttempts", locked_until as "lockedUntil",
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
 * Find admin user by ID
 */
export async function findAdminById(id: string): Promise<AdminUser | null> {
  const pool = getDbPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT id, email, name, role, is_active as "isActive",
              last_login_at as "lastLoginAt", created_at as "createdAt"
       FROM admin_users
       WHERE id = $1 AND is_active = TRUE
       LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) return null;
    return res.rows[0];
  } catch (err) {
    console.warn('[AdminRepo] findAdminById failed:', err);
    return null;
  }
}

/**
 * Create a new administrator account (never overwrites existing passwords on conflict)
 */
export async function createAdminUser(params: {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
}): Promise<AdminUser | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const id = `admin_${crypto.randomBytes(12).toString('hex')}`;
  const passwordHash = await hashPassword(params.password);

  try {
    const res = await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, name, role, is_active)
       VALUES ($1, LOWER($2), $3, $4, $5, TRUE)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, name, role, is_active as "isActive", created_at as "createdAt"`,
      [id, params.email.trim(), passwordHash, params.name.trim(), params.role]
    );

    return res.rows[0] || null;
  } catch (err) {
    console.error('[AdminRepo] createAdminUser failed:', err);
    return null;
  }
}

/**
 * Record a successful login: resets failed attempts, clears lockout, updates last_login_at
 */
export async function handleLoginSuccess(id: string, email: string, ip?: string, ua?: string): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  try {
    await pool.query(
      `UPDATE admin_users
       SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $1`,
      [id]
    );

    await recordAuthEvent(email, 'login_success', ip, ua);
  } catch (err) {
    console.warn('[AdminRepo] handleLoginSuccess failed:', err);
  }
}

/**
 * Record a failed login attempt: increments counter, locks account after 5 failed attempts
 */
export async function handleLoginFailure(email: string, ip?: string, ua?: string): Promise<{ locked: boolean }> {
  const pool = getDbPool();
  if (!pool) return { locked: false };

  try {
    const res = await pool.query(
      `UPDATE admin_users
       SET failed_login_attempts = failed_login_attempts + 1,
           locked_until = CASE
             WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '15 minutes'
             ELSE locked_until
           END,
           updated_at = NOW()
       WHERE LOWER(email) = LOWER($1) AND is_active = TRUE
       RETURNING failed_login_attempts as "attempts", locked_until as "lockedUntil"`,
      [email.trim()]
    );

    await recordAuthEvent(email, 'login_failure', ip, ua);

    if (res.rows.length > 0 && res.rows[0].attempts >= 5) {
      await recordAuthEvent(email, 'account_locked', ip, ua);
      return { locked: true };
    }
  } catch (err) {
    console.warn('[AdminRepo] handleLoginFailure failed:', err);
  }

  return { locked: false };
}

/**
 * Session Management
 */
export async function createAdminSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AdminSession | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const sessionId = `sess_${crypto.randomBytes(24).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours

  try {
    const res = await pool.query(
      `INSERT INTO admin_sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id as "userId", created_at as "createdAt", expires_at as "expiresAt"`,
      [sessionId, userId, expiresAt.toISOString(), ipAddress || null, userAgent || null]
    );

    return res.rows[0];
  } catch (err) {
    console.error('[AdminRepo] createAdminSession failed:', err);
    return null;
  }
}

/**
 * Verify active session from database
 */
export async function verifyAdminSession(
  sessionId: string
): Promise<{ user: AdminUser; session: AdminSession } | null> {
  const pool = getDbPool();
  if (!pool) return null;

  try {
    const res = await pool.query(
      `SELECT s.id as "sessionId", s.user_id as "userId", s.created_at as "sessionCreatedAt",
              s.expires_at as "expiresAt", s.revoked_at as "revokedAt",
              u.id as "userId", u.email, u.name, u.role, u.is_active as "isActive",
              u.last_login_at as "lastLoginAt", u.created_at as "userCreatedAt"
       FROM admin_sessions s
       JOIN admin_users u ON s.user_id = u.id
       WHERE s.id = $1
         AND s.revoked_at IS NULL
         AND s.expires_at > NOW()
         AND u.is_active = TRUE
       LIMIT 1`,
      [sessionId]
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      session: {
        id: row.sessionId,
        userId: row.userId,
        createdAt: row.sessionCreatedAt,
        expiresAt: row.expiresAt,
      },
      user: {
        id: row.userId,
        email: row.email,
        name: row.name,
        role: row.role as AdminRole,
        isActive: row.isActive,
        lastLoginAt: row.lastLoginAt,
        createdAt: row.userCreatedAt,
      },
    };
  } catch (err) {
    console.error('[AdminRepo] verifyAdminSession failed:', err);
    return null;
  }
}

/**
 * Revoke specific session (on logout)
 */
export async function revokeAdminSession(sessionId: string): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;

  try {
    const res = await pool.query(
      `UPDATE admin_sessions SET revoked_at = NOW() WHERE id = $1 AND revoked_at IS NULL`,
      [sessionId]
    );
    return (res.rowCount || 0) > 0;
  } catch (err) {
    console.error('[AdminRepo] revokeAdminSession failed:', err);
    return false;
  }
}

/**
 * Revoke all sessions for a user (e.g. password change, security incident)
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  try {
    await pool.query(
      `UPDATE admin_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  } catch (err) {
    console.error('[AdminRepo] revokeAllUserSessions failed:', err);
  }
}

/**
 * Record authentication audit event
 */
export async function recordAuthEvent(
  email: string,
  eventType: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;

  const eventId = `auth_evt_${crypto.randomBytes(12).toString('hex')}`;
  try {
    await pool.query(
      `INSERT INTO admin_auth_events (id, email, event_type, ip_address, user_agent)
       VALUES ($1, LOWER($2), $3, $4, $5)`,
      [eventId, email.trim(), eventType, ipAddress || null, userAgent || null]
    );
  } catch (err) {
    console.warn('[AdminRepo] recordAuthEvent failed:', err);
  }
}

/**
 * Create password reset token.
 * Stores SHA-256 hash in database; never stores or logs the raw token.
 */
export async function createPasswordResetToken(email: string): Promise<string | null> {
  const pool = getDbPool();
  if (!pool) return null;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  try {
    const res = await pool.query(
      `UPDATE admin_users
       SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
       WHERE LOWER(email) = LOWER($3) AND is_active = TRUE
       RETURNING id`,
      [tokenHash, expires.toISOString(), email.trim()]
    );

    if (res.rows.length === 0) return null;
    return rawToken; // Returned only to mailer, never logged
  } catch (err) {
    console.error('[AdminRepo] createPasswordResetToken failed:', err);
    return null;
  }
}

/**
 * Reset password using token
 */
export async function resetAdminPasswordWithToken(rawToken: string, newPassword: string): Promise<boolean> {
  const pool = getDbPool();
  if (!pool) return false;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const passwordHash = await hashPassword(newPassword);

  try {
    const res = await pool.query(
      `UPDATE admin_users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = NOW()
       WHERE password_reset_token = $2 AND password_reset_expires > NOW() AND is_active = TRUE
       RETURNING id`,
      [passwordHash, tokenHash]
    );

    if (res.rowCount && res.rowCount > 0) {
      // Invalidate all active sessions for this user upon password reset
      await revokeAllUserSessions(res.rows[0].id);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[AdminRepo] resetAdminPasswordWithToken failed:', err);
    return false;
  }
}

/**
 * Bootstrap the primary Owner administrator account if none exists.
 * Does NOT overwrite existing accounts, and never logs credentials.
 */
export async function bootstrapOwnerAccount(): Promise<void> {
  const ownerEmail = process.env.ADMIN_OWNER_EMAIL || 'owner@laurrelservices.ca';
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD;

  if (!ownerPassword) {
    return;
  }

  const existing = await findAdminByEmail(ownerEmail);
  if (!existing) {
    console.log(`[Admin Bootstrap] Initializing primary owner account: ${ownerEmail}`);
    await createAdminUser({
      email: ownerEmail,
      password: ownerPassword,
      name: 'Laurrel Owner Administrator',
      role: 'owner',
    });
  }
}
