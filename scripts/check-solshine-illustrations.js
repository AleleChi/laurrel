const puppeteer = require('puppeteer');

async function checkIllustrationMotion() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);

  await page.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText && h.innerText.includes('Innovations in green'));
    if (h2) h2.scrollIntoView({ block: 'center' });
  });
  await new Promise(r => setTimeout(r, 800));

  const animInfo = await page.evaluate(async () => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText && h.innerText.includes('Innovations in green'));
    let sec = h2;
    while (sec && sec.parentElement && sec.getBoundingClientRect().height < 400) sec = sec.parentElement;

    const svgs = Array.from(sec.querySelectorAll('svg, img'));
    const initialTransforms = svgs.map(s => ({
      tag: s.tagName,
      className: s.className,
      transform: window.getComputedStyle(s).transform,
      opacity: window.getComputedStyle(s).opacity,
      animation: window.getComputedStyle(s).animation,
      pathsCount: s.querySelectorAll('path, line, rect, circle').length,
      htmlSnippet: s.outerHTML.slice(0, 180)
    }));

    return { svgsCount: svgs.length, initialTransforms };
  });

  console.log('Illustration info:', JSON.stringify(animInfo, null, 2));

  // Check hover reaction
  const hoverResults = await page.evaluate(async () => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText && h.innerText.includes('Innovations in green'));
    let sec = h2;
    while (sec && sec.parentElement && sec.getBoundingClientRect().height < 400) sec = sec.parentElement;

    const rows = Array.from(sec.querySelectorAll('h4')).map(h => h.parentElement.parentElement);
    const results = [];
    for (const r of rows) {
      if (!r) continue;
      const img = r.querySelector('svg, img');
      const before = img ? window.getComputedStyle(img).transform : null;
      r.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise(res => setTimeout(res, 200));
      const during = img ? window.getComputedStyle(img).transform : null;
      r.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      results.push({ before, during });
    }
    return results;
  });

  console.log('Hover results:', JSON.stringify(hoverResults, null, 2));

  await browser.close();
}

checkIllustrationMotion().catch(console.error);
