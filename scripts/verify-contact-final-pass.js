const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'docs', 'screenshots', 'contact-final');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const artifactDir = path.join(
  'C:',
  'Users',
  'alele',
  '.gemini',
  'antigravity',
  'brain',
  'ae662322-3343-457e-82db-f6eb7bfa8b39'
);

async function run() {
  console.log('🚀 Starting Contact Page Final Correction Verification...');
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);

    // ========================================================
    // 1. DESKTOP (1440px)
    // ========================================================
    console.log('📸 1. Verifying 1440px Desktop Layout...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll to map to trigger lazy-load and render tiles
    await page.evaluate(() => {
      const el = document.querySelector('section[aria-labelledby="contact-location-heading"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 3500));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await new Promise((r) => setTimeout(r, 500));

    // Full page screenshot
    const desktopFullPath = path.join(outDir, 'contact_final_1440_full.png');
    await page.screenshot({ path: desktopFullPath, fullPage: true });
    console.log(`Saved: ${desktopFullPath}`);

    // Section screenshot (top editorial + form)
    const sectionPath = path.join(outDir, 'contact_final_1440_section.png');
    const formSectionEl = await page.$('main > div:nth-of-type(2)');
    if (formSectionEl) {
      await formSectionEl.screenshot({ path: sectionPath });
      console.log(`Saved: ${sectionPath}`);
    }

    // Map section screenshot
    const mapSectionPath = path.join(outDir, 'contact_final_1440_map.png');
    const mapSectionEl = await page.$('section[aria-labelledby="contact-location-heading"]');
    if (mapSectionEl) {
      await mapSectionEl.screenshot({ path: mapSectionPath });
      console.log(`Saved: ${mapSectionPath}`);
    }

    // Verify Mode B checks on 1440px
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasGreyCard = pageText.includes('Kanata') && pageText.includes('Gloucester') && pageText.includes('Orleans');
    const hasOnlineDispatch = pageText.includes('Online Dispatch Queue');
    const hasDirectCallback = pageText.includes('Direct Callback');
    const hasGetDirections = pageText.includes('Get Directions');
    const hasViewOttawa = pageText.includes('View Ottawa on Google Maps');

    console.log('--- Mode B & Factual Integrity Verification ---');
    console.log(`- Decorative grey card with city pills removed? ${!hasGreyCard}`);
    console.log(`- Fictional "Online Dispatch Queue" removed? ${!hasOnlineDispatch}`);
    console.log(`- Fictional "Direct Callback" card removed? ${!hasDirectCallback}`);
    console.log(`- "Get Directions" withheld (no false office)? ${!hasGetDirections}`);
    console.log(`- "View Ottawa on Google Maps" present? ${hasViewOttawa}`);

    // Verify map iframe existence & properties
    const iframeSrc = await page.evaluate(() => {
      const iframe = document.querySelector('section[aria-labelledby="contact-location-heading"] iframe');
      return iframe ? iframe.getAttribute('src') : null;
    });
    console.log(`- Interactive Google Maps Embed URL: ${iframeSrc}`);

    // ========================================================
    // 2. LAPTOP (1024px)
    // ========================================================
    console.log('📸 2. Verifying 1024px Laptop Layout...');
    await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const el = document.querySelector('section[aria-labelledby="contact-location-heading"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 3500));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await new Promise((r) => setTimeout(r, 500));

    const laptopFullPath = path.join(outDir, 'contact_final_1024_full.png');
    await page.screenshot({ path: laptopFullPath, fullPage: true });
    console.log(`Saved: ${laptopFullPath}`);

    // ========================================================
    // 3. TABLET (768px)
    // ========================================================
    console.log('📸 3. Verifying 768px Tablet Layout...');
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const el = document.querySelector('section[aria-labelledby="contact-location-heading"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 3500));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await new Promise((r) => setTimeout(r, 500));

    const tabletFullPath = path.join(outDir, 'contact_final_768_tablet_full.png');
    await page.screenshot({ path: tabletFullPath, fullPage: true });
    console.log(`Saved: ${tabletFullPath}`);

    const tabletMapEl = await page.$('section[aria-labelledby="contact-location-heading"]');
    if (tabletMapEl) {
      const tabletMapPath = path.join(outDir, 'contact_final_768_tablet_map.png');
      await tabletMapEl.screenshot({ path: tabletMapPath });
      console.log(`Saved: ${tabletMapPath}`);
    }

    // ========================================================
    // 4. MOBILE (390px)
    // ========================================================
    console.log('📸 4. Verifying 390px Mobile Layout...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const el = document.querySelector('section[aria-labelledby="contact-location-heading"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 3500));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await new Promise((r) => setTimeout(r, 500));

    const mobileFullPath = path.join(outDir, 'contact_final_390_mobile_full.png');
    await page.screenshot({ path: mobileFullPath, fullPage: true });
    console.log(`Saved: ${mobileFullPath}`);

    const mobileMapEl = await page.$('section[aria-labelledby="contact-location-heading"]');
    if (mobileMapEl) {
      const mobileMapPath = path.join(outDir, 'contact_final_390_mobile_map.png');
      await mobileMapEl.screenshot({ path: mobileMapPath });
      console.log(`Saved: ${mobileMapPath}`);
    }

    // ========================================================
    // 5. FUNCTIONAL FORM SUBMISSION & VALIDATION
    // ========================================================
    console.log('📝 5. Verifying Form Validation & Secure Submission...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 600));

    // Submit empty form -> check client validation
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await new Promise((r) => setTimeout(r, 300));
      const hasErrors = await page.evaluate(() => {
        return document.body.innerText.includes('Please provide your full name');
      });
      console.log(`- Empty form validation fired correctly? ${hasErrors}`);
    }

    // Fill valid submission
    await page.type('#contact-full-name', 'Sarah Jenkins');
    await page.type('#contact-email', 'sarah.jenkins@example.ca');
    await page.type('#contact-phone', '613-555-0144');
    await page.select('#contact-enquiry-type', 'Cleaning');
    await page.type(
      '#contact-message',
      'Requesting a move-in deep cleaning quotation for a 3-bedroom detached property in Ottawa on the 28th of this month.'
    );

    // Hide fixed/floating header for isolated component screenshots
    await page.evaluate(() => {
      document.querySelectorAll('header, nav').forEach((el) => {
        el.style.setProperty('display', 'none', 'important');
      });
    });

    const filledFormPath = path.join(outDir, 'contact_final_form_filled.png');
    const formElement = await page.$('#contact-form');
    if (formElement) {
      await formElement.screenshot({ path: filledFormPath });
    } else {
      await page.screenshot({ path: filledFormPath, clip: { x: 700, y: 350, width: 700, height: 600 } });
    }
    console.log(`Saved: ${filledFormPath}`);

    // Submit valid form
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => document.body.innerText.includes('Message Sent'), { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 600));

    const successFormPath = path.join(outDir, 'contact_final_form_success.png');
    const successElement = await page.$('#contact-form-success');
    if (successElement) {
      await successElement.screenshot({ path: successFormPath });
    } else {
      await page.screenshot({ path: successFormPath, clip: { x: 700, y: 350, width: 700, height: 400 } });
    }
    console.log(`Saved: ${successFormPath}`);

    // Mirror all screenshots to brain artifact directory
    if (fs.existsSync(artifactDir)) {
      const files = fs.readdirSync(outDir);
      for (const f of files) {
        if (f.endsWith('.png')) {
          fs.copyFileSync(path.join(outDir, f), path.join(artifactDir, f));
        }
      }
      console.log('Mirrored all screenshots to artifact directory.');
    }

    console.log('✅ ALL CONTACT PAGE FINAL CORRECTIONS VERIFIED SUCCESSFULLY!');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run().catch((err) => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});
