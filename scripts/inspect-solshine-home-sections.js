const puppeteer = require('puppeteer');

async function inspectSections() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    // 1. Slider section (framer-fxzt7l)
    const slider = document.querySelector('.framer-fxzt7l');
    let sliderInfo = null;
    if (slider) {
      const style = window.getComputedStyle(slider);
      const h2 = slider.querySelector('h2');
      const p = slider.querySelector('p');

      // Look at card elements inside slider
      const cardContainers = Array.from(slider.querySelectorAll('div')).filter(el => {
        const s = window.getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return r.width >= 350 && r.height >= 450 && el.querySelector('img');
      });

      const cards = cardContainers.map(c => {
        const img = c.querySelector('img');
        const heading = c.querySelector('h3, h4, [class*="title"]') || c.querySelector('div[class*="text"]');
        const pTag = c.querySelector('p');
        const s = window.getComputedStyle(c);
        return {
          w: Math.round(c.getBoundingClientRect().width),
          h: Math.round(c.getBoundingClientRect().height),
          borderRadius: s.borderRadius,
          bg: s.backgroundColor,
          imgSrc: img ? img.src : null,
          title: heading ? heading.innerText : null,
          p: pTag ? pTag.innerText : null,
        };
      });

      // Navigation arrows
      const arrows = Array.from(slider.querySelectorAll('button, [class*="arrow"], [class*="nav"]')).map(a => ({
        tag: a.tagName,
        ariaLabel: a.getAttribute('aria-label'),
        bg: window.getComputedStyle(a).backgroundColor,
        color: window.getComputedStyle(a).color,
        w: a.offsetWidth,
        h: a.offsetHeight,
      }));

      sliderInfo = {
        bg: style.backgroundColor,
        padding: style.padding,
        h2: h2 ? {
          text: h2.innerText,
          fontSize: window.getComputedStyle(h2).fontSize,
          fontWeight: window.getComputedStyle(h2).fontWeight,
          lineHeight: window.getComputedStyle(h2).lineHeight,
        } : null,
        intro: p ? p.innerText : null,
        cardsCount: cards.length,
        cards: cards.slice(0, 3),
        arrows,
      };
    }

    // 2. Home FAQ Section
    const allSections = Array.from(document.querySelectorAll('section, main > div'));
    const faqSec = allSections.find(s => s.innerText.includes('HAVE ANY QUESTIONS?') || s.innerText.includes('Have any questions?'));
    let faqInfo = null;
    if (faqSec) {
      const style = window.getComputedStyle(faqSec);
      const h2 = faqSec.querySelector('h2');
      const questions = Array.from(faqSec.querySelectorAll('button, [class*="question"], [class*="accordion"]')).filter(el => {
        return el.innerText && el.innerText.length > 10;
      }).map(q => q.innerText.split('\n')[0]);

      faqInfo = {
        bg: style.backgroundColor,
        padding: style.padding,
        h2: h2 ? h2.innerText : null,
        questionsCount: questions.length,
        questions: questions.slice(0, 5),
      };
    }

    // 3. CTA section
    const ctaSec = allSections.find(s => (s.innerText.includes('Ready to get started') || s.innerText.includes('Innovations in green') || s.innerText.includes('GET STARTED') || s.innerText.includes('Request a Quote')) && s.querySelector('button, a'));
    let ctaInfo = null;
    if (ctaSec) {
      const style = window.getComputedStyle(ctaSec);
      const h2 = ctaSec.querySelector('h2, h3');
      const btn = ctaSec.querySelector('a, button');
      ctaInfo = {
        bg: style.backgroundColor,
        h2: h2 ? h2.innerText : null,
        btn: btn ? { text: btn.innerText, bg: window.getComputedStyle(btn).backgroundColor, color: window.getComputedStyle(btn).color } : null
      };
    }

    return { sliderInfo, faqInfo, ctaInfo };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

inspectSections().catch(console.error);
