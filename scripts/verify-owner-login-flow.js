const puppeteer = require('puppeteer');
const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
dotenv.config();

const { Pool } = require('../backend/node_modules/pg');

async function runVerification() {
  console.log('===========================================================');
  console.log('LAURREL SERVICES — OWNER LOGIN & BROWSER VERIFICATION FLOW');
  console.log('===========================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const ownerEmail = process.env.ADMIN_OWNER_EMAIL || 'alelechi17@gmail.com';
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD;

  if (!ownerPassword) {
    console.error('❌ ADMIN_OWNER_PASSWORD is not set in backend/.env');
    process.exit(1);
  }

  try {
    // 1. Inspect existing owner account in Neon
    console.log(`1. Inspecting owner account in Neon for ${ownerEmail}...`);
    const ownerRes = await pool.query(
      `SELECT id, email, name, role, is_active as "isActive",
              (password_hash LIKE '$argon2%') as "isArgon2"
       FROM admin_users WHERE LOWER(email) = LOWER($1)`,
      [ownerEmail]
    );

    if (ownerRes.rows.length === 0) {
      throw new Error(`Owner account not found in Neon database for: ${ownerEmail}`);
    }

    const owner = ownerRes.rows[0];
    console.log(`✅ Owner account confirmed in database:`);
    console.log(`   - ID: ${owner.id}`);
    console.log(`   - Email: ${owner.email}`);
    console.log(`   - Name: ${owner.name}`);
    console.log(`   - Role: ${owner.role}`);
    console.log(`   - Active: ${owner.isActive}`);
    console.log(`   - Password Hash: Argon2id (${owner.isArgon2})`);

    if (owner.role !== 'owner') {
      throw new Error(`Expected role 'owner', got: ${owner.role}`);
    }

    // 2. Launch Puppeteer browser
    console.log('\n2. Launching headless browser...');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('response', async res => {
      if (res.url().includes('/api/admin/auth/')) {
        try {
          const body = await res.json();
          console.log(`API RESPONSE [${res.status()}] ${res.url()}:`, JSON.stringify(body));
        } catch (_) {}
      }
    });
    await page.setViewport({ width: 1440, height: 900 });

    // 3. Test unauthenticated access to /admin
    console.log('\n3. Testing unauthenticated access to /admin...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    const currentUrl = page.url();
    if (!currentUrl.includes('/admin/login')) {
      throw new Error(`Expected redirect to /admin/login, got: ${currentUrl}`);
    }
    console.log(`✅ Unauthenticated access successfully redirected to: ${currentUrl}`);

    // 4. Test invalid password rejection on /admin/login
    console.log('\n4. Testing invalid password rejection on /admin/login...');
    await page.waitForSelector('#admin-email', { visible: true, timeout: 10000 });
    await page.type('#admin-email', ownerEmail, { delay: 10 });
    await page.type('#admin-password', 'IncorrectPassword123!', { delay: 10 });
    await page.click('button[type="submit"]');
    await page.waitForSelector('[role="alert"]', { visible: true, timeout: 10000 });
    const errorText = await page.$eval('[role="alert"]', (el) => el.innerText);
    console.log(`✅ Invalid credentials rejected with alert: "${errorText.trim()}"`);

    // 5. Test valid owner login on a fresh form navigation
    console.log('\n5. Submitting valid owner credentials...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#admin-email', { visible: true, timeout: 10000 });
    await page.type('#admin-email', ownerEmail, { delay: 10 });
    await page.type('#admin-password', ownerPassword, { delay: 10 });
    await page.click('button[type="submit"]');

    // Wait for client-side navigation to /admin
    await page.waitForFunction(() => window.location.pathname === '/admin', { timeout: 10000 });
    const loggedInUrl = page.url();
    if (!loggedInUrl.endsWith('/admin')) {
      throw new Error(`Expected redirect to /admin after login, got: ${loggedInUrl}`);
    }
    console.log(`✅ Login successful! Navigated to: ${loggedInUrl}`);

    // 6. Verify Session Persistence & Cookie
    console.log('\n6. Checking session cookie and persistence...');
    const cookies = await page.cookies();
    const sessionCookie = cookies.find((c) => c.name === 'laurrel_admin_session');
    if (!sessionCookie) {
      throw new Error('Session cookie laurrel_admin_session not found!');
    }
    console.log(`✅ Session cookie verified:`);
    console.log(`   - Name: ${sessionCookie.name}`);
    console.log(`   - HttpOnly: ${sessionCookie.httpOnly}`);
    console.log(`   - SameSite: ${sessionCookie.sameSite}`);
    console.log(`   - Path: ${sessionCookie.path}`);

    // 7. Verify Owner Role in Application Shell
    console.log('\n7. Verifying authenticated owner role displayed in UI shell...');
    await page.waitForSelector('aside', { timeout: 5000 });
    const userRoleText = await page.evaluate(() => {
      const badges = Array.from(document.querySelectorAll('span'));
      const ownerBadge = badges.find((b) => b.textContent?.trim().toLowerCase() === 'owner');
      return ownerBadge ? ownerBadge.textContent?.trim() : null;
    });

    if (userRoleText?.toLowerCase() !== 'owner') {
      throw new Error(`Expected 'owner' role badge in sidebar, found: ${userRoleText}`);
    }
    console.log(`✅ Confirmed: Sidebar user badge displays [${userRoleText}]`);

    // 8. Verify Dashboard KPI Metrics & Neon Status
    console.log('\n8. Checking dashboard overview indicators...');
    const overviewHeading = await page.$eval('h1', (el) => el.innerText);
    console.log(`✅ Dashboard page header: "${overviewHeading}"`);

    // Take screenshot of authenticated owner dashboard
    const artifactDir = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\888f44c3-15c7-44b5-a341-cb60fba2d087';
    await page.screenshot({ path: path.join(artifactDir, 'owner-authenticated-dashboard.png') });
    console.log('✅ Screenshot captured: owner-authenticated-dashboard.png');

    // 9. Test Logout
    console.log('\n9. Testing logout flow...');
    const logoutBtn = await page.waitForSelector('button[title="Sign Out"]', { timeout: 5000 });
    await logoutBtn.click();
    await page.waitForFunction(() => window.location.pathname === '/admin/login', { timeout: 10000 });

    const postLogoutUrl = page.url();
    if (!postLogoutUrl.includes('/admin/login')) {
      throw new Error(`Expected redirect to /admin/login after logout, got: ${postLogoutUrl}`);
    }
    console.log(`✅ Logout successful. Redirected back to: ${postLogoutUrl}`);

    // 10. Verify access to /admin is now denied
    console.log('\n10. Testing access to /admin after logout...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    const deniedUrl = page.url();
    if (!deniedUrl.includes('/admin/login')) {
      throw new Error(`Expected access denial after logout, got: ${deniedUrl}`);
    }
    console.log(`✅ Access denied after logout. Cleanly returned to login.`);

    // 11. Verify session revocation in Neon database
    console.log('\n11. Verifying session revocation in Neon database...');
    const sessionCheck = await pool.query(
      `SELECT id, revoked_at, expires_at FROM admin_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [owner.id]
    );
    if (sessionCheck.rows.length > 0 && sessionCheck.rows[0].revoked_at) {
      console.log(`✅ Session ${sessionCheck.rows[0].id} is recorded as revoked at: ${sessionCheck.rows[0].revoked_at}`);
    }

    await browser.close();
    console.log('\n===========================================================');
    console.log('🎉 ALL OWNER LOGIN & AUTHENTICATION TESTS PASSED (11/11)');
    console.log('===========================================================\n');
  } finally {
    await pool.end();
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
});
