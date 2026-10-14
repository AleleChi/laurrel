const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
];

async function captureAll() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait a brief moment for fonts and image to be ready
    await new Promise(r => setTimeout(r, 1000));

    const filePath = path.join(outDir, `${vp.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`Saved screenshot: ${vp.name}.png (${vp.width}x${vp.height})`);

    // If mobile, let's also test opening the menu
    if (vp.name === 'mobile-390') {
      const menuBtn = await page.$('button[aria-label="Open menu"]');
      if (menuBtn) {
        await menuBtn.click();
        await new Promise(r => setTimeout(r, 400));
        const menuPath = path.join(outDir, 'mobile-menu-open.png');
        await page.screenshot({ path: menuPath });
        console.log('Saved screenshot: mobile-menu-open.png');
      }
    }

    // If desktop, let's also test opening the quote modal
    if (vp.name === 'desktop-1440') {
      // Find quote button
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Request a Quote')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 400));
          const modalPath = path.join(outDir, 'desktop-quote-modal.png');
          await page.screenshot({ path: modalPath });
          console.log('Saved screenshot: desktop-quote-modal.png');
          break;
        }
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

captureAll().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
