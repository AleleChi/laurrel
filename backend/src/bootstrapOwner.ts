import dotenv from 'dotenv';
import path from 'path';
import { findAdminByEmail, createAdminUser } from './database/adminRepo';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

async function main() {
  const email = process.env.ADMIN_OWNER_EMAIL;
  const password = process.env.ADMIN_OWNER_PASSWORD;
  const name = process.env.ADMIN_OWNER_NAME || 'Laurrel Owner Administrator';

  if (!email || !password) {
    console.error('[Admin Bootstrap Error]: ADMIN_OWNER_EMAIL and ADMIN_OWNER_PASSWORD environment variables are required.');
    process.exit(1);
  }

  const existing = await findAdminByEmail(email);
  if (existing) {
    console.log(`[Admin Bootstrap]: Administrator account already exists for ${email}. Existing account was NOT modified.`);
    process.exit(0);
  }

  const created = await createAdminUser({
    email,
    password,
    name,
    role: 'owner',
  });

  if (created) {
    console.log(`[Admin Bootstrap]: Successfully created primary owner administrator account (${email}).`);
    process.exit(0);
  } else {
    console.error('[Admin Bootstrap]: Failed to create owner administrator account.');
    process.exit(1);
  }
}

main();
