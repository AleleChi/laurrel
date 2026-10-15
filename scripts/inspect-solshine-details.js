const puppeteer = require('puppeteer');

async function inspectSolshineDetails() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);

  const data = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
      tag: h.tagName,
      text: h.innerText.trim(),
      top: Math.round(window.scrollY + h.getBoundingClientRect().top)
    }));

    // Find any marquee or ticker elements
    const allDivs = Array.from(document.querySelectorAll('div, p, span, h2, h3')).filter(el => {
      const s = window.getComputedStyle(el);
      return s.letterSpacing || s.textStroke || s.webkitTextStroke;
    });

    // Check all text in page for dark section
    const darkSections = Array.from(document.querySelectorAll('*')).filter(el => {
      const bg = window.getComputedStyle(el).backgroundColor;
      return (bg === 'rgb(0, 0, 0)' || bg === 'rgb(11, 11, 14)' || bg === 'rgb(24, 24, 27)') && el.getBoundingClientRect().height > 80;
    }).map(el => ({
      tag: el.tagName,
      className: el.className,
      rect: el.getBoundingClientRect(),
      text: (el.innerText || '').slice(0, 100).replace(/\n/g, ' ')
    }));

    return { headings, darkSections };
  });

  console.log('Headings on Solshine:');
  console.log(JSON.stringify(data.headings, null, 2));

  console.log('Dark sections on Solshine:');
  console.log(JSON.stringify(data.darkSections.slice(0, 8), null, 2));

  await browser.close();
}

inspectSolshineDetails().catch(console.error);
