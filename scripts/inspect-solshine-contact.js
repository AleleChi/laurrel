const puppeteer = require('puppeteer');

async function inspectSolshineContact() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/contact-us', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    const title = document.title;

    // Find main sections
    const sections = Array.from(document.querySelectorAll('section, main > div')).map((s, idx) => {
      const h = s.querySelector('h1, h2, h3');
      const style = window.getComputedStyle(s);
      return {
        idx,
        tag: s.tagName,
        className: s.className.slice(0, 30),
        bg: style.backgroundColor,
        padding: style.padding,
        heading: h ? h.innerText.replace(/\n/g, ' ') : null,
        textSample: s.innerText.slice(0, 150).replace(/\n/g, ' -- ')
      };
    }).filter(s => s.textSample.length > 20);

    // Find form
    const form = document.querySelector('form');
    let formInfo = null;
    if (form) {
      const p = form.closest('div');
      const s = window.getComputedStyle(p);
      const inputs = Array.from(form.querySelectorAll('input, textarea, button, select')).map(el => ({
        tag: el.tagName,
        type: el.type,
        placeholder: el.placeholder,
        text: el.innerText
      }));
      formInfo = {
        w: form.offsetWidth,
        h: form.offsetHeight,
        parentBg: s.backgroundColor,
        parentBorderRadius: s.borderRadius,
        inputs
      };
    }

    return { title, sections, formInfo };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

inspectSolshineContact().catch(console.error);
