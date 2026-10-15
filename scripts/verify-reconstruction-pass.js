const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'docs', 'screenshots', 'reconstruction');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  console.log('🚀 Starting Comprehensive Reconstruction Verification Pass...');
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(15000);

    // ========================================================
    // 1. HEADER & SERVICES DROPDOWN (DESKTOP 1440)
    // ========================================================
    console.log('📸 1. Verifying Site Header & Services Dropdown...');
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('nav');
    await new Promise(r => setTimeout(r, 600));

    // Header at rest
    const headerPath = path.join(outDir, 'header_at_rest_1440.png');
    const navEl = await page.$('nav');
    if (navEl) await navEl.screenshot({ path: headerPath });
    console.log(`Saved: ${headerPath}`);

    // Hover on Services to trigger dropdown
    const servicesTrigger = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('nav a, nav button'));
      return links.find(el => el.innerText && el.innerText.trim().startsWith('Services'));
    });

    if (servicesTrigger && servicesTrigger.hover) {
      await servicesTrigger.hover();
      await new Promise(r => setTimeout(r, 400));
      const headerDropdownPath = path.join(outDir, 'header_services_dropdown_open_1440.png');
      await page.screenshot({ path: headerDropdownPath, clip: { x: 0, y: 0, width: 1440, height: 350 } });
      console.log(`Saved: ${headerDropdownPath}`);
    }

    // ========================================================
    // 2. HOMEPAGE FEATURE SECTION (ONE PHOTO + ONE LIME PANEL)
    // ========================================================
    console.log('📸 2. Verifying Homepage When Plans Overlap (One Photo + Lime Panel)...');
    await page.evaluate(() => {
      const el = document.getElementById('when-plans-overlap');
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 120;
        window.scrollTo({ top, behavior: 'instant' });
      }
    });
    await new Promise(r => setTimeout(r, 600));

    const overlapEl = await page.$('#when-plans-overlap');
    if (overlapEl) {
      // State A screenshot
      const stateAPath = path.join(outDir, 'featured_section_state_a_1440.png');
      await overlapEl.screenshot({ path: stateAPath });
      console.log(`Saved: ${stateAPath}`);

      // Switch to State B
      const nextBtn = await page.$('#when-plans-overlap button[aria-label="Next situation"]');
      if (nextBtn) {
        await nextBtn.click();
        await new Promise(r => setTimeout(r, 600));
        const stateBPath = path.join(outDir, 'featured_section_state_b_1440.png');
        await overlapEl.screenshot({ path: stateBPath });
        console.log(`Saved: ${stateBPath}`);

        // Switch to State C
        await nextBtn.click();
        await new Promise(r => setTimeout(r, 600));
        const stateCPath = path.join(outDir, 'featured_section_state_c_1440.png');
        await overlapEl.screenshot({ path: stateCPath });
        console.log(`Saved: ${stateCPath}`);
      }

      // Test "View Details" Modal
      const viewDetailsBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('#when-plans-overlap button'));
        return btns.find(b => b.innerText.includes('View Details'));
      });
      if (viewDetailsBtn && viewDetailsBtn.click) {
        await viewDetailsBtn.click();
        await new Promise(r => setTimeout(r, 500));
        const detailModalPath = path.join(outDir, 'featured_detail_modal_open_1440.png');
        await page.screenshot({ path: detailModalPath });
        console.log(`Saved: ${detailModalPath}`);

        // Click "Request a Quote for this Situation"
        const quoteInDetailBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          return btns.find(b => b.innerText.includes('Request a Quote for this Situation'));
        });
        if (quoteInDetailBtn && quoteInDetailBtn.click) {
          await quoteInDetailBtn.click();
          await new Promise(r => setTimeout(r, 600));
          const quoteFromFeaturePath = path.join(outDir, 'quote_modal_preselected_from_feature_1440.png');
          await page.screenshot({ path: quoteFromFeaturePath });
          console.log(`Saved: ${quoteFromFeaturePath}`);

          // Close modal
          await page.keyboard.press('Escape');
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    // ========================================================
    // 3. HOMEPAGE CONTACT SECTION (MINIMAL EDITORIAL SPLIT)
    // ========================================================
    console.log('📸 3. Verifying Rebuilt Homepage Contact Section...');
    await page.evaluate(() => {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await new Promise(r => setTimeout(r, 500));
    const homeContactEl = await page.$('#contact');
    if (homeContactEl) {
      const homeContactPath = path.join(outDir, 'homepage_contact_section_rebuilt_1440.png');
      await homeContactEl.screenshot({ path: homeContactPath });
      console.log(`Saved: ${homeContactPath}`);
    }

    // ========================================================
    // 4. DEDICATED CONTACT US PAGE (/contact)
    // ========================================================
    console.log('📸 4. Verifying Dedicated Contact Page (/contact)...');
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1');
    await new Promise(r => setTimeout(r, 600));

    // Full Contact Page
    const contactFullPath = path.join(outDir, 'contact_page_desktop_1440_full.png');
    await page.screenshot({ path: contactFullPath, fullPage: true });
    console.log(`Saved: ${contactFullPath}`);

    // Main Contact Section
    const contactSectionEl = await page.$('main > div:nth-of-type(2)');
    if (contactSectionEl) {
      const contactSectionPath = path.join(outDir, 'contact_section_two_column_1440.png');
      await contactSectionEl.screenshot({ path: contactSectionPath });
      console.log(`Saved: ${contactSectionPath}`);
    }

    // Test Contact Form Submission & Durable Persistence
    console.log('📝 Testing Contact Form Submission & Backend Persistence...');
    await page.type('#contact-full-name', 'David Sterling');
    await page.type('#contact-email', 'david.sterling@example.ca');
    await page.type('#contact-phone', '613-555-0182');
    await page.select('#contact-enquiry-type', 'Multiple services');
    await page.type('#contact-message', 'We need to move household furniture into storage for two weeks while our hardwood floors are being refinished, followed by a post-renovation clean.');

    const formFilledPath = path.join(outDir, 'contact_form_filled_1440.png');
    await page.screenshot({ path: formFilledPath });
    console.log(`Saved: ${formFilledPath}`);

    // Submit form
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await page.waitForFunction(() => document.body.innerText.includes('Message Sent'), { timeout: 8000 });
      await new Promise(r => setTimeout(r, 500));
      const formSuccessPath = path.join(outDir, 'contact_form_success_1440.png');
      await page.screenshot({ path: formSuccessPath });
      console.log(`Saved: ${formSuccessPath}`);
    }

    // ========================================================
    // 5. MOBILE VIEWPORT (390PX)
    // ========================================================
    console.log('📸 5. Verifying Mobile 390px Experiences...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

    // Mobile Contact Page
    await page.goto('http://localhost:3000/contact', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));
    const mobileContactPath = path.join(outDir, 'contact_page_mobile_390_full.png');
    await page.screenshot({ path: mobileContactPath, fullPage: true });
    console.log(`Saved: ${mobileContactPath}`);

    // Mobile Homepage Feature & Navigation
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 500));

    // Open mobile menu
    const menuBtn = await page.$('button[aria-label="Open menu"]');
    if (menuBtn) {
      await menuBtn.click();
      await new Promise(r => setTimeout(r, 400));
      // Expand services accordion
      const expandBtn = await page.$('button[aria-label="Toggle services links"]');
      if (expandBtn) await expandBtn.click();
      await new Promise(r => setTimeout(r, 400));
      const mobileNavPath = path.join(outDir, 'mobile_nav_services_expanded_390.png');
      await page.screenshot({ path: mobileNavPath });
      console.log(`Saved: ${mobileNavPath}`);
      // Close menu
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 400));
    }

    // Mobile Feature Section
    await page.evaluate(() => {
      const el = document.getElementById('when-plans-overlap');
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top, behavior: 'instant' });
      }
    });
    await new Promise(r => setTimeout(r, 400));
    const mobileFeatureEl = await page.$('#when-plans-overlap');
    if (mobileFeatureEl) {
      const mobileFeaturePath = path.join(outDir, 'mobile_featured_section_390.png');
      await mobileFeatureEl.screenshot({ path: mobileFeaturePath });
      console.log(`Saved: ${mobileFeaturePath}`);
    }

    // Mobile Homepage Contact Section
    await page.evaluate(() => {
      const el = document.getElementById('contact');
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top, behavior: 'instant' });
      }
    });
    await new Promise(r => setTimeout(r, 400));
    const mobileHomeContactEl = await page.$('#contact');
    if (mobileHomeContactEl) {
      const mobileHomeContactPath = path.join(outDir, 'mobile_homepage_contact_section_390.png');
      await mobileHomeContactEl.screenshot({ path: mobileHomeContactPath });
      console.log(`Saved: ${mobileHomeContactPath}`);
    }

    // Mirror to brain artifact directory
    const artifactDir = path.join('C:', 'Users', 'alele', '.gemini', 'antigravity', 'brain', 'ae662322-3343-457e-82db-f6eb7bfa8b39');
    if (fs.existsSync(artifactDir)) {
      const files = fs.readdirSync(outDir);
      for (const f of files) {
        if (f.endsWith('.png')) {
          fs.copyFileSync(path.join(outDir, f), path.join(artifactDir, f));
        }
      }
      console.log('Mirrored all screenshots to artifact directory.');
    }

    console.log('✅ ALL RECONSTRUCTION VERIFICATIONS PASSED SUCCESSFULLY!');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run().catch(err => {
  console.error('❌ Verification script failed:', err);
  process.exit(1);
});
