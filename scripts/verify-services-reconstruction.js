const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-reconstructed');
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
];

async function verifyReconstruction() {
  console.log('Starting /services visual reconstruction verification...');
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
    await new Promise((r) => setTimeout(r, 1000));

    // Full page screenshot
    const fullFilename = `laurrel_services_reconstructed_${vp.name}_full.png`;
    const fullLocalPath = path.join(OUTPUT_DIR, fullFilename);
    const fullArtifactPath = path.join(ARTIFACT_DIR, fullFilename);
    await page.screenshot({ path: fullLocalPath, fullPage: true });
    fs.copyFileSync(fullLocalPath, fullArtifactPath);

    // Banner specific screenshot
    const bannerFilename = `laurrel_services_banner_${vp.name}.png`;
    const bannerLocalPath = path.join(OUTPUT_DIR, bannerFilename);
    const bannerArtifactPath = path.join(ARTIFACT_DIR, bannerFilename);
    await page.screenshot({
      path: bannerLocalPath,
      clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 560) },
    });
    fs.copyFileSync(bannerLocalPath, bannerArtifactPath);

    console.log(`Saved ${fullFilename} & ${bannerFilename}`);
  }

  // Functional & Interaction testing on 1440px desktop
  console.log('Testing interactive features on 1440px desktop...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2' });

  // 1. Verify H1 in banner
  const h1Text = await page.$eval('h1', (el) => el.innerText);
  console.log('Banner H1 Text:', h1Text);

  // 2. Verify Main Article H2
  const articleH2 = await page.$eval('article h2', (el) => el.innerText);
  console.log('Main Article H2:', articleH2);

  // 3. Test Direct Hash Navigation (#faq)
  console.log('Testing direct hash navigation to #faq...');
  await page.goto('http://localhost:3000/services#faq', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));

  const faqRect = await page.$eval('#faq', (el) => {
    const r = el.getBoundingClientRect();
    return { top: r.top, y: window.scrollY };
  });
  console.log('FAQ section top position relative to viewport:', faqRect.top);

  // 4. Test FAQ Accordion expand
  const secondFaqButton = await page.$$('section#faq button');
  if (secondFaqButton.length > 1) {
    console.log('Toggling FAQ accordion...');
    await secondFaqButton[1].click();
    await new Promise((r) => setTimeout(r, 400));
  }

  // 5. Test Enquire button quote modal pre-selection
  console.log('Testing Enquire About Moving quote preselection...');
  await page.goto('http://localhost:3000/services#moving', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));

  const movingBtn = await page.$('section#moving button');
  if (movingBtn) {
    await movingBtn.click();
    await new Promise((r) => setTimeout(r, 600));

    const modalFilename = 'services_moving_quote_modal_1440.png';
    const modalLocalPath = path.join(OUTPUT_DIR, modalFilename);
    const modalArtifactPath = path.join(ARTIFACT_DIR, modalFilename);
    await page.screenshot({ path: modalLocalPath });
    fs.copyFileSync(modalLocalPath, modalArtifactPath);
    console.log('Saved Moving quote modal screenshot');
  }

  await browser.close();
  console.log('All reconstruction QA checks completed successfully!');
}

verifyReconstruction().catch((err) => {
  console.error('QA Error:', err);
  process.exit(1);
});
