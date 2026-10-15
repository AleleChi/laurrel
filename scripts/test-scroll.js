const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  
  const before = await page.evaluate(() => window.scrollY);
  await page.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Why Laurrel Services"]');
    const img = sec.querySelector('img');
    img.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));
  const after = await page.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Why Laurrel Services"]');
    const img = sec.querySelector('img');
    const motion = img.parentElement.parentElement;
    return {
      scrollY: window.scrollY,
      motionOpacity: window.getComputedStyle(motion).opacity,
      motionTransform: window.getComputedStyle(motion).transform
    };
  });
  console.log('Before:', before, 'After:', after);
  await browser.close();
}

test().catch(console.error);
