const puppeteer = require('puppeteer');

async function qaMotionCheck() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('1. Checking About Page for errors...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 600));

  // Scroll through entire page
  const totalH = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= totalH; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await new Promise(r => setTimeout(r, 100));
  }

  // Check FAQ toggle
  const faqToggleWorks = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-controls="faq-panel-0"]');
    const wasOpen = btn.getAttribute('aria-expanded') === 'true';
    btn.click();
    return { wasOpen, nowAttr: btn.getAttribute('aria-expanded') };
  });
  console.log('FAQ Toggle Test:', faqToggleWorks);

  // Check Marquee style
  const marqueeAnimation = await page.evaluate(() => {
    const m = document.querySelector('section[aria-label="Core Laurrel Services marquee"] div');
    return m ? window.getComputedStyle(m).animation : null;
  });
  console.log('Marquee Animation:', marqueeAnimation);

  // Check Horizontal Overflow
  const hasHorizontalOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Horizontal Overflow Present:', hasHorizontalOverflow);

  console.log('2. Checking Homepage integrity...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 600));

  const homeHeroVideo = await page.evaluate(() => {
    const v = document.querySelector('video');
    return v ? { src: v.currentSrc || v.src, paused: v.paused } : null;
  });
  console.log('Home Hero Video Status:', homeHeroVideo);

  console.log('Console Errors:', consoleErrors);
  await browser.close();
}

qaMotionCheck().catch(console.error);
