const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/services/solar-panel-cleaning-services', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const el = document.querySelector('a[href*="cleaning-services"]');
    if (!el) return 'not found';

    // Parent tree
    let cur = el;
    const tree = [];
    while (cur && cur.tagName !== 'BODY') {
      const cs = window.getComputedStyle(cur);
      const r = cur.getBoundingClientRect();
      tree.push({
        tag: cur.tagName,
        class: cur.className,
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        bg: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        display: cs.display,
        position: cs.position,
      });
      cur = cur.parentElement;
    }

    // First link children
    const childTree = [];
    el.querySelectorAll('*').forEach((c) => {
      const cs = window.getComputedStyle(c);
      const r = c.getBoundingClientRect();
      childTree.push({
        tag: c.tagName,
        class: c.className,
        text: c.innerText ? c.innerText.trim() : '',
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        bg: cs.backgroundColor,
        color: cs.color,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        borderRadius: cs.borderRadius,
      });
    });

    return { tree: tree.slice(0, 6), childTree: childTree.slice(0, 10) };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
