import dotenv from 'dotenv';
import path from 'path';
import { findAdminByEmail, hashPassword, revokeAllUserSessions } from './database/adminRepo';
import { getDbPool } from './database/pool';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

async function main() {
  const pool = getDbPool();
  if (!pool) {
    console.error('[Password Reset Error]: Database connection not available.');
    process.exit(1);
  }

  const email = process.argv[2] || process.env.ADMIN_OWNER_EMAIL || 'alelechi17@gmail.com';
  const newPassword = process.env.NEW_PASSWORD || process.argv[3];

  if (!email) {
    console.error('Usage: npm run admin:reset-password <email> [newPassword]');
    console.error('Or set NEW_PASSWORD environment variable.');
    process.exit(1);
  }

  const admin = await findAdminByEmail(email);
  if (!admin) {
    console.error(`[Password Reset Error]: No active administrator found with email: ${email}`);
    process.exit(1);
  }

  if (!newPassword) {
    console.error('[Password Reset Error]: A new password must be provided via argument or NEW_PASSWORD env.');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('[Password Reset Error]: Password must be at least 8 characters long.');
    process.exit(1);
  }

  const newHash = await hashPassword(newPassword);

  await pool.query(
    `UPDATE admin_users
     SET password_hash = $1,
         failed_login_attempts = 0,
         locked_until = NULL,
         password_reset_token = NULL,
         password_reset_expires = NULL,
         updated_at = NOW()
     WHERE id = $2`,
    [newHash, admin.id]
  );

  // Invalidate any active sessions for security
  await revokeAllUserSessions(admin.id);

  console.log(`[Password Reset]: Password successfully updated with Argon2id for ${admin.email} (Role: ${admin.role}).`);
  console.log('[Password Reset]: All previous active sessions were invalidated.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Password Reset Error]:', err.message);
  process.exit(1);
});
