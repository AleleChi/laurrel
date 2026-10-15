const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function inspectSolshineServices() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to Solshine homepage...');
  await page.goto('https://solshine.framer.website/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));

  // Find the lime section with "Excellent Services" or similar
  const sectionData = await page.evaluate(() => {
    // Look for headings with "Services"
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, span, p')).filter(el => {
      const text = el.innerText || '';
      return text.toLowerCase().includes('services') || text.toLowerCase().includes('excellent');
    });

    // Find section with lime background
    const sections = Array.from(document.querySelectorAll('section, div')).filter(el => {
      const bg = window.getComputedStyle(el).backgroundColor;
      // check if lime (#CAF31D or similar rgb(202, 243, 29))
      return (bg === 'rgb(202, 243, 29)' || bg === 'rgb(200, 232, 11)') && el.getBoundingClientRect().height > 300;
    });

    const targetSection = sections[0];
    if (!targetSection) {
      return { error: 'Lime section not found', sectionsCount: sections.length };
    }

    const sRect = targetSection.getBoundingClientRect();
    const sStyle = window.getComputedStyle(targetSection);

    // Find all text and elements inside targetSection
    const h2 = targetSection.querySelector('h2');
    const h2Style = h2 ? window.getComputedStyle(h2) : null;
    const h2Rect = h2 ? h2.getBoundingClientRect() : null;

    const eyebrow = Array.from(targetSection.querySelectorAll('span, p, h4, div')).find(el => {
      const t = el.innerText ? el.innerText.trim() : '';
      return t === 'EXCELLENT SERVICES' || t === 'OUR SERVICES' || (t.includes('SERVICES') && t.length < 25 && el !== h2);
    });
    const eyebrowStyle = eyebrow ? window.getComputedStyle(eyebrow) : null;
    const eyebrowRect = eyebrow ? eyebrow.getBoundingClientRect() : null;

    // Find CTA button
    const cta = targetSection.querySelector('a, button');
    const ctaStyle = cta ? window.getComputedStyle(cta) : null;
    const ctaRect = cta ? cta.getBoundingClientRect() : null;

    // Find arrow inside CTA
    const arrowHolder = cta ? cta.querySelector('span, div') : null;
    const arrowStyle = arrowHolder ? window.getComputedStyle(arrowHolder) : null;
    const arrowRect = arrowHolder ? arrowHolder.getBoundingClientRect() : null;

    // Find service items/rows
    // Usually on the right side
    const rightColItems = Array.from(targetSection.querySelectorAll('h3, h4, h5')).map(h => {
      const row = h.closest('div[style*="flex"], div[class*="flex"], li') || h.parentElement.parentElement;
      const rowRect = row ? row.getBoundingClientRect() : null;
      const imgOrSvg = row ? row.querySelector('svg, img') : null;
      const imgRect = imgOrSvg ? imgOrSvg.getBoundingClientRect() : null;
      const desc = row ? Array.from(row.querySelectorAll('p')).find(p => p.innerText && p.innerText.length > 20) : null;
      const descStyle = desc ? window.getComputedStyle(desc) : null;
      const hStyle = window.getComputedStyle(h);

      return {
        title: h.innerText.trim(),
        titleFontSize: hStyle.fontSize,
        titleFontWeight: hStyle.fontWeight,
        titleLineHeight: hStyle.lineHeight,
        descText: desc ? desc.innerText.trim() : null,
        descFontSize: descStyle ? descStyle.fontSize : null,
        descLineHeight: descStyle ? descStyle.lineHeight : null,
        illustration: imgOrSvg ? {
          tag: imgOrSvg.tagName,
          width: imgRect.width,
          height: imgRect.height,
          src: imgOrSvg.src || null,
          innerHTML: imgOrSvg.tagName === 'svg' ? imgOrSvg.outerHTML.slice(0, 150) : null
        } : null,
        rowRect: rowRect ? {
          width: rowRect.width,
          height: rowRect.height,
          left: rowRect.left,
          top: rowRect.top
        } : null
      };
    });

    return {
      section: {
        width: sRect.width,
        height: sRect.height,
        top: window.scrollY + sRect.top,
        padding: sStyle.padding,
        paddingTop: sStyle.paddingTop,
        paddingBottom: sStyle.paddingBottom,
        paddingLeft: sStyle.paddingLeft,
        paddingRight: sStyle.paddingRight,
        bg: sStyle.backgroundColor
      },
      eyebrow: eyebrow ? {
        text: eyebrow.innerText.trim(),
        fontSize: eyebrowStyle.fontSize,
        fontWeight: eyebrowStyle.fontWeight,
        textTransform: eyebrowStyle.textTransform,
        rect: { left: eyebrowRect.left, top: eyebrowRect.top, width: eyebrowRect.width, height: eyebrowRect.height }
      } : null,
      h2: h2 ? {
        text: h2.innerText.trim(),
        fontSize: h2Style.fontSize,
        fontWeight: h2Style.fontWeight,
        lineHeight: h2Style.lineHeight,
        letterSpacing: h2Style.letterSpacing,
        rect: { left: h2Rect.left, top: h2Rect.top, width: h2Rect.width, height: h2Rect.height }
      } : null,
      cta: cta ? {
        text: cta.innerText.trim(),
        href: cta.getAttribute('href') || cta.href,
        bg: ctaStyle.backgroundColor,
        color: ctaStyle.color,
        borderRadius: ctaStyle.borderRadius,
        width: ctaRect.width,
        height: ctaRect.height,
        padding: ctaStyle.padding,
        arrowHolder: arrowHolder ? {
          bg: arrowStyle.backgroundColor,
          width: arrowRect.width,
          height: arrowRect.height,
          borderRadius: arrowStyle.borderRadius
        } : null
      } : null,
      services: rightColItems
    };
  });

  console.log('--- SOLSHINE HOMEPAGE SERVICES SECTION DATA ---');
  console.log(JSON.stringify(sectionData, null, 2));

  // Save reference screenshot
  if (sectionData && sectionData.section && sectionData.section.top !== undefined) {
    const shotPath = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'solshine_homepage_excellent_services_1440.png');
    const artifactPath = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39\\solshine_homepage_excellent_services_1440.png';

    // Hide fixed header for clean screenshot
    await page.evaluate(() => {
      const header = document.querySelector('header, nav');
      if (header) header.style.display = 'none';
    });

    await page.evaluate((top) => window.scrollTo(0, top), sectionData.section.top);
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: shotPath,
      clip: {
        x: 0,
        y: sectionData.section.top,
        width: 1440,
        height: Math.round(sectionData.section.height)
      }
    });

    await page.screenshot({
      path: artifactPath,
      clip: {
        x: 0,
        y: sectionData.section.top,
        width: 1440,
        height: Math.round(sectionData.section.height)
      }
    });

    console.log('Saved Solshine screenshot to:', shotPath);
  }

  // Also inspect at 1840px
  await page.setViewport({ width: 1840, height: 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 500));

  const data1840 = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section, div')).filter(el => {
      const bg = window.getComputedStyle(el).backgroundColor;
      return (bg === 'rgb(202, 243, 29)' || bg === 'rgb(200, 232, 11)') && el.getBoundingClientRect().height > 300;
    });
    const s = sections[0];
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const style = window.getComputedStyle(s);
    const h2 = s.querySelector('h2');
    const h2R = h2 ? h2.getBoundingClientRect() : null;
    return {
      width: r.width,
      height: r.height,
      top: window.scrollY + r.top,
      padding: style.padding,
      h2Width: h2R ? h2R.width : null,
      h2Height: h2R ? h2R.height : null
    };
  });
  console.log('--- SOLSHINE 1840px DATA ---', JSON.stringify(data1840, null, 2));

  if (data1840 && data1840.top) {
    const shotPath1840 = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'solshine_homepage_excellent_services_1840.png');
    const artifactPath1840 = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39\\solshine_homepage_excellent_services_1840.png';

    await page.evaluate(() => {
      const header = document.querySelector('header, nav');
      if (header) header.style.display = 'none';
    });

    await page.evaluate((top) => window.scrollTo(0, top), data1840.top);
    await new Promise(r => setTimeout(r, 600));

    await page.screenshot({
      path: shotPath1840,
      clip: {
        x: 0,
        y: data1840.top,
        width: 1840,
        height: Math.round(data1840.height)
      }
    });

    await page.screenshot({
      path: artifactPath1840,
      clip: {
        x: 0,
        y: data1840.top,
        width: 1840,
        height: Math.round(data1840.height)
      }
    });

    console.log('Saved Solshine 1840px screenshot to:', shotPath1840);
  }

  await browser.close();
}

inspectSolshineServices().catch(console.error);
