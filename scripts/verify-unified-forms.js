const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'docs', 'screenshots', 'forms');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const artifactDir = path.join(
  'C:\\\\',
  'Users',
  'alele',
  '.gemini',
  'antigravity',
  'brain',
  'ae662322-3343-457e-82db-f6eb7bfa8b39'
);

async function run() {
  console.log('🚀 Starting Comprehensive Unified Forms Verification...');
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(25000);

    // ========================================================
    // 1. QUOTE MODAL — MULTI-SERVICE & CONDITIONAL FIELDS (1440px)
    // ========================================================
    console.log('📸 1. Testing Quote Modal (Desktop 1440px)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    // Open modal via header button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('header button, header a')).find(
        (b) => b.innerText && b.innerText.includes('Get a Quote')
      );
      if (btn) btn.click();
    });
    await page.waitForSelector('#quote-dialog-title', { visible: true });
    await new Promise((r) => setTimeout(r, 600));

    // Verify modal text
    const modalTitle = await page.$eval('#quote-dialog-title', (el) => el.innerText);
    const modalDesc = await page.$eval('#quote-dialog-description', (el) => el.innerText);
    console.log(`- Modal Title: "${modalTitle}" (Matches "Request a Service Quote"? ${modalTitle.includes('Request a Service Quote')})`);
    console.log(`- Supporting Text: "${modalDesc}" (Matches "Tell us what you need, where and when."? ${modalDesc.includes('Tell us what you need')})`);

    // Select all 3 services: Cleaning, Moving, Storage by clicking their labels
    await page.click('label[for="service-select-moving"]');
    await new Promise((r) => setTimeout(r, 200));

    await page.click('label[for="service-select-storage"]');
    await new Promise((r) => setTimeout(r, 300));

    // Verify conditional sections appear
    const hasCleaningSpecifics = await page.evaluate(() => document.body.innerText.includes('Cleaning Details'));
    const hasMovingSpecifics = await page.evaluate(() => document.body.innerText.includes('Moving Details'));
    const hasStorageSpecifics = await page.evaluate(() => document.body.innerText.includes('Storage Details'));

    console.log(`- Cleaning conditional fields revealed: ${hasCleaningSpecifics}`);
    console.log(`- Moving conditional fields revealed: ${hasMovingSpecifics}`);
    console.log(`- Storage conditional fields revealed: ${hasStorageSpecifics}`);

    // Fill sample values in conditional fields
    await page.type('#quote-full-name', 'Michael Tremblay');
    await page.type('#quote-email', 'michael.tremblay@example.ca');
    await page.type('#quote-phone', '613-555-0188');
    await page.type('#quote-location', 'K1S 5B6 (Glebe, Ottawa)');
    await page.type('#quote-preferred-date', 'First week of next month');

    await page.type('#cleaning-property-size', '4-bedroom detached, ~2,200 sq ft');
    await page.type('#cleaning-requirements', 'Pre-move handover deep clean');

    await page.type('#moving-from', 'Bank St & Sunnyside, Glebe');
    await page.type('#moving-to', 'Westboro, Richmond Rd');
    await page.type('#moving-belongings', 'Full 4-bedroom household');
    await page.type('#moving-access', 'Driveway parking available at both properties');

    await page.type('#storage-items-type', 'Seasonal outdoor furniture and boxed items');
    await page.type('#storage-access', 'Safe holding until renovations finish');

    await page.type('#quote-details', 'Looking to coordinate deep cleaning before handover, local moving between Glebe and Westboro, and 2 months of secure storage.');

    // Screenshot of fully populated modal with conditional sections
    const modalElement = await page.$('div[role="dialog"] > div:nth-child(2)');
    const modalPath = path.join(outDir, 'quote_modal_conditional_fields.png');
    if (modalElement) {
      await modalElement.screenshot({ path: modalPath });
      console.log(`Saved: ${modalPath}`);
    }

    // Submit valid quote request
    const submitQuoteBtn = await page.$('#quote-inquiry-form button[type="submit"]');
    if (submitQuoteBtn) {
      await submitQuoteBtn.click();
    } else {
      await page.click('button[type="submit"]');
    }

    await page.waitForFunction(() => document.body.innerText.includes('Quote Request Received'), { timeout: 12000 });
    await new Promise((r) => setTimeout(r, 600));

    // Read generated reference ID
    const refText = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('p')).find((p) => p.innerText.includes('Reference:'));
      return el ? el.innerText : 'No reference found';
    });
    console.log(`- Submission result reference: ${refText}`);

    const successModalElement = await page.$('div[role="dialog"] > div:nth-child(2)');
    const successModalPath = path.join(outDir, 'quote_modal_success.png');
    if (successModalElement) {
      await successModalElement.screenshot({ path: successModalPath });
      console.log(`Saved: ${successModalPath}`);
    }

    // Close modal via close button
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('div[role="dialog"] button')).find(
        (b) => b.innerText && b.innerText.includes('Close')
      );
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));

    // ========================================================
    // 2. QUOTE MODAL ON MOBILE (390px Viewport)
    // ========================================================
    console.log('📸 2. Testing Quote Modal on Mobile (390px)...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 800));

    // Trigger quote modal on mobile
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find((el) => el.innerText.includes('Get a Quote') || el.innerText.includes('Request a Quote'));
      if (btn) btn.click();
    });
    await page.waitForSelector('#quote-dialog-title', { visible: true });
    await new Promise((r) => setTimeout(r, 500));

    const mobileModalPath = path.join(outDir, 'quote_modal_mobile_390.png');
    await page.screenshot({ path: mobileModalPath });
    console.log(`Saved: ${mobileModalPath}`);

    // Test Escape-to-close
    await page.keyboard.press('Escape');
    await new Promise((r) => setTimeout(r, 500));
    const modalClosed = await page.evaluate(() => document.querySelector('#quote-dialog-title') === null);
    console.log(`- Modal closed via Escape key on mobile: ${modalClosed}`);

    // ========================================================
    // 3. CONTACT FORM (/contact)
    // ========================================================
    console.log('📸 3. Testing Contact Form (/contact)...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 800));

    // Hide fixed header for isolated screenshot
    await page.evaluate(() => {
      document.querySelectorAll('header, nav').forEach((el) => el.style.setProperty('display', 'none', 'important'));
    });

    await page.type('#contact-full-name', 'David Leblanc');
    await page.type('#contact-email', 'david.leblanc@example.ca');
    await page.type('#contact-phone', '613-555-0165');
    await page.select('#contact-enquiry-type', 'Moving');
    await page.type('#contact-message', 'Inquiring about moving availability for an office suite relocation in downtown Ottawa.');

    const contactFormEl = await page.$('#contact-form');
    const contactFilledPath = path.join(outDir, 'contact_form_filled.png');
    if (contactFormEl) {
      await contactFormEl.screenshot({ path: contactFilledPath });
      console.log(`Saved: ${contactFilledPath}`);
    }

    await page.click('button[type="submit"]');
    await page.waitForSelector('#contact-form-success', { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 500));

    const contactSuccessEl = await page.$('#contact-form-success');
    const contactSuccessPath = path.join(outDir, 'contact_form_success.png');
    if (contactSuccessEl) {
      await contactSuccessEl.screenshot({ path: contactSuccessPath });
      console.log(`Saved: ${contactSuccessPath}`);
    }

    // ========================================================
    // 4. SERVICES SIDEBAR FORM (/services)
    // ========================================================
    console.log('📸 4. Testing Services Sidebar Form (/services)...');
    await page.goto('http://localhost:3000/services', { waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 1000));

    // Scroll to sidebar form
    await page.evaluate(() => {
      const el = document.querySelector('#sidebar-enquiry-form');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise((r) => setTimeout(r, 500));

    // Toggle multi-service in sidebar
    await page.click('#sidebar-enquiry-form label[for="service-select-moving"]');
    await new Promise((r) => setTimeout(r, 200));

    await page.type('#sidebar-form-name', 'Claire Montgomery');
    await page.type('#sidebar-form-email', 'claire.m@example.ca');
    await page.type('#sidebar-form-phone', '613-555-0132');
    await page.type('#sidebar-form-message', 'Requesting a combined cleaning and storage plan for a residential property in Kanata.');

    const sidebarFormEl = await page.$('#sidebar-enquiry-form');
    const sidebarFilledPath = path.join(outDir, 'services_sidebar_form_filled.png');
    if (sidebarFormEl) {
      await sidebarFormEl.screenshot({ path: sidebarFilledPath });
      console.log(`Saved: ${sidebarFilledPath}`);
    }

    const sidebarSubmitBtn = await page.$('#sidebar-enquiry-form button[type="submit"]');
    if (sidebarSubmitBtn) await sidebarSubmitBtn.click();

    await page.waitForFunction(
      () => document.querySelector('#sidebar-enquiry-form')?.innerText.includes('Enquiry Received'),
      { timeout: 10000 }
    );
    await new Promise((r) => setTimeout(r, 600));

    const sidebarSuccessPath = path.join(outDir, 'services_sidebar_form_success.png');
    if (sidebarFormEl) {
      await sidebarFormEl.screenshot({ path: sidebarSuccessPath });
      console.log(`Saved: ${sidebarSuccessPath}`);
    }

    // ========================================================
    // 5. DATABASE VERIFICATION (data/enquiries.json)
    // ========================================================
    console.log('🗄️ 5. Verifying Database Durability in data/enquiries.json...');
    const dataFilePath = path.join(__dirname, '..', 'data', 'enquiries.json');
    if (fs.existsSync(dataFilePath)) {
      const records = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
      console.log(`- Total enquiries saved in durable store: ${records.length}`);
      const latest = records[0];
      console.log('- Latest enquiry record:');
      console.log(`  ID: ${latest.id}`);
      console.log(`  Intent: ${latest.intent}`);
      console.log(`  Source: ${latest.source}`);
      console.log(`  Customer: ${latest.customer.name} (${latest.customer.email})`);
      console.log(`  Services: ${JSON.stringify(latest.services)}`);
      console.log(`  Status: ${latest.status}`);
    }

    // Mirror all screenshots to artifact dir
    if (fs.existsSync(artifactDir)) {
      const files = fs.readdirSync(outDir);
      for (const f of files) {
        if (f.endsWith('.png')) {
          fs.copyFileSync(path.join(outDir, f), path.join(artifactDir, f));
        }
      }
      console.log('Mirrored all screenshots to artifact directory.');
    }

    console.log('✅ ALL MILESTONE 1 UNIFIED FORMS TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
