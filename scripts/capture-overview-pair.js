const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\d497e002-dfa4-4b96-ac78-93caf91a938e';

const prefix = process.argv[2] || 'before';

async function run() {
  console.log(`[Screenshot Capture]: Capturing overview-${prefix} screens...`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // 1. Authenticate
    console.log('Logging in...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', 'alelechi17@gmail.com');
    await page.type('#admin-password', 'UniquePro2025');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);
    console.log('Logged in successfully.');

    // 2. Desktop
    console.log('Capturing Desktop 1440x900...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500)); // allow charts to render
    const desktopPath = path.join(ARTIFACT_DIR, `overview-${prefix}-desktop.png`);
    await page.screenshot({ path: desktopPath, fullPage: false });
    console.log(`Saved: ${desktopPath}`);

    // 3. Mobile
    console.log('Capturing Mobile 390x844...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500));
    const mobilePath = path.join(ARTIFACT_DIR, `overview-${prefix}-mobile.png`);
    await page.screenshot({ path: mobilePath, fullPage: false });
    console.log(`Saved: ${mobilePath}`);

    console.log('Capture completed successfully.');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Capture error:', err);
  process.exit(1);
});
