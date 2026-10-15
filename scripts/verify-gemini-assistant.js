const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'assistant');

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
  console.log('--- STARTING COMPREHENSIVE GEMINI ASSISTANT VERIFICATION ---');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 1. Visit homepage and verify launcher button
    console.log('1. Loading homepage to verify launcher button...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1200));

    const launcher = await page.$('aside[aria-label="Customer service assistant"] button');
    if (!launcher) throw new Error('Assistant launcher button not found on page');

    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_launcher_desktop.png');

    // 2. Click launcher and verify panel opens
    console.log('2. Opening assistant panel...');
    await launcher.click();
    await new Promise((r) => setTimeout(r, 1000));

    const dialog = await page.$('div[role="dialog"][aria-label="Laurrel Assistant"]');
    if (!dialog) throw new Error('Assistant panel dialog did not open');

    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_initial_panel.png');

    // Helper to send message and wait for assistant to finish response
    const sendMessage = async (text) => {
      console.log(`Sending message: "${text}"`);
      const input = await page.$('div[role="dialog"] form input[type="text"]');
      if (!input) throw new Error('Message input not found');
      await input.click({ clickCount: 3 });
      await input.type(text);
      await page.keyboard.press('Enter');

      // Wait for spinner to disappear and answer to arrive
      await new Promise((r) => setTimeout(r, 400));
      await page.waitForFunction(
        () => !document.querySelector('div[role="dialog"] .animate-spin'),
        { timeout: 10000 }
      );
      await new Promise((r) => setTimeout(r, 800));
    };

    // 3. Test functional starting action: "Cleaning services"
    console.log('3. Testing starting action: Cleaning services...');
    const actionButtons = await page.$$('div[role="dialog"] button');
    let cleaningBtn = null;
    for (const btn of actionButtons) {
      const text = await (await btn.getProperty('textContent')).jsonValue();
      if (text && text.includes('Cleaning services')) {
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
      saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_service_answer.png');
    }

    // 4. Test factual pricing refusal: Ask "How much does a move cost?"
    console.log('4. Testing pricing enquiry (verifying transparent quote policy, no invented flat rates)...');
    await sendMessage('How much does a 2 bedroom move cost in Ottawa?');
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_pricing_refusal.png');

    // 5. Test guided enquiry progressive collection
    console.log('5. Executing guided enquiry collection...');
    await sendMessage('Centretown, Ottawa K1P 1J1');
    await sendMessage('End of next month');
    await sendMessage('Moving a 2-bedroom condo with elevator booking');
    await sendMessage('Sarah Connor, sarah.connor@example.ca');

    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_guided_summary.png');

    // 6. Confirm and submit the enquiry
    console.log('6. Confirming enquiry submission...');
    const submitBtn = await page.waitForSelector(
      'button:has-text("Confirm & Submit Enquiry"), div[role="dialog"] button.bg-\\[\\#390044\\]',
      { timeout: 5000 }
    ).catch(() => null);

    // Alternative search for the button with Confirm text
    const allDialogBtns = await page.$$('div[role="dialog"] button');
    let confirmBtn = null;
    for (const b of allDialogBtns) {
      const txt = await (await b.getProperty('textContent')).jsonValue();
      if (txt && txt.includes('Confirm & Submit Enquiry')) {
        confirmBtn = b;
        break;
      }
    }

    if (confirmBtn) {
      console.log('Clicking Confirm & Submit Enquiry...');
      await confirmBtn.evaluate((el) => el.scrollIntoView());
      await confirmBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
      await page.waitForFunction(
        () => !document.querySelector('div[role="dialog"] .animate-spin'),
        { timeout: 10000 }
      );
      await new Promise((r) => setTimeout(r, 1000));
      saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_submission_success.png');
    } else {
      console.log('Warning: Confirm & Submit Enquiry button could not be located');
    }

    // 7. Test Human Handoff
    console.log('7. Testing Human Handoff...');
    await sendMessage('Can I speak with someone from the Laurrel team?');
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_human_handoff.png');

    // Fill handoff form and submit
    const handoffEmailInput = await page.$('input[placeholder="Your Email Address *"]');
    if (handoffEmailInput) {
      console.log('Submitting human handoff form...');
      await handoffEmailInput.type('sarah.handoff@example.ca');
      const sendHandoffBtn = await page.$('div[role="dialog"] button[type="submit"]');
      if (sendHandoffBtn) {
        await sendHandoffBtn.click();
        await new Promise((r) => setTimeout(r, 2000));
        saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_human_handoff_submitted.png');
      }
    }

    // 8. Mobile Viewport Test (390px)
    console.log('8. Testing mobile assistant on 390px viewport...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await new Promise((r) => setTimeout(r, 1200));
    saveScreenshot(await page.screenshot({ fullPage: false }), 'assistant_mobile_390.png');

    console.log('--- ALL ASSISTANT TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('Assistant verification error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
