const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function auditSolshineDetails() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);

  const report = await page.evaluate(async () => {
    const results = {};

    // 1. Inspect Marquee section
    const marqueeSec = document.querySelector('.framer-152oc03') || 
      Array.from(document.querySelectorAll('section')).find(s => s.innerText && s.innerText.includes('Renewable Energy'));

    if (marqueeSec) {
      const secStyle = window.getComputedStyle(marqueeSec);
      const innerTracks = Array.from(marqueeSec.querySelectorAll('*')).filter(el => {
        const s = window.getComputedStyle(el);
        return s.animation || s.transform !== 'none' || (el.className && el.className.includes('ticker') || el.className.includes('marquee'));
      });

      // Find animated elements inside marquee
      const animatedEls = Array.from(marqueeSec.querySelectorAll('*')).map(el => {
        const s = window.getComputedStyle(el);
        return {
          tag: el.tagName,
          className: el.className,
          animation: s.animation,
          animationName: s.animationName,
          animationDuration: s.animationDuration,
          animationTimingFunction: s.animationTimingFunction,
          animationIterationCount: s.animationIterationCount,
          transform: s.transform,
          display: s.display,
          width: el.getBoundingClientRect().width,
          text: (el.innerText || '').slice(0, 50)
        };
      }).filter(e => e.animation && e.animation !== 'none' || (e.transform && e.transform !== 'none'));

      results.marquee = {
        secBg: secStyle.backgroundColor,
        secHeight: marqueeSec.getBoundingClientRect().height,
        animatedEls
      };
    }

    // 2. Measure Marquee real speed by checking transform delta over 1000ms
    if (marqueeSec) {
      const animatedChild = marqueeSec.querySelector('[style*="transform"], [class*="ticker"], [class*="marquee"]') || marqueeSec.children[0];
      const t1 = Date.now();
      const r1 = animatedChild ? animatedChild.getBoundingClientRect().left : 0;
      await new Promise(r => setTimeout(r, 1000));
      const t2 = Date.now();
      const r2 = animatedChild ? animatedChild.getBoundingClientRect().left : 0;
      results.marqueeSpeed = {
        deltaX: r2 - r1,
        timeMs: t2 - t1,
        speedPxPerSec: Math.round(((r2 - r1) / (t2 - t1)) * 1000)
      };
    }

    // 3. Inspect Accordion
    const faqH2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText && h.innerText.includes('Have any questions'));
    if (faqH2) {
      let faqSection = faqH2.parentElement;
      while (faqSection && faqSection.parentElement && faqSection.getBoundingClientRect().height < 400) {
        faqSection = faqSection.parentElement;
      }

      // Check all accordion triggers
      const items = Array.from(faqSection.querySelectorAll('[data-framer-name], button, div')).filter(el => {
        return el.innerText && (el.innerText.includes('How long does a solar') || el.innerText.includes('Do solar panels work'));
      });

      // Find first question click trigger
      const firstQuestion = items.find(el => el.tagName === 'H4' || (el.innerText && el.innerText.startsWith('How long')));
      const trigger = firstQuestion ? (firstQuestion.closest('button, [role="button"]') || firstQuestion.parentElement) : null;

      results.faq = {
        sectionHeight: faqSection.getBoundingClientRect().height,
        triggerTag: trigger ? trigger.tagName : null,
        triggerClass: trigger ? trigger.className : null
      };
    }

    return results;
  });

  console.log('--- SOLSHINE DETAILED AUDIT ---');
  console.log(JSON.stringify(report, null, 2));

  // Let's also inspect Framer styles for animation keyframes
  const cssKeyframes = await page.evaluate(() => {
    const kfs = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.type === CSSRule.KEYFRAMES_RULE) {
            kfs.push({
              name: rule.name,
              cssText: rule.cssText.slice(0, 200)
            });
          }
        }
      } catch (e) {
        // cross-origin stylesheets
      }
    }
    return kfs;
  });

  console.log('Keyframes found:', cssKeyframes);

  await browser.close();
}

auditSolshineDetails().catch(console.error);
