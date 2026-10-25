const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\d497e002-dfa4-4b96-ac78-93caf91a938e';

async function run() {
  console.log('Capturing verified combined screens...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // 1. Customer-facing booking portal
    console.log('Checking /book...');
    const bookRes = await page.goto('https://deploy-preview-5--laurrel.netlify.app/book', { waitUntil: 'networkidle2' });
    console.log(` -> /book HTTP status: ${bookRes.status()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reconciled-01-public-book.png') });

    // 2. Login
    console.log('Checking /admin/login...');
    const loginRes = await page.goto('https://deploy-preview-5--laurrel.netlify.app/admin/login', { waitUntil: 'networkidle2' });
    console.log(` -> /admin/login HTTP status: ${loginRes.status()}`);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reconciled-02-admin-login.png') });

    console.log('All live preview checks complete!');
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
