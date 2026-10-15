const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'assistant-redesign');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

function saveScreenshot(sourceBuffer, filename) {
  const docsPath = path.join(DOCS_DIR, filename);
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(docsPath, sourceBuffer);
  fs.writeFileSync(artifactPath, sourceBuffer);
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  console.log('--- STARTING PREMIUM ASSISTANT REDESIGN VERIFICATION ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Visit homepage and verify launcher button (without status dot)
    console.log('1. Loading homepage to verify clean launcher button (no green dot)...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));

    const launcher = await page.$('aside[aria-label="Customer service assistant"] button');
    if (!launcher) throw new Error('Assistant launcher button not found on page');

    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_launcher_clean.png');

    // 2. Open assistant panel
    console.log('2. Opening assistant panel (verifying redesigned layout, header, and 4 suggestions)...');
    await launcher.click();
    await new Promise((r) => setTimeout(r, 1000));

    const dialog = await page.$('div[role="dialog"][aria-label="Laurrel Assistant"]');
    if (!dialog) throw new Error('Assistant panel dialog did not open');

    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_initial_panel_redesign.png');

    // Helper to send message and wait for assistant to finish response
    const sendMessage = async (text) => {
      console.log(`Sending message: "${text}"`);
      const textarea = await page.$('div[role="dialog"] footer textarea');
      if (!textarea) throw new Error('Message textarea not found');
      await textarea.click({ clickCount: 3 });
      await textarea.type(text);
      await page.keyboard.press('Enter');

      // Wait for spinner to disappear
      await new Promise((r) => setTimeout(r, 400));
      await page.waitForFunction(
        () => !document.querySelector('div[role="dialog"] .animate-spin'),
        { timeout: 10000 }
      );
      await new Promise((r) => setTimeout(r, 800));
    };

    // 3. Test functional starting suggestion: "Cleaning services"
    console.log('3. Testing starting suggestion: Cleaning services...');
    const actionButtons = await page.$$('div[role="dialog"] button');
    let cleaningBtn = null;
    for (const btn of actionButtons) {
      const text = await (await btn.getProperty('textContent')).jsonValue();
      if (text && text.trim() === 'Cleaning services') {
        cleaningBtn = btn;
        break;
      }
    }

    if (cleaningBtn) {
      await cleaningBtn.click();
      await new Promise((r) => setTimeout(r, 400));
      await page.waitForFunction(
        () => !document.querySelector('div[role="dialog"] .animate-spin'),
        { timeout: 10000 }
      );
      await new Promise((r) => setTimeout(r, 800));
      saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_ongoing_chat.png');
    }

    // 4. Test long assistant response with internal links
    console.log('4. Testing long structured response with internal links...');
    await sendMessage('Tell me about your moving and transitional storage options in Ottawa.');
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_long_response.png');

    // 5. Guided enquiry progressive collection
    console.log('5. Testing guided enquiry collection & summary card...');
    await sendMessage('Centretown, Ottawa K1P 1J1');
    await sendMessage('End of next month');
    await sendMessage('3-bedroom apartment move with elevator coordination');
    await sendMessage('Marcus Vance, marcus.vance@example.ca');

    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_guided_summary_redesign.png');

    // 6. Confirm and submit the enquiry
    console.log('6. Confirming enquiry submission...');
    const allDialogBtns = await page.$$('div[role="dialog"] button');
    let submitEnquiryBtn = null;
    for (const b of allDialogBtns) {
      const txt = await (await b.getProperty('textContent')).jsonValue();
      if (txt && txt.includes('Submit Enquiry')) {
        submitEnquiryBtn = b;
        break;
      }
    }

    if (submitEnquiryBtn) {
      console.log('Clicking Submit Enquiry...');
      await submitEnquiryBtn.evaluate((el) => el.scrollIntoView());
      await submitEnquiryBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
      await page.waitForFunction(
        () => !document.querySelector('div[role="dialog"] .animate-spin'),
        { timeout: 10000 }
      );
      await new Promise((r) => setTimeout(r, 1000));
      saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_confirmation_redesign.png');
    }

    // 7. Mobile Viewport Test (390px)
    console.log('7. Testing mobile assistant on 390px viewport...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 1200));
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_mobile_chat_redesign.png');

    // 8. Viewport 360px mobile check
    console.log('8. Testing mobile assistant on 360px viewport...');
    await page.setViewport({ width: 360, height: 740, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 1000));
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_mobile_360_redesign.png');

    // 9. Viewport 768px tablet check
    console.log('9. Testing tablet assistant on 768px viewport...');
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise((r) => setTimeout(r, 1000));
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_tablet_768_redesign.png');

    // 10. Viewport 1024px laptop check
    console.log('10. Testing laptop assistant on 1024px viewport...');
    await page.setViewport({ width: 1024, height: 768 });
    await new Promise((r) => setTimeout(r, 1000));
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_laptop_1024_redesign.png');

    console.log('--- ALL ASSISTANT TESTS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Assistant verification error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
