const puppeteer = require('puppeteer');
const path = require('path');
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runFullBrowserSuite() {
  console.log('================================================================');
  console.log('LAURREL SERVICES — COMPREHENSIVE BROWSER INTEGRATION SUITE');
  console.log('================================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });

  const ownerEmail = process.env.ADMIN_OWNER_EMAIL || 'alelechi17@gmail.com';
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------
    // Test 1: Desktop Homepage (1440x900)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Public Homepage Desktop (1440x900) ---');
    await page.setViewport({ width: 1440, height: 900 });
    const homeRes = await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    if (homeRes.status() !== 200) {
      throw new Error(`Homepage returned status ${homeRes.status()}`);
    }
    const hasHero = await page.evaluate(() => Boolean(document.querySelector('h1')));
    const hasMedia = await page.evaluate(() => Boolean(document.querySelector('video') || document.querySelector('img')));
    console.log(`✅ Desktop Homepage loaded: status ${homeRes.status()}, hasHero=${hasHero}, hasMedia=${hasMedia}`);

    // -------------------------------------------------------------
    // Test 2: Mobile Homepage (390x844 iPhone 14)
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Public Homepage Mobile (390x844) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const mobileHeading = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
    console.log(`✅ Mobile Homepage loaded: "${mobileHeading.slice(0, 40)}..."`);

    // Reset viewport to desktop for administrative tests
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // Test 3: About Page Desktop
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: About Page (/about) ---');
    const aboutRes = await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle0' });
    if (aboutRes.status() !== 200) throw new Error(`About page returned ${aboutRes.status()}`);
    console.log(`✅ About Page loaded 200 OK.`);

    // -------------------------------------------------------------
    // Test 4: Services Page Desktop
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Services Page (/services) ---');
    const servicesRes = await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle0' });
    if (servicesRes.status() !== 200) throw new Error(`Services page returned ${servicesRes.status()}`);
    console.log(`✅ Services Page loaded 200 OK.`);

    // -------------------------------------------------------------
    // Test 5: Contact Page & Live Enquiry Submission
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Contact Page (/contact) & Enquiry Submission ---');
    await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle0' });

    // Submit live enquiry via the frontend form
    await page.waitForSelector('#contact-full-name', { timeout: 5000 });
    await page.type('#contact-full-name', 'Jane Doe Ottawa');
    await page.type('#contact-email', 'jane.ottawa@example.com');
    await page.type('textarea', 'Need weekly office and residential cleaning in Kanata.');

    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      const [enquiryResponse] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/enquire'), { timeout: 10000 }),
        submitBtn.click(),
      ]);
      const resJson = await enquiryResponse.json();
      console.log(`✅ Form submitted through frontend /api/enquire: status ${enquiryResponse.status()}, referenceId=${resJson.referenceId}`);

      if (resJson.referenceId) {
        // Clean up enquiry from DB
        await pool.query('DELETE FROM enquiry_notes WHERE enquiry_id = $1', [resJson.referenceId]);
        await pool.query('DELETE FROM enquiries WHERE id = $1', [resJson.referenceId]);
      }
    }

    // -------------------------------------------------------------
    // Test 6: Admin Login & Authenticated Proxy Flow
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Admin Login & Netlify-to-Render Proxy Architecture ---');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', ownerEmail);
    await page.type('#admin-password', ownerPassword);
    
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);

    console.log(`✅ Logged in successfully. Current URL: ${page.url()}`);
    if (!page.url().includes('/admin')) {
      throw new Error(`Expected redirect to /admin, got ${page.url()}`);
    }

    // Verify /api/admin/auth/me via the proxy
    const meRes = await page.evaluate(async () => {
      const r = await fetch('/api/admin/auth/me');
      return { status: r.status, data: await r.json() };
    });
    console.log(`✅ Frontend /api/admin/auth/me proxy response: status ${meRes.status}, role=${meRes.data.user?.role}`);
    if (meRes.status !== 200 || meRes.data.user?.role !== 'owner') {
      throw new Error(`Unexpected /auth/me proxy response: ${JSON.stringify(meRes)}`);
    }

    // Verify /admin/enquiries
    console.log('\n- Navigating to /admin/enquiries...');
    await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
    const enquiriesBody = await page.evaluate(() => document.body.innerText);
    if (!enquiriesBody.includes('Enquiries') && !enquiriesBody.includes('Customer Leads')) {
      throw new Error('Enquiries page failed to render properly');
    }
    console.log('✅ /admin/enquiries loaded successfully.');

    // Verify /admin/website
    console.log('\n- Navigating to /admin/website...');
    await page.goto('http://localhost:3000/admin/website', { waitUntil: 'networkidle0' });
    const websiteBody = await page.evaluate(() => document.body.innerText);
    if (!websiteBody.includes('Pages') && !websiteBody.includes('Website')) {
      throw new Error('Website CMS page failed to render properly');
    }
    console.log('✅ /admin/website loaded successfully.');

    // Verify /admin/media
    console.log('\n- Navigating to /admin/media...');
    await page.goto('http://localhost:3000/admin/media', { waitUntil: 'networkidle0' });
    const mediaBody = await page.evaluate(() => document.body.innerText);
    if (!mediaBody.includes('Media Library') && !mediaBody.includes('Upload')) {
      throw new Error('Media Library page failed to render properly');
    }
    console.log('✅ /admin/media loaded successfully.');

    // -------------------------------------------------------------
    // Test 7: Logout Flow & Session Revocation
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Logout Invalidation & Session Revocation ---');
    const [logoutResponse] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/admin/auth/logout'), { timeout: 10000 }),
      page.evaluate(async () => {
        const btn = document.querySelector('button[aria-label="Sign Out"], button[title="Sign Out"]');
        if (btn) {
          btn.click();
        } else {
          await fetch('/api/admin/auth/logout', { method: 'POST' });
        }
      }),
    ]);
    console.log(`✅ Logout response received: status ${logoutResponse.status()}`);

    // Wait for redirect to login or check auth/me
    await sleep(800);

    // Call /api/admin/auth/me: should return 401
    const postLogoutMe = await page.evaluate(async () => {
      const r = await fetch('/api/admin/auth/me');
      return { status: r.status };
    });
    console.log(`✅ Post-logout /api/admin/auth/me status: ${postLogoutMe.status} (expected 401)`);
    if (postLogoutMe.status !== 401) {
      throw new Error(`Expected 401 after logout, got ${postLogoutMe.status}`);
    }

    console.log('\n================================================================');
    console.log('🎉 FULL BROWSER INTEGRATION SUITE PASSED 100%');
    console.log('================================================================');
  } finally {
    await browser.close();
    await pool.end();
  }
}

runFullBrowserSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ BROWSER SUITE FAILED:', err);
    process.exit(1);
  });
