const puppeteer = require('puppeteer');
const fs = require('fs');

async function auditScrollEntrances() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);

  // Measure initial state of section elements before scroll
  const sectionPositions = await page.evaluate(() => {
    const targets = [
      { name: 'Company', h2Text: 'Innovations in green' },
      { name: 'WhatWeDo', h2Text: '10+ years of experience' },
      { name: 'WhyChoose', h2Text: 'first choice for solar' },
      { name: 'FAQ', h2Text: 'Have any questions' },
      { name: 'Footer', tag: 'footer' }
    ];

    return targets.map(t => {
      let el = null;
      if (t.h2Text) {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => h.innerText && h.innerText.includes(t.h2Text));
        if (h2) {
          el = h2;
          while (el && el.parentElement && el.getBoundingClientRect().height < 400) el = el.parentElement;
        }
      } else if (t.tag) {
        el = document.querySelector(t.tag);
      }
      return {
        name: t.name,
        top: el ? Math.round(window.scrollY + el.getBoundingClientRect().top) : null,
        height: el ? Math.round(el.getBoundingClientRect().height) : null
      };
    });
  });

  console.log('Section Positions:', sectionPositions);

  // Now, for each section, scroll to 300px above it, and inspect the styles of elements inside
  const entranceAudit = {};

  for (const sec of sectionPositions) {
    if (!sec.top) continue;
    
    // Scroll to just before section enters
    const targetY = Math.max(0, sec.top - 600);
    await page.evaluate((y) => window.scrollTo(0, y), targetY);
    await new Promise(r => setTimeout(r, 400));

    // Scroll into section trigger
    await page.evaluate((y) => window.scrollTo({ top: y + 200, behavior: 'smooth' }), targetY);
    
    // Sample at 0ms, 150ms, 350ms, 650ms, 1000ms
    const timestamps = [0, 150, 350, 650, 1000];
    const samples = [];
    for (const delay of [0, 150, 200, 300, 350]) {
      await new Promise(r => setTimeout(r, delay));
      const state = await page.evaluate((secName) => {
        const h2 = Array.from(document.querySelectorAll('h2')).find(h => {
          if (secName === 'Company') return h.innerText && h.innerText.includes('Innovations');
          if (secName === 'WhatWeDo') return h.innerText && h.innerText.includes('10+ years');
          if (secName === 'WhyChoose') return h.innerText && h.innerText.includes('first choice');
          if (secName === 'FAQ') return h.innerText && h.innerText.includes('Have any questions');
          return false;
        });

        if (!h2) return null;
        let container = h2;
        while (container && container.parentElement && container.getBoundingClientRect().height < 400) {
          container = container.parentElement;
        }

        const h2Style = window.getComputedStyle(h2);
        const img = container.querySelector('img');
        const imgStyle = img ? window.getComputedStyle(img) : null;

        return {
          h2Opacity: h2Style.opacity,
          h2Transform: h2Style.transform,
          imgOpacity: imgStyle ? imgStyle.opacity : null,
          imgTransform: imgStyle ? imgStyle.transform : null
        };
      }, sec.name);
      samples.push(state);
    }
    entranceAudit[sec.name] = samples;
  }

  console.log('--- ENTRANCE AUDIT ---');
  console.log(JSON.stringify(entranceAudit, null, 2));

  await browser.close();
}

auditScrollEntrances().catch(console.error);
