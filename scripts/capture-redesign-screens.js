const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\d497e002-dfa4-4b96-ac78-93caf91a938e';

async function run() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — REFINING SCREENSHOTS WITH COMPLETE DATA RENDERING');
  console.log('========================================================================\n');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const take = async (filename, viewport, fullPage = false) => {
    await page.setViewport(viewport);
    await new Promise((r) => setTimeout(r, 800));
    const dest = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: dest, fullPage });
    console.log(`📸 Saved: ${filename} (${viewport.width}x${viewport.height})`);
    return dest;
  };

  try {
    // 1. Authenticate
    console.log('Logging in as owner administrator...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', 'alelechi17@gmail.com');
    await page.type('#admin-password', 'UniquePro2025');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);
    console.log('✅ Authenticated successfully.');

    // 2. Mobile Overview (with full data wait)
    console.log('Capturing Mobile Overview...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500));
    await take('redesign-05-overview-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // 3. Mobile Enquiries (with full data wait)
    console.log('Capturing Mobile Enquiries...');
    await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr', { timeout: 6000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    await take('redesign-08-enquiries-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // 4. Mobile Appointments (with full data wait)
    console.log('Capturing Mobile Appointments...');
    await page.goto('http://localhost:3000/admin/appointments', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500));
    await take('redesign-11-appointments-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    console.log('\n🎉 ALL REFINED MOBILE SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
