const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\d497e002-dfa4-4b96-ac78-93caf91a938e';

async function run() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — CAPTURING REDESIGNED ADMIN INTERFACE SCREENSHOTS');
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
    // 1. Login Desktop & Mobile
    console.log('Capturing Login & Forgot Password screens...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await take('redesign-01-login-desktop.png', { width: 1440, height: 900 });
    await take('redesign-02-login-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/forgot-password', { waitUntil: 'networkidle0' });
    await take('redesign-03-forgot-password-desktop.png', { width: 1440, height: 900 });

    // 2. Authenticate
    console.log('\nLogging in as owner administrator...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', 'alelechi17@gmail.com');
    await page.type('#admin-password', 'UniquePro2025');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);
    console.log('✅ Authenticated successfully.');

    // 3. Overview Desktop
    console.log('\nCapturing Overview Desktop with 60-day calendar chart...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500)); // allow Recharts to animate
    await take('redesign-04-overview-desktop.png', { width: 1440, height: 900 });

    // 4. Overview Mobile
    console.log('Capturing Overview Mobile...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2500));
    await take('redesign-05-overview-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // 5. Customer Enquiries List Desktop
    console.log('\nCapturing Customer Enquiries List Desktop...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr', { timeout: 6000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));
    await take('redesign-06-enquiries-list-desktop.png', { width: 1440, height: 900 });

    // 6. Enquiry Drawer Open Desktop
    console.log('Opening Enquiry Drawer and capturing Desktop...');
    const firstRow = await page.$('tbody tr:first-child');
    if (firstRow) {
      await firstRow.click();
      await new Promise((r) => setTimeout(r, 1200));
      await take('redesign-07-enquiry-drawer-desktop.png', { width: 1440, height: 900 });

      // 7. Schedule Modal from Drawer
      console.log('Opening Schedule Modal from Drawer and capturing Desktop...');
      const scheduleBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find((b) =>
          b.innerText.includes('Schedule Meeting')
        );
      });
      if (scheduleBtn && scheduleBtn.asElement()) {
        await scheduleBtn.asElement().click();
        await new Promise((r) => setTimeout(r, 1000));
        await take('redesign-10-schedule-modal-desktop.png', { width: 1440, height: 900 });
      }
    }

    // 8. Customer Enquiries Mobile
    console.log('Capturing Customer Enquiries Mobile...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr', { timeout: 6000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    await take('redesign-08-enquiries-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // 9. Appointments & Consultations Desktop
    console.log('\nCapturing Appointments Desktop...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/appointments', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await take('redesign-09-appointments-desktop.png', { width: 1440, height: 900 });

    // 10. Appointments Mobile
    console.log('Capturing Appointments Mobile...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/admin/appointments', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));
    await take('redesign-11-appointments-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // 11. Website CMS Desktop
    console.log('\nCapturing Website CMS Desktop...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/website', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await take('redesign-12-website-cms-desktop.png', { width: 1440, height: 900 });

    // 12. Media Library Desktop
    console.log('Capturing Media Library Desktop...');
    await page.goto('http://localhost:3000/admin/media', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1500));
    await take('redesign-13-media-library-desktop.png', { width: 1440, height: 900 });

    console.log('\n🎉 ALL 13 REDESIGN SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
