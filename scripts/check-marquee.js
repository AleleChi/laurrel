const puppeteer = require('puppeteer');

async function checkMarqueeInView() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);

  const pos = await page.evaluate(() => {
    const s = document.querySelector('.framer-152oc03');
    if (!s) return null;
    return window.scrollY + s.getBoundingClientRect().top;
  });

  console.log('Marquee section pos:', pos);
  await page.evaluate((y) => window.scrollTo(0, y - 200), pos);
  await new Promise(r => setTimeout(r, 800));

  for (let i = 0; i < 6; i++) {
    const data = await page.evaluate(() => {
      const s = document.querySelector('.framer-152oc03');
      const ul = s ? s.querySelector('ul') : null;
      return {
        transform: ul ? window.getComputedStyle(ul).transform : null,
        left: ul ? ul.getBoundingClientRect().left : null
      };
    });
    console.log(`Snapshot ${i}:`, data);
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
}

checkMarqueeInView().catch(console.error);
