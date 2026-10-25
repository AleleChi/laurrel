const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\d497e002-dfa4-4b96-ac78-93caf91a938e';

async function run() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — CAPTURING PREMIUM TABLES, FORMS & AUTH SCREENSHOTS');
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
    await new Promise((r) => setTimeout(r, 900));
    const dest = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: dest, fullPage });
    console.log(`📸 Saved: ${filename} (${viewport.width}x${viewport.height})`);
    return dest;
  };

  try {
    // -------------------------------------------------------------------------
    // 1. LOGIN SCREEN (Desktop 1440x900 & Mobile 390x844)
    // -------------------------------------------------------------------------
    console.log('1. Capturing Redesigned Login (Stexo geometric + Dribbble surface)...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await take('checkpoint-a-01-login-desktop.png', { width: 1440, height: 900 });
    await take('checkpoint-a-01-login-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // -------------------------------------------------------------------------
    // 2. FORGOT PASSWORD (Desktop 1440x900 & Mobile 390x844)
    // -------------------------------------------------------------------------
    console.log('\n2. Capturing Redesigned Forgot Password...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/forgot-password', { waitUntil: 'networkidle0' });
    await take('checkpoint-a-02-forgot-password-desktop.png', { width: 1440, height: 900 });
    await take('checkpoint-a-02-forgot-password-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // -------------------------------------------------------------------------
    // 3. RESET PASSWORD (Desktop 1440x900 & Mobile 390x844)
    // -------------------------------------------------------------------------
    console.log('\n3. Capturing Redesigned Reset Password with Token...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/reset-password?token=sample_demo_token_for_review_123', {
      waitUntil: 'networkidle0',
    });
    await take('checkpoint-b-01-reset-password-desktop.png', { width: 1440, height: 900 });
    await take('checkpoint-b-01-reset-password-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // -------------------------------------------------------------------------
    // 4. AUTHENTICATE FOR ADMIN WORKSPACE
    // -------------------------------------------------------------------------
    console.log('\nAuthenticating as owner administrator...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', 'alelechi17@gmail.com');
    await page.type('#admin-password', 'UniquePro2025');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);
    console.log('✅ Authenticated successfully.');

    // -------------------------------------------------------------------------
    // 5. CUSTOMER ENQUIRIES TABLE & TOOLBAR
    // -------------------------------------------------------------------------
    console.log('\n5. Capturing Customer Enquiries Table & Toolbar...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr', { timeout: 6000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1200));
    await take('checkpoint-a-03-enquiries-table-desktop.png', { width: 1440, height: 900 });
    await take('checkpoint-a-03-enquiries-table-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // -------------------------------------------------------------------------
    // 6. ENQUIRY DETAIL DRAWER WITH CONSULTATION SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n6. Opening Enquiry Drawer and capturing Consultation details...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('tbody tr', { timeout: 6000 }).catch(() => {});

    const firstRow = await page.$('tbody tr');
    if (firstRow) {
      await firstRow.click();
      await new Promise((r) => setTimeout(r, 1800));
      await take('checkpoint-a-04-enquiry-drawer-desktop.png', { width: 1440, height: 900 });

      // Scroll drawer down to show Scheduled Consultations and cancellation action
      await page.evaluate(() => {
        const scrollElem = document.querySelector('div.overflow-y-auto');
        if (scrollElem) scrollElem.scrollTop = 380;
      });
      await new Promise((r) => setTimeout(r, 800));
      await take('checkpoint-a-04b-consultation-details-drawer.png', { width: 1440, height: 900 });

      // -----------------------------------------------------------------------
      // 7. SCHEDULE MEETING MODAL
      // -----------------------------------------------------------------------
      console.log('\n7. Opening Schedule Meeting Modal from Drawer...');
      const scheduleBtn = await page.evaluateHandle(() => {
        return Array.from(document.querySelectorAll('button')).find((b) =>
          b.innerText.includes('Schedule Meeting')
        );
      });

      if (scheduleBtn && scheduleBtn.asElement()) {
        await scheduleBtn.asElement().click();
        await new Promise((r) => setTimeout(r, 1500));
        await take('checkpoint-a-05-schedule-modal-desktop.png', { width: 1440, height: 900 });
      }
    }

    // -------------------------------------------------------------------------
    // 8. APPOINTMENTS TABLE & AGENDA (Desktop & Mobile)
    // -------------------------------------------------------------------------
    console.log('\n8. Capturing Appointments Table & Agenda...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/appointments', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await take('checkpoint-b-02-appointments-table-desktop.png', { width: 1440, height: 900 });
    await take('checkpoint-b-02-appointments-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // -------------------------------------------------------------------------
    // 9. WEBSITE CONTENT (CMS Table)
    // -------------------------------------------------------------------------
    console.log('\n9. Capturing Website Content Table...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/website', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await take('checkpoint-b-03-website-cms-desktop.png', { width: 1440, height: 900 });

    // -------------------------------------------------------------------------
    // 10. MEDIA LIBRARY (Grid & Table List View)
    // -------------------------------------------------------------------------
    console.log('\n10. Capturing Media Library...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/media', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 1200));
    await take('checkpoint-b-04-media-library-desktop.png', { width: 1440, height: 900 });

    console.log('\n🎉 ALL CHECKPOINT A & B SCREENSHOTS CAPTURED SUCCESSFULLY!');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Capture script error:', err);
  process.exit(1);
});
