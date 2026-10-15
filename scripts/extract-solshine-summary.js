const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });

  const summary = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const eyebrow = all.find(el => el.innerText && el.innerText.trim() === 'ABOUT OUR COMPANY' && el.getBoundingClientRect().top < 1000);
    const heading = all.find(el => el.innerText && el.innerText.includes('Innovations in green technology'));
    const img = Array.from(document.querySelectorAll('img')).find(i => i.getBoundingClientRect().top > 500 && i.getBoundingClientRect().top < 1200);
    const btn = all.find(el => el.innerText && el.innerText.includes('View all services') && el.tagName === 'A');

    return {
      eyebrow: {
        text: eyebrow ? eyebrow.innerText.trim() : null,
        font: eyebrow ? window.getComputedStyle(eyebrow).font : null,
        fontSize: eyebrow ? window.getComputedStyle(eyebrow).fontSize : null,
        fontWeight: eyebrow ? window.getComputedStyle(eyebrow).fontWeight : null,
        fontFamily: eyebrow ? window.getComputedStyle(eyebrow).fontFamily : null,
        letterSpacing: eyebrow ? window.getComputedStyle(eyebrow).letterSpacing : null,
        lineHeight: eyebrow ? window.getComputedStyle(eyebrow).lineHeight : null,
        color: eyebrow ? window.getComputedStyle(eyebrow).color : null,
        gap: eyebrow && eyebrow.parentElement ? window.getComputedStyle(eyebrow.parentElement).gap : null,
      },
      heading: {
        text: heading ? heading.innerText.trim() : null,
        fontSize: heading ? window.getComputedStyle(heading).fontSize : null,
        fontWeight: heading ? window.getComputedStyle(heading).fontWeight : null,
        fontFamily: heading ? window.getComputedStyle(heading).fontFamily : null,
        letterSpacing: heading ? window.getComputedStyle(heading).letterSpacing : null,
        lineHeight: heading ? window.getComputedStyle(heading).lineHeight : null,
        color: heading ? window.getComputedStyle(heading).color : null,
        rect: heading ? heading.getBoundingClientRect() : null,
      },
      image: {
        src: img ? img.src : null,
        width: img ? img.getBoundingClientRect().width : null,
        height: img ? img.getBoundingClientRect().height : null,
        borderRadius: img ? window.getComputedStyle(img).borderRadius : null,
        parentBorderRadius: img && img.parentElement ? window.getComputedStyle(img.parentElement).borderRadius : null,
      },
      button: {
        text: btn ? btn.innerText.trim() : null,
        width: btn ? btn.getBoundingClientRect().width : null,
        height: btn ? btn.getBoundingClientRect().height : null,
        padding: btn ? window.getComputedStyle(btn).padding : null,
        bg: btn ? window.getComputedStyle(btn).backgroundColor : null,
        borderRadius: btn ? window.getComputedStyle(btn).borderRadius : null,
        color: btn ? window.getComputedStyle(btn).color : null,
        display: btn ? window.getComputedStyle(btn).display : null,
      }
    };
  });

  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
})();
