const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function auditSolshineMotion() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to Solshine About page...');
  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));

  // 1. Initial Hero / Header inspection
  const heroInfo = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const h1Style = h1 ? window.getComputedStyle(h1) : null;
    const nav = document.querySelector('nav') || document.querySelector('header');
    const navStyle = nav ? window.getComputedStyle(nav) : null;
    return {
      h1Text: h1 ? h1.innerText : null,
      h1Style: h1Style ? {
        opacity: h1Style.opacity,
        transform: h1Style.transform,
        transition: h1Style.transition
      } : null,
      navStyle: navStyle ? {
        position: navStyle.position,
        top: navStyle.top,
        transform: navStyle.transform
      } : null
    };
  });

  console.log('Hero / Nav Info:', JSON.stringify(heroInfo, null, 2));

  // 2. Scan all sections and their contents
  const sections = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('section, [data-framer-name]'));
    return all.map((el, i) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        index: i,
        framerName: el.getAttribute('data-framer-name'),
        tag: el.tagName,
        top: window.scrollY + rect.top,
        height: rect.height,
        bg: style.backgroundColor,
        textPreview: (el.innerText || '').slice(0, 60).replace(/\n/g, ' ')
      };
    }).filter(s => s.height > 100);
  });

  console.log('Sections found:', sections.length);
  sections.slice(0, 10).forEach(s => console.log(`[${s.top}px - ${s.height}px] bg: ${s.bg} | ${s.textPreview}`));

  // 3. Find the Marquee element specifically
  const marqueeInfo = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('*'));
    for (const el of elements) {
      const text = el.innerText || '';
      if (text.includes('SOLAR') && text.includes('ENERGY') && text.length < 500) {
        const s = window.getComputedStyle(el);
        const parentS = el.parentElement ? window.getComputedStyle(el.parentElement) : null;
        return {
          tag: el.tagName,
          className: el.className,
          text: text.slice(0, 100),
          transform: s.transform,
          animation: s.animation,
          transition: s.transition,
          parentTransform: parentS ? parentS.transform : null,
          parentOverflow: parentS ? parentS.overflow : null,
          width: el.getBoundingClientRect().width,
          parentWidth: el.parentElement ? el.parentElement.getBoundingClientRect().width : null
        };
      }
    }
    return null;
  });

  console.log('Marquee info:', JSON.stringify(marqueeInfo, null, 2));

  // 4. Measure Marquee speed over time
  console.log('Observing Marquee movement over 3 seconds...');
  const marqueeSnapshots = [];
  for (let i = 0; i < 6; i++) {
    const snap = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*')).filter(el => {
        const t = el.innerText || '';
        return t.includes('SOLAR') && t.includes('ENERGY') && el.children.length > 0;
      });
      if (all.length === 0) return null;
      const target = all[all.length - 1];
      const rect = target.getBoundingClientRect();
      const style = window.getComputedStyle(target);
      return {
        time: Date.now(),
        left: rect.left,
        transform: style.transform
      };
    });
    if (snap) marqueeSnapshots.push(snap);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('Marquee snapshots:', JSON.stringify(marqueeSnapshots, null, 2));

  // 5. Scroll through page to observe entrance animations
  console.log('Scrolling through page to observe entrance transitions...');
  const scrollSteps = [500, 1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500];
  for (const pos of scrollSteps) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), pos);
    await new Promise(r => setTimeout(r, 400));
  }

  // 6. Inspect FAQ Accordion interaction
  console.log('Testing FAQ Accordion interaction on Solshine...');
  const faqInteraction = await page.evaluate(async () => {
    // Find FAQ question items
    const buttons = Array.from(document.querySelectorAll('button, [role="button"], h3, h4')).filter(el => {
      const t = el.innerText || '';
      return t.includes('Can I get') || t.includes('How much') || t.includes('warranty') || t.includes('maintenance') || t.includes('solar panels');
    });

    if (buttons.length === 0) return { error: 'No FAQ buttons found' };

    const firstBtn = buttons[0];
    const initialRect = firstBtn.getBoundingClientRect();
    const parentContainer = firstBtn.closest('div, section');

    // Look for answer panel
    const answersBefore = parentContainer ? parentContainer.innerText : '';

    firstBtn.click();
    await new Promise(r => setTimeout(r, 100));
    const duringRect = firstBtn.getBoundingClientRect();

    await new Promise(r => setTimeout(r, 400));
    const afterRect = firstBtn.getBoundingClientRect();
    const answersAfter = parentContainer ? parentContainer.innerText : '';

    return {
      buttonText: firstBtn.innerText.trim(),
      answersLengthBefore: answersBefore.length,
      answersLengthAfter: answersAfter.length,
      parentContainerTag: parentContainer ? parentContainer.tagName : null
    };
  });

  console.log('FAQ Interaction:', JSON.stringify(faqInteraction, null, 2));

  await browser.close();
}

auditSolshineMotion().catch(console.error);
