const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'home-sections');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_1840', width: 1840, height: 1080 },
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'laptop_1024', width: 1024, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_390', width: 390, height: 844 },
];

async function verifyNewHomeSections() {
  console.log('Starting verification of new homepage sections...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // Multi-viewport captures of full homepage
  for (const vp of VIEWPORTS) {
    console.log(`Capturing Home at ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));

    const fn = `home_with_new_sections_${vp.name}_full.png`;
    const lp = path.join(DOCS_DIR, fn);
    const ap = path.join(ARTIFACT_DIR, fn);
    await page.screenshot({ path: lp, fullPage: true });
    fs.copyFileSync(lp, ap);
    console.log(`Saved ${fn}`);
  }

  // Desktop 1440px Detailed Section Captures & Interaction Tests
  console.log('Testing detailed section views on 1440px desktop...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));

  // 1. SECTION: WHEN PLANS OVERLAP
  const overlapSec = await page.$('#when-plans-overlap');
  if (overlapSec) {
    const fn = 'section_when_plans_overlap_1440.png';
    const lp = path.join(DOCS_DIR, fn);
    const ap = path.join(ARTIFACT_DIR, fn);
    await overlapSec.screenshot({ path: lp });
    fs.copyFileSync(lp, ap);
    console.log(`Saved ${fn}`);
  }

  // Test slider previous / next buttons
  const nextBtn = await page.$('#when-plans-overlap button[aria-label="Next situation"]');
  if (nextBtn) {
    await nextBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    console.log('Clicked next situation button.');
  }

  // 2. SECTION: REQUEST A QUOTE
  const quoteSec = await page.$('#request-a-quote');
  if (quoteSec) {
    const fn = 'section_request_quote_1440.png';
    const lp = path.join(DOCS_DIR, fn);
    const ap = path.join(ARTIFACT_DIR, fn);
    await quoteSec.screenshot({ path: lp });
    fs.copyFileSync(lp, ap);
    console.log(`Saved ${fn}`);
  }

  // Test primary CTA opening quote modal
  const quoteModalBtn = await page.$('#request-a-quote button');
  if (quoteModalBtn) {
    await quoteModalBtn.click();
    await new Promise((r) => setTimeout(r, 500));
    const fn = 'home_quote_modal_opened_1440.png';
    const lp = path.join(DOCS_DIR, fn);
    const ap = path.join(ARTIFACT_DIR, fn);
    await page.screenshot({ path: lp });
    fs.copyFileSync(lp, ap);
    console.log(`Saved ${fn}`);

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close modal"]');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // 3. SECTION: FREQUENTLY ASKED QUESTIONS
  const faqSec = await page.$('#faq');
  if (faqSec) {
    // Open second question
    const faqBtns = await page.$$('#faq button');
    if (faqBtns.length >= 2) {
      await faqBtns[1].click();
      await new Promise((r) => setTimeout(r, 400));
    }

    const fn = 'section_home_faq_1440.png';
    const lp = path.join(DOCS_DIR, fn);
    const ap = path.join(ARTIFACT_DIR, fn);
    await faqSec.screenshot({ path: lp });
    fs.copyFileSync(lp, ap);
    console.log(`Saved ${fn}`);
  }

  await browser.close();
  console.log('All homepage section verifications completed successfully!');
}

verifyNewHomeSections().catch((err) => {
  console.error('Verification Error:', err);
  process.exit(1);
});
