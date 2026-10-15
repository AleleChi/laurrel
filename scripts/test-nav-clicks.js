const puppeteer = require('puppeteer');

async function testNavClicks() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const items = ['cleaning', 'moving', 'storage', 'how-it-works', 'faq'];
  for (const id of items) {
    await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 600));

    const link = await page.$(`aside a[href="#${id}"]`);
    if (link) {
      await link.click();
      await new Promise((r) => setTimeout(r, 1000));
      const pos = await page.evaluate((targetId) => {
        const el = document.getElementById(targetId);
        return el ? Math.round(el.getBoundingClientRect().top) : null;
      }, id);
      console.log(`Clicked #${id} -> element top in viewport: ${pos}px`);
    } else {
      console.log(`Link for #${id} not found in aside`);
    }
  }
  await browser.close();
}

testNavClicks().catch(console.error);
