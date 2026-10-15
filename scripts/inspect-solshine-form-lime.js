const puppeteer = require('puppeteer');

async function inspectSolshineFormAndLime() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/services/solar-panel-cleaning-services', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    // 1. Form container
    const form = document.querySelector('form');
    // Find the enclosing card around form
    let formCard = form ? form.closest('.framer-6h5368') : null;
    let cardInfo = null;
    if (formCard) {
      const s = window.getComputedStyle(formCard);
      const h2 = formCard.querySelector('h2, h3, h4, p, div');
      cardInfo = {
        bg: s.backgroundColor,
        borderRadius: s.borderRadius,
        padding: s.padding,
        border: s.border,
        boxShadow: s.boxShadow,
        width: formCard.offsetWidth,
        height: formCard.offsetHeight,
        headingText: formCard.innerText.split('\n')[0],
      };
    }

    // Inputs inside form
    const inputs = form ? Array.from(form.querySelectorAll('input, textarea, button')).map(el => {
      const s = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        type: el.type,
        placeholder: el.placeholder,
        text: el.innerText,
        height: s.height,
        borderRadius: s.borderRadius,
        border: s.border,
        bg: s.backgroundColor,
        color: s.color,
        fontSize: s.fontSize,
        padding: s.padding
      };
    }) : [];

    // 2. Lime panel
    const limeCard = document.querySelector('.framer-18zyt0o');
    let limeInfo = null;
    if (limeCard) {
      const s = window.getComputedStyle(limeCard);
      const btn = limeCard.querySelector('a, button');
      const btnStyle = btn ? window.getComputedStyle(btn) : null;
      limeInfo = {
        bg: s.backgroundColor,
        borderRadius: s.borderRadius,
        padding: s.padding,
        color: s.color,
        width: limeCard.offsetWidth,
        height: limeCard.offsetHeight,
        rawText: limeCard.innerText,
        btn: btn ? {
          text: btn.innerText,
          bg: btnStyle.backgroundColor,
          color: btnStyle.color,
          borderRadius: btnStyle.borderRadius,
          padding: btnStyle.padding,
          fontSize: btnStyle.fontSize,
          fontWeight: btnStyle.fontWeight
        } : null
      };
    }

    // 3. Working Process cards (on the right)
    // Find the 3 cards in working process
    const wpHeader = Array.from(document.querySelectorAll('h2, h3')).find(el => el.innerText.includes('working process'));
    let wpSectionInfo = null;
    if (wpHeader) {
      const wpParent = wpHeader.closest('section') || wpHeader.parentElement;
      // find cards inside
      const cards = Array.from(wpParent.querySelectorAll('*')).filter(el => {
        const s = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return (s.borderRadius.includes('20') || s.borderRadius.includes('30') || s.borderRadius.includes('40') || s.borderRadius.includes('50')) && r.width > 200 && r.height > 100 && (el.innerText.includes('Free consultation') || el.innerText.includes('System design') || el.innerText.includes('Solar installation'));
      }).map(card => {
        const s = window.getComputedStyle(card);
        return {
          text: card.innerText.replace(/\n/g, ' - '),
          bg: s.backgroundColor,
          color: s.color,
          borderRadius: s.borderRadius,
          padding: s.padding,
          border: s.border
        };
      });
      wpSectionInfo = {
        header: wpHeader.innerText,
        cardCount: cards.length,
        cards
      };
    }

    return { cardInfo, inputs, limeInfo, wpSectionInfo };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

inspectSolshineFormAndLime().catch(console.error);
