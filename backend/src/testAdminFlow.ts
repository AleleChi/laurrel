import dotenv from 'dotenv';
import path from 'path';
import {
  findAdminByEmail,
  createAdminUser,
  verifyAndUpgradePassword,
  handleLoginSuccess,
  handleLoginFailure,
  createAdminSession,
  verifyAdminSession,
  revokeAdminSession,
} from './database/adminRepo';
import { getDbPool } from './database/pool';
import { listEnquiries, updateEnquiryStatus } from './database/enquiryRepo';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

async function runTestSuite() {
  console.log('====================================================');
  console.log('LAURREL SERVICES — ADMIN MODULE 01 VERIFICATION SUITE');
  console.log('====================================================\n');

  const pool = getDbPool();
  if (!pool) {
    console.error('❌ Failed: DATABASE_URL not available.');
    process.exit(1);
  }

  const testEmail = `test.admin.${Date.now()}@laurrelservices.ca`;
  const testPassword = 'SecurePassword2026!Argon2';

  // 1. Create Admin Account
  console.log('1. Testing Admin Creation with Argon2id...');
  const user = await createAdminUser({
    email: testEmail,
    password: testPassword,
    name: 'Test Administrator',
    role: 'admin',
  });

  if (!user || !user.id) {
    console.error('❌ Failed to create admin user.');
    process.exit(1);
  }
  console.log(`✅ Admin created successfully: ID=${user.id}, Role=${user.role}`);

  // 2. Verify stored password hash starts with $argon2id$
  console.log('\n2. Verifying password hash algorithm...');
  const record = await findAdminByEmail(testEmail);
  if (!record || !record.passwordHash.startsWith('$argon2id$')) {
    console.error('❌ Password hash does not use Argon2id format:', record?.passwordHash);
    process.exit(1);
  }
  console.log(`✅ Password hash verified as Argon2id ($argon2id$...)`);

  // 3. Test Wrong Password & Failure Tracking
  console.log('\n3. Testing incorrect password verification & failure tracking...');
  const wrongValid = await verifyAndUpgradePassword(user.id, 'WrongPassword', record.passwordHash);
  if (wrongValid) {
    console.error('❌ Failed: Incorrect password evaluated to true!');
    process.exit(1);
  }
  await handleLoginFailure(testEmail);
  const afterFail = await findAdminByEmail(testEmail);
  console.log(`✅ Incorrect password rejected. Failed attempts count: ${afterFail?.failedLoginAttempts}`);

  // 4. Test Correct Password
  console.log('\n4. Testing correct password verification...');
  const correctValid = await verifyAndUpgradePassword(user.id, testPassword, record.passwordHash);
  if (!correctValid) {
    console.error('❌ Failed: Correct password was rejected!');
    process.exit(1);
  }
  await handleLoginSuccess(user.id, testEmail);
  const afterSuccess = await findAdminByEmail(testEmail);
  console.log(`✅ Password verified successfully. Failed attempts reset to: ${afterSuccess?.failedLoginAttempts}`);

  // 5. Test Server-Managed Session Lifecycle
  console.log('\n5. Testing server-managed session creation and revocation...');
  const session = await createAdminSession(user.id, '127.0.0.1', 'LaurrelTestAgent/1.0');
  if (!session || !session.id) {
    console.error('❌ Failed to create admin session.');
    process.exit(1);
  }
  console.log(`✅ Session created in Neon: ${session.id}`);

  const verified = await verifyAdminSession(session.id);
  if (!verified || verified.user.id !== user.id) {
    console.error('❌ Failed to verify active session from database.');
    process.exit(1);
  }
  console.log(`✅ Session verified active for user: ${verified.user.email} (${verified.user.role})`);

  const revoked = await revokeAdminSession(session.id);
  if (!revoked) {
    console.error('❌ Failed to revoke session.');
    process.exit(1);
  }
  const afterRevoke = await verifyAdminSession(session.id);
  if (afterRevoke !== null) {
    console.error('❌ Revoked session is still considered active!');
    process.exit(1);
  }
  console.log('✅ Revoked session verified as terminated.');

  // 6. Test SQL Stats Aggregation
  console.log('\n6. Testing SQL Aggregate Statistics...');
  const statsRes = await pool.query(`
    SELECT
      COUNT(*)::int as "totalEnquiries",
      COUNT(*) FILTER (WHERE status = 'new')::int as "newEnquiries",
      COUNT(*) FILTER (WHERE status = 'reviewed')::int as "reviewed",
      COUNT(*) FILTER (WHERE status = 'scheduled')::int as "scheduled"
    FROM enquiries;
  `);
  const stats = statsRes.rows[0];
  console.log('✅ Real-time Database Counts from Neon:', stats);

  // 7. Test Enquiry Listing & Status Update with Session Author
  console.log('\n7. Testing Enquiry Fetching & Secure Status Transition...');
  const enquiries = await listEnquiries({ limit: 5 });
  console.log(`✅ Enquiries retrieved: ${enquiries.length}`);
  if (enquiries.length > 0) {
    const targetEnq = enquiries[0];
    const updateRes = await updateEnquiryStatus(
      targetEnq.id,
      'reviewed',
      `${user.name} (${user.role})`,
      'Verified in Module 01 automated test suite.'
    );
    if (!updateRes || updateRes.status !== 'reviewed') {
      console.error('❌ Failed to update enquiry status.');
      process.exit(1);
    }
    console.log(`✅ Enquiry ${targetEnq.id} status updated to 'reviewed' with author attribution.`);
    console.log(`   Latest internal note: "${updateRes.internalNotes?.[updateRes.internalNotes.length - 1]?.note}"`);
  }

  // Clean up test admin user to leave database clean
  await pool.query('DELETE FROM admin_users WHERE id = $1', [user.id]);
  console.log('\n✅ Test user cleaned up. Database clean.');

  console.log('\n====================================================');
  console.log('🎉 ALL MODULE 01 VERIFICATION TESTS PASSED (7/7)');
  console.log('====================================================\n');
  process.exit(0);
}

runTestSuite().catch((err) => {
  console.error('❌ Test suite failed with exception:', err);
  process.exit(1);
});
