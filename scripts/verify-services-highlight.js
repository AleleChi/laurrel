const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-highlight');
const MOTION_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-motion');
const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(MOTION_DIR)) {
  fs.mkdirSync(MOTION_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_1840', width: 1840, height: 1080 },
  { name: 'desktop_1440', width: 1440, height: 900 },
  { name: 'laptop_1024', width: 1024, height: 768 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_390', width: 390, height: 844 },
  { name: 'mobile_360', width: 360, height: 740 },
];

async function captureEvidence() {
  console.log('Launching browser for verification...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  for (const vp of VIEWPORTS) {
    console.log(`Capturing at ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for services section to be present
    const servicesSection = await page.waitForSelector('#services', { timeout: 10000 });
    
    // Scroll into view
    await page.evaluate(() => {
      const el = document.getElementById('services');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    await new Promise((r) => setTimeout(r, 1200));

    // Screenshot services section specifically
    const filename = `laurrel_services_highlight_${vp.name}.png`;
    const localPath = path.join(OUTPUT_DIR, filename);
    const artifactPath = path.join(ARTIFACT_DIR, filename);

    const boundingBox = await servicesSection.boundingBox();
    if (boundingBox) {
      await page.screenshot({
        path: localPath,
        clip: {
          x: Math.max(0, boundingBox.x),
          y: Math.max(0, boundingBox.y),
          width: Math.min(vp.width, boundingBox.width),
          height: boundingBox.height,
        },
      });
      fs.copyFileSync(localPath, artifactPath);
      console.log(`Saved screenshot: ${filename} (${boundingBox.width}x${boundingBox.height})`);
    }
  }

  // Test Navigation from CTA to /services
  console.log('Testing CTA navigation to /services...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  
  await page.evaluate(() => {
    const el = document.getElementById('services');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await new Promise((r) => setTimeout(r, 800));

  // Find and click the Explore Services link
  const ctaLink = await page.$('a[href="/services"]');
  if (ctaLink) {
    console.log('Found Explore Services CTA, clicking...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ctaLink.click(),
    ]);

    const currentUrl = page.url();
    console.log('Navigated to URL:', currentUrl);

    // Verify H1
    const h1Text = await page.$eval('h1', (el) => el.innerText);
    console.log('Services page H1:', h1Text);

    // Capture screenshot of /services page
    const servicesPageFilename = 'laurrel_services_page_1440.png';
    const servicesPageLocalPath = path.join(OUTPUT_DIR, servicesPageFilename);
    const servicesPageArtifactPath = path.join(ARTIFACT_DIR, servicesPageFilename);
    await page.screenshot({ path: servicesPageLocalPath, fullPage: false });
    fs.copyFileSync(servicesPageLocalPath, servicesPageArtifactPath);
    console.log('Saved /services page screenshot');

    // Test direct anchor link
    await page.goto('http://localhost:3000/services#storage', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 500));
    console.log('Anchor /services#storage navigation successful');
  } else {
    console.error('Could not find Explore Services CTA link!');
  }

  await browser.close();
  console.log('All QA checks completed successfully.');
}

captureEvidence().catch((err) => {
  console.error('Error during QA:', err);
  process.exit(1);
});
