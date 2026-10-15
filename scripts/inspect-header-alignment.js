const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/header-alignment');
const ARTIFACT_DIR = 'C:/Users/alele/.gemini/antigravity/brain/ae662322-3343-457e-82db-f6eb7bfa8b39';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureAndSave(page, filename, clip) {
  const localPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: localPath, clip });
  console.log(`Saved screenshot: ${filename}`);

  if (fs.existsSync(ARTIFACT_DIR)) {
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.copyFileSync(localPath, artifactPath);
  }
}

async function run() {
  console.log('--- STARTING CHAT HEADER ALIGNMENT INSPECTION ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Ensure server is ready
    let serverReady = false;
    for (let i = 0; i < 15; i++) {
      try {
        await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 5000 });
        serverReady = true;
        break;
      } catch (e) {
        await sleep(1000);
      }
    }
    if (!serverReady) throw new Error('Could not connect to http://localhost:3000');

    // 1. Desktop 1440px
    console.log('1. Inspecting header on 1440px desktop...');
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(800);

    // Open chat
    await page.click('aside button');
    await sleep(800);

    const desktopHeader = await page.evaluate(() => {
      const header = document.querySelector('div[role="dialog"] header');
      const textContainer = header.querySelector('div.flex.flex-col');
      const title = textContainer.querySelector('h2');
      const subtitle = textContainer.querySelector('p');
      const actions = header.querySelector('div.flex.items-center');
      const closeBtn = actions.querySelectorAll('button')[1];

      const headerRect = header.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const closeRect = closeBtn.getBoundingClientRect();
      const style = window.getComputedStyle(header);

      return {
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        display: style.display,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        headerWidth: Math.round(headerRect.width),
        headerHeight: Math.round(headerRect.height),
        // Distance from left edge of header to title
        leftToTitle: Math.round(titleRect.left - headerRect.left),
        // Distance from right edge of close button to right edge of header
        closeToRight: Math.round(headerRect.right - closeRect.right),
        // Vertical offset of title and action icons
        titleTopOffset: Math.round(titleRect.top - headerRect.top),
        closeTopOffset: Math.round(closeRect.top - headerRect.top),
        closeBottomOffset: Math.round(headerRect.bottom - closeRect.bottom),
      };
    });

    console.log('Desktop header measurements:', desktopHeader);

    // Capture zoomed header screenshot on desktop
    const headerClipDesktop = await page.evaluate(() => {
      const h = document.querySelector('div[role="dialog"] header');
      const r = h.getBoundingClientRect();
      return {
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    });
    await captureAndSave(page, 'header_desktop_detail.png', headerClipDesktop);
    await captureAndSave(page, 'header_desktop_full_chat.png');

    // 2. Mobile 390px
    console.log('2. Inspecting header on 390px mobile...');
    await page.setViewport({ width: 390, height: 844 });
    await sleep(600);

    const mobileHeader = await page.evaluate(() => {
      const header = document.querySelector('div[role="dialog"] header');
      const title = header.querySelector('h2');
      const closeBtn = header.querySelectorAll('button')[1];

      const headerRect = header.getBoundingClientRect();
      const titleRect = title.getBoundingClientRect();
      const closeRect = closeBtn.getBoundingClientRect();
      const style = window.getComputedStyle(header);

      return {
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        headerWidth: Math.round(headerRect.width),
        leftToTitle: Math.round(titleRect.left - headerRect.left),
        closeToRight: Math.round(headerRect.right - closeRect.right),
        closeTopOffset: Math.round(closeRect.top - headerRect.top),
        closeBottomOffset: Math.round(headerRect.bottom - closeRect.bottom),
      };
    });

    console.log('Mobile header measurements:', mobileHeader);

    const headerClipMobile = await page.evaluate(() => {
      const h = document.querySelector('div[role="dialog"] header');
      const r = h.getBoundingClientRect();
      return {
        x: Math.round(r.left),
        y: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height)
      };
    });
    await captureAndSave(page, 'header_mobile_detail.png', headerClipMobile);
    await captureAndSave(page, 'header_mobile_full_chat.png');

    console.log('--- CHAT HEADER ALIGNMENT INSPECTION COMPLETED SUCCESSFULLY ---');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Inspection error:', err);
  process.exit(1);
});
