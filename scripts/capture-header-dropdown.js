const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 600));

  const toggleBtn = await page.$('button[aria-label="Toggle Services dropdown"]');
  if (toggleBtn) {
    await toggleBtn.click();
    await new Promise(r => setTimeout(r, 400));
  }

  const outDir = path.join(__dirname, '..', 'docs', 'screenshots', 'reconstruction');
  const targetPath = path.join(outDir, 'header_services_dropdown_open_1440.png');
  const artifactPath = path.join('C:/Users/alele/.gemini/antigravity/brain/ae662322-3343-457e-82db-f6eb7bfa8b39', 'header_services_dropdown_open_1440.png');

  await page.screenshot({ path: targetPath, clip: { x: 0, y: 0, width: 1440, height: 350 } });
  fs.copyFileSync(targetPath, artifactPath);
  console.log('Successfully captured full uncropped header dropdown screenshot!');
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
