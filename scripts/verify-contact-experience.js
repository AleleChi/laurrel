const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'docs', 'screenshots', 'contact');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runVerification() {
  console.log('🚀 Starting Contact Page & Section Verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const viewports = [
    { name: 'desktop_1840', width: 1840, height: 1100 },
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'laptop_1024', width: 1024, height: 800 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  // 1. Capture Contact Page across viewports
  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 600));

    // Full page screenshot
    const fullPath = path.join(outDir, `contact_page_${vp.name}_full.png`);
    await page.screenshot({ path: fullPath, fullPage: true });
    console.log(`📸 Captured: ${fullPath}`);

    // If 1440, also capture the main contact section specifically
    if (vp.name === 'desktop_1440') {
      const sectionEl = await page.$('main > div:nth-of-type(2)');
      if (sectionEl) {
        const sectionPath = path.join(outDir, `contact_section_1440.png`);
        await sectionEl.screenshot({ path: sectionPath });
        console.log(`📸 Captured Section: ${sectionPath}`);
      }
    }
  }

  // 2. Test Form Submission on /contact
  console.log('📝 Testing Contact Form Submission on /contact...');
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/contact', { waitUntil: 'networkidle2' });

  await page.type('#contact-full-name', 'Eleanor Vance');
  await page.type('#contact-email', 'eleanor.vance@example.ca');
  await page.type('#contact-phone', '613-555-0144');

  // Select 'Moving'
  const movingBtn = await page.evaluateHandle(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.find(b => b.innerText.trim() === 'Moving');
  });
  if (movingBtn && movingBtn.click) {
    await movingBtn.click();
  }

  await page.type('#contact-message', 'We are preparing for a move across Ottawa next month and will need packing assistance and a safe move for several fragile items.');

  const formBeforePath = path.join(outDir, `contact_form_filled_1440.png`);
  await page.screenshot({ path: formBeforePath });
  console.log(`📸 Captured Filled Form: ${formBeforePath}`);

  // Submit form
  const submitBtn = await page.$('button[type="submit"]');
  await submitBtn.click();

  // Wait for submission response
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Message Sent');
  }, { timeout: 8000 });

  await new Promise(r => setTimeout(r, 500));
  const formSuccessPath = path.join(outDir, `contact_form_success_1440.png`);
  await page.screenshot({ path: formSuccessPath });
  console.log(`📸 Captured Form Success: ${formSuccessPath}`);

  // 3. Test Homepage Contact Section
  console.log('🏠 Testing Homepage Contact Section...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 600));

  const homeContactSection = await page.$('#contact');
  if (homeContactSection) {
    const homeSectionPath = path.join(outDir, `homepage_contact_section_1440.png`);
    await homeContactSection.screenshot({ path: homeSectionPath });
    console.log(`📸 Captured Homepage Contact Section: ${homeSectionPath}`);
  }

  // Test Request a Quote button in Homepage Contact Section
  console.log('💬 Testing Request a Quote button in Homepage Contact Section...');
  const quoteBtnInContact = await page.evaluateHandle(() => {
    const section = document.getElementById('contact');
    if (!section) return null;
    const btns = Array.from(section.querySelectorAll('button'));
    return btns.find(b => b.innerText.includes('Request a Quote'));
  });

  if (quoteBtnInContact && quoteBtnInContact.click) {
    await quoteBtnInContact.click();
    await new Promise(r => setTimeout(r, 600));

    // Verify modal is open
    const modalVisible = await page.evaluate(() => {
      return document.body.innerText.includes('Tell us what needs doing');
    });
    console.log(`Modal opened: ${modalVisible}`);

    const modalPath = path.join(outDir, `homepage_quote_modal_opened_from_contact.png`);
    await page.screenshot({ path: modalPath });
    console.log(`📸 Captured Quote Modal: ${modalPath}`);
  }

  // 4. Test Mobile Homepage Contact Section
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000#contact', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  const mobileHomeContact = await page.$('#contact');
  if (mobileHomeContact) {
    const mobileHomePath = path.join(outDir, `homepage_contact_section_mobile_390.png`);
    await mobileHomeContact.screenshot({ path: mobileHomePath });
    console.log(`📸 Captured Mobile Homepage Contact: ${mobileHomePath}`);
  }

  await browser.close();
  console.log('✅ All Contact verification tasks completed successfully.');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
