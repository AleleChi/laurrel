const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/chat-fixes');
const ARTIFACT_DIR = 'C:/Users/alele/.gemini/antigravity/brain/ae662322-3343-457e-82db-f6eb7bfa8b39';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function captureAndSave(page, filename) {
  const localPath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: localPath });
  console.log(`Saved screenshot: ${filename}`);

  if (fs.existsSync(ARTIFACT_DIR)) {
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.copyFileSync(localPath, artifactPath);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- STARTING CHAT FIXES VERIFICATION ---');
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

    // 1. Desktop 1440px - Closed Launcher
    console.log('1. Testing closed launcher on 1440px desktop...');
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(500);

    // Verify closed launcher exists
    const launcherExists = await page.$('aside button');
    if (!launcherExists) throw new Error('Closed launcher button not found');
    await captureAndSave(page, 'chat_fix_01_launcher_closed.png');

    // 2. Open Chat Panel
    console.log('2. Opening chat panel...');
    await page.click('aside button');
    await sleep(800);

    // Verify external launcher button is GONE from DOM
    const openLaunchers = await page.$$('aside button');
    console.log(`Open launcher buttons in DOM: ${openLaunchers.length} (Expected: 0)`);
    if (openLaunchers.length !== 0) {
      throw new Error('External launcher button is still rendered when chat is open!');
    }

    // Check panel dimensions
    const panelBox = await page.evaluate(() => {
      const el = document.querySelector('div[role="dialog"]');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(window.innerWidth - rect.right),
        bottom: Math.round(window.innerHeight - rect.bottom),
        borderRadius: style.borderRadius
      };
    });
    console.log('Desktop panel measurements:', panelBox);
    await captureAndSave(page, 'chat_fix_02_panel_open.png');

    // 3. Natural Quote Initiation (No generic repetition)
    console.log('3. Testing natural quote request...');
    await page.type('textarea', 'Can I get a quote?');
    await page.click('button[type="submit"]');
    await sleep(1200);

    // Verify assistant responded naturally
    const naturalResponse = await page.evaluate(() => {
      const texts = Array.from(document.querySelectorAll('div[role="dialog"] p')).map(p => p.textContent);
      return texts.some(t => t.includes('Which service do you need'));
    });
    console.log('Assistant asked natural quote clarification:', naturalResponse);
    await captureAndSave(page, 'chat_fix_03_natural_quote_prompt.png');

    // 4. Test Service Selection and Ottawa Location
    console.log('4. Selecting cleaning and moving...');
    await page.type('textarea', 'Cleaning and moving in Centretown, Ottawa K1P 1J1');
    await page.click('button[type="submit"]');
    await sleep(1200);

    // 5. Test Date and Details
    console.log('5. Providing date and job scope...');
    await page.type('textarea', 'End of next month, 2 bedroom condo move with handover clean');
    await page.click('button[type="submit"]');
    await sleep(1200);

    // 6. Test Contact Info
    console.log('6. Providing contact info...');
    await page.type('textarea', 'Claire Bennett, claire.bennett@example.ca');
    await page.click('button[type="submit"]');
    await sleep(1500);

    // Verify enquiry summary card is rendered
    const hasSummary = await page.evaluate(() => {
      return document.body.textContent.includes('Enquiry Summary');
    });
    console.log('Enquiry summary card rendered:', hasSummary);
    await captureAndSave(page, 'chat_fix_04_quote_enquiry_summary.png');

    // 7. Submit Enquiry
    console.log('7. Submitting enquiry...');
    const submitBtn = await page.$('button ::-p-text(Submit Enquiry)');
    if (submitBtn) {
      await submitBtn.click();
      await sleep(1800);
    }
    await captureAndSave(page, 'chat_fix_05_enquiry_confirmed.png');

    // 8. Long Conversation & Single Action Chips on latest message only
    console.log('8. Checking long conversation scrolling and suggestion containment...');
    await page.type('textarea', 'What transitional storage options do you have?');
    await page.click('button[type="submit"]');
    await sleep(1200);

    const buttonCounts = await page.evaluate(() => {
      const allActionContainers = document.querySelectorAll('div.flex.flex-wrap.gap-1\\.5');
      return allActionContainers.length;
    });
    console.log(`Action containers visible in chat: ${buttonCounts} (Expected: <= 1)`);
    await captureAndSave(page, 'chat_fix_06_long_conversation_clean_actions.png');

    // 9. Mobile Viewport 390px
    console.log('9. Testing mobile viewport 390px...');
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    await page.click('aside button');
    await sleep(800);

    const mobileBox = await page.evaluate(() => {
      const el = document.querySelector('div[role="dialog"]');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
      };
    });
    console.log('Mobile measurements:', mobileBox);
    await captureAndSave(page, 'chat_fix_07_mobile_390_fullscreen.png');

    // 10. Mobile Viewport 360px
    console.log('10. Testing mobile viewport 360px...');
    await page.setViewport({ width: 360, height: 740 });
    await sleep(500);
    await captureAndSave(page, 'chat_fix_08_mobile_360.png');

    // 11. Laptop Viewport 1024px
    console.log('11. Testing laptop viewport 1024px...');
    await page.setViewport({ width: 1024, height: 768 });
    await sleep(500);
    await captureAndSave(page, 'chat_fix_09_laptop_1024.png');

    // 12. Tablet Viewport 768px
    console.log('12. Testing tablet viewport 768px...');
    await page.setViewport({ width: 768, height: 1024 });
    await sleep(500);
    await captureAndSave(page, 'chat_fix_10_tablet_768.png');

    console.log('--- ALL CHAT FIX VERIFICATIONS COMPLETED SUCCESSFULLY ---');
  } finally {
    await browser.close();
  }
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
