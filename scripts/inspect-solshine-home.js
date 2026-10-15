const puppeteer = require('puppeteer');

async function inspectSolshineHome() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/', { waitUntil: 'networkidle2' });

  const sections = await page.evaluate(() => {
    const list = Array.from(document.querySelectorAll('main > div, main > section, section'));
    return list.map((s, idx) => {
      const h2 = s.querySelector('h2, h1, h3');
      return {
        idx,
        tag: s.tagName,
        className: s.className.slice(0, 30),
        heading: h2 ? h2.innerText.replace(/\n/g, ' ') : null,
        textSample: s.innerText.slice(0, 120).replace(/\n/g, ' -- ')
      };
    }).filter(s => s.heading);
  });

  console.log(JSON.stringify(sections, null, 2));
  await browser.close();
}

inspectSolshineHome().catch(console.error);
