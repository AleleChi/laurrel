const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/launcher-alignment');
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
  console.log('--- STARTING LAUNCHER ALIGNMENT INSPECTION ---');
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
    console.log('1. Inspecting launcher on 1440px desktop...');
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(800);

    const measurements = await page.evaluate(() => {
      const btn = document.querySelector('aside button');
      const icon = btn.querySelector('svg');
      const text = btn.querySelector('span');

      const btnRect = btn.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      const style = window.getComputedStyle(btn);

      return {
        display: style.display,
        alignItems: style.alignItems,
        justifyContent: style.justifyContent,
        gap: style.gap,
        paddingLeft: style.paddingLeft,
        paddingRight: style.paddingRight,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
        btnWidth: Math.round(btnRect.width),
        btnHeight: Math.round(btnRect.height),
        iconWidth: Math.round(iconRect.width),
        iconHeight: Math.round(iconRect.height),
        textWidth: Math.round(textRect.width),
        textHeight: Math.round(textRect.height),
        // Distances from edges
        leftToIcon: Math.round(iconRect.left - btnRect.left),
        iconToText: Math.round(textRect.left - iconRect.right),
        textToRight: Math.round(btnRect.right - textRect.right),
        // Vertical centering checks
        iconTopOffset: Math.round(iconRect.top - btnRect.top),
        iconBottomOffset: Math.round(btnRect.bottom - iconRect.bottom),
        textTopOffset: Math.round(textRect.top - btnRect.top),
        textBottomOffset: Math.round(btnRect.bottom - textRect.bottom),
      };
    });

    console.log('Desktop launcher geometry measurements:', measurements);

    // Full page desktop screenshot
    await captureAndSave(page, 'launcher_desktop_full.png');

    // Zoomed-in clip around the launcher
    const btnBox = await page.evaluate(() => {
      const btn = document.querySelector('aside button');
      const r = btn.getBoundingClientRect();
      return {
        x: Math.max(0, Math.round(r.left - 40)),
        y: Math.max(0, Math.round(r.top - 40)),
        width: Math.round(r.width + 80),
        height: Math.round(r.height + 80)
      };
    });
    await captureAndSave(page, 'launcher_desktop_detail.png', btnBox);

    // 2. Mobile 390px
    console.log('2. Inspecting launcher on 390px mobile...');
    await page.setViewport({ width: 390, height: 844 });
    await sleep(600);

    const mobileMeasurements = await page.evaluate(() => {
      const btn = document.querySelector('aside button');
      const icon = btn.querySelector('svg');
      const text = btn.querySelector('span');

      const btnRect = btn.getBoundingClientRect();
      const iconRect = icon.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();

      return {
        btnWidth: Math.round(btnRect.width),
        btnHeight: Math.round(btnRect.height),
        leftToIcon: Math.round(iconRect.left - btnRect.left),
        iconToText: Math.round(textRect.left - iconRect.right),
        textToRight: Math.round(btnRect.right - textRect.right),
        iconTopOffset: Math.round(iconRect.top - btnRect.top),
        iconBottomOffset: Math.round(btnRect.bottom - iconRect.bottom),
        textTopOffset: Math.round(textRect.top - btnRect.top),
        textBottomOffset: Math.round(btnRect.bottom - textRect.bottom),
      };
    });

    console.log('Mobile launcher geometry measurements:', mobileMeasurements);

    await captureAndSave(page, 'launcher_mobile_full.png');

    const mobileBtnBox = await page.evaluate(() => {
      const btn = document.querySelector('aside button');
      const r = btn.getBoundingClientRect();
      return {
        x: Math.max(0, Math.round(r.left - 20)),
        y: Math.max(0, Math.round(r.top - 20)),
        width: Math.round(r.width + 40),
        height: Math.round(r.height + 40)
      };
    });
    await captureAndSave(page, 'launcher_mobile_detail.png', mobileBtnBox);

    console.log('--- LAUNCHER ALIGNMENT INSPECTION COMPLETED SUCCESSFULLY ---');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Inspection error:', err);
  process.exit(1);
});
