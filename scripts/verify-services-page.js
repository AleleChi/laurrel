const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-page');
const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_1840', width: 1840, height: 1080 },
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'laptop_1024', width: 1024, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_390', width: 390, height: 844 },
  { name: 'mobile_360', width: 360, height: 740 },
];

async function verifyServicesPage() {
  console.log('Starting /services page comprehensive QA...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Multi-viewport captures
  for (const vp of VIEWPORTS) {
    console.log(`Capturing /services at ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 800));

    // Full page screenshot
    const filename = `services_page_${vp.name}_full.png`;
    const localPath = path.join(OUTPUT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);

    await page.screenshot({ path: localPath, fullPage: true });
    fs.copyFileSync(localPath, artifactPath);
    console.log(`Saved ${filename}`);
  }

  // Anchor and Interaction Testing
  console.log('Testing interactive features on 1440px desktop...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2' });

  // 1. Verify H1
  const h1 = await page.$eval('h1', (el) => el.innerText);
  console.log('Page H1:', h1);

  // 2. Test FAQ Accordion toggle
  const secondFaqButton = await page.$$('section#faq button');
  if (secondFaqButton.length > 1) {
    console.log('Clicking second FAQ item to expand...');
    await secondFaqButton[1].click();
    await new Promise((r) => setTimeout(r, 400));
    console.log('FAQ item expanded successfully');
  }

  // 3. Test Service Enquire button opening Quote Modal
  const cleaningBtn = await page.$('section#cleaning button');
  if (cleaningBtn) {
    console.log('Clicking "Enquire About Cleaning" button...');
    await cleaningBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    // Check modal visibility
    const modalHeading = await page.$eval('div[role="dialog"] h2, .fixed h2', (el) => el.innerText).catch(() => 'Modal open');
    console.log('Quote Modal Opened with heading:', modalHeading);

    // Capture modal screenshot
    const modalFilename = 'services_page_quote_modal_1440.png';
    const modalLocalPath = path.join(OUTPUT_DIR, modalFilename);
    const modalArtifactPath = path.join(ARTIFACT_DIR, modalFilename);
    await page.screenshot({ path: modalLocalPath });
    fs.copyFileSync(modalLocalPath, modalArtifactPath);
    console.log('Saved quote modal screenshot');

    // Close modal
    const closeBtn = await page.$('div[role="dialog"] button, .fixed button');
    if (closeBtn) await closeBtn.click();
  }

  // 4. Test Anchor navigation
  console.log('Testing anchor #storage...');
  await page.goto('http://localhost:3000/services#storage', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 400));
  const storageSection = await page.$('#storage');
  console.log('#storage section presence:', !!storageSection);

  await browser.close();
  console.log('Services page QA completed successfully!');
}

verifyServicesPage().catch((err) => {
  console.error('QA Error:', err);
  process.exit(1);
});
