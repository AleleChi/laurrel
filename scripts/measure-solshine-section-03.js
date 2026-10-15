const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function measure() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();

  // 1. Measure at 1440px
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 800));

  const data1440 = await page.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText && el.innerText.includes('10+ years of experience'));
    if (!h2) return { error: 'H2 not found' };

    // Find the enclosing section
    let section = h2;
    while (section && section.parentElement && section.tagName !== 'SECTION' && section.getBoundingClientRect().height < 500) {
      section = section.parentElement;
    }

    const sRect = section.getBoundingClientRect();
    const sStyle = window.getComputedStyle(section);

    // Eyebrow
    const allP = Array.from(section.querySelectorAll('p, span'));
    const eyebrow = allP.find(el => el.innerText && el.innerText.trim() === 'ABOUT OUR COMPANY');
    const eyebrowStyle = eyebrow ? window.getComputedStyle(eyebrow) : null;

    // Heading
    const h2Style = window.getComputedStyle(h2);
    const h2Rect = h2.getBoundingClientRect();

    // Supporting paragraph
    const p = Array.from(section.querySelectorAll('p')).find(el => el.innerText && el.innerText.includes('With over a decade'));
    const pStyle = p ? window.getComputedStyle(p) : null;
    const pRect = p ? p.getBoundingClientRect() : null;

    // Find columns
    const colHeadings = Array.from(section.querySelectorAll('*')).filter(el => 
      el.innerText && ['COMMERCIAL PROJECTS', 'RESIDENTIAL PROJECTS', 'INDUSTRY EXPERIENCE'].includes(el.innerText.trim()) && el.children.length === 0
    );

    const cols = colHeadings.map(ch => {
      let col = ch.parentElement;
      while (col && col.parentElement && col.getBoundingClientRect().width < 250) {
        col = col.parentElement;
      }
      const cRect = col.getBoundingClientRect();
      const chStyle = window.getComputedStyle(ch);

      const allText = Array.from(col.querySelectorAll('*')).filter(e => e.children.length === 0 && e.innerText && e.innerText.trim());
      const largeNum = allText.find(e => parseFloat(window.getComputedStyle(e).fontSize) > 50);
      const largeNumStyle = largeNum ? window.getComputedStyle(largeNum) : null;
      const largeNumRect = largeNum ? largeNum.getBoundingClientRect() : null;

      const desc = allText.find(e => e.innerText && (e.innerText.includes('Successfully delivered') || e.innerText.includes('Trusted by hundreds') || e.innerText.includes('Extensive industry')));
      const descStyle = desc ? window.getComputedStyle(desc) : null;
      const descRect = desc ? desc.getBoundingClientRect() : null;

      const lines = Array.from(col.querySelectorAll('*')).filter(e => {
        const r = e.getBoundingClientRect();
        return r.height <= 4 && r.width > 50;
      });
      const line = lines[0];
      const lineRect = line ? line.getBoundingClientRect() : null;
      const lineStyle = line ? window.getComputedStyle(line) : null;

      return {
        label: ch.innerText.trim(),
        labelFont: chStyle ? `${chStyle.fontSize} / ${chStyle.fontWeight} / ${chStyle.letterSpacing}` : null,
        labelColor: chStyle ? chStyle.color : null,
        labelRect: { width: ch.getBoundingClientRect().width, height: ch.getBoundingClientRect().height, left: ch.getBoundingClientRect().left, top: ch.getBoundingClientRect().top },
        lineRect: lineRect ? { width: lineRect.width, height: lineRect.height, left: lineRect.left, top: lineRect.top } : null,
        lineColor: lineStyle ? (lineStyle.backgroundColor || lineStyle.borderColor) : null,
        largeNumText: largeNum ? largeNum.innerText.trim() : null,
        largeNumFont: largeNumStyle ? `${largeNumStyle.fontSize} / ${largeNumStyle.fontWeight} / ${largeNumStyle.lineHeight}` : null,
        largeNumRect: largeNumRect ? { width: largeNumRect.width, height: largeNumRect.height, left: largeNumRect.left, top: largeNumRect.top } : null,
        descText: desc ? desc.innerText.trim() : null,
        descFont: descStyle ? `${descStyle.fontSize} / ${descStyle.lineHeight}` : null,
        descRect: descRect ? { width: descRect.width, height: descRect.height, left: descRect.left, top: descRect.top } : null,
        colRect: { width: cRect.width, height: cRect.height, left: cRect.left, top: cRect.top }
      };
    });

    const col2 = document.querySelector('*');
    const el212 = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === '212' && e.children.length === 0);
    const labelRes = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === 'RESIDENTIAL PROJECTS' && e.children.length === 0);
    const desc = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.includes('Trusted by hundreds') && e.children.length === 0);

    const lStyle = el212 ? window.getComputedStyle(el212) : null;
    const labStyle = labelRes ? window.getComputedStyle(labelRes) : null;
    const dStyle = desc ? window.getComputedStyle(desc) : null;

    return {
      section: {
        width: sRect.width,
        height: sRect.height,
        top: window.scrollY + sRect.top,
        left: sRect.left,
        bg: sStyle.backgroundColor,
        padding: sStyle.padding,
      },
      eyebrow: {
        text: eyebrow ? eyebrow.innerText.trim() : null,
        fontSize: eyebrowStyle ? eyebrowStyle.fontSize : null,
        fontWeight: eyebrowStyle ? eyebrowStyle.fontWeight : null,
        letterSpacing: eyebrowStyle ? eyebrowStyle.letterSpacing : null,
        color: eyebrowStyle ? eyebrowStyle.color : null
      },
      headline: {
        text: h2.innerText.trim(),
        fontSize: h2Style.fontSize,
        lineHeight: h2Style.lineHeight,
        letterSpacing: h2Style.letterSpacing,
        fontWeight: h2Style.fontWeight,
        color: h2Style.color,
        width: h2Rect.width,
        height: h2Rect.height,
        left: h2Rect.left,
        top: h2Rect.top
      },
      intro: {
        text: p ? p.innerText.trim() : null,
        fontSize: pStyle ? pStyle.fontSize : null,
        lineHeight: pStyle ? pStyle.lineHeight : null,
        color: pStyle ? pStyle.color : null,
        width: pRect ? pRect.width : null,
        height: pRect ? pRect.height : null,
        left: pRect ? pRect.left : null,
        top: pRect ? pRect.top : null
      },
      columnDetails: {
        largeNumber: el212 ? {
          fontSize: lStyle.fontSize,
          lineHeight: lStyle.lineHeight,
          fontWeight: lStyle.fontWeight,
          fontFamily: lStyle.fontFamily,
          letterSpacing: lStyle.letterSpacing,
          height: el212.getBoundingClientRect().height
        } : null,
        label: labelRes ? {
          fontSize: labStyle.fontSize,
          lineHeight: labStyle.lineHeight,
          fontWeight: labStyle.fontWeight,
          letterSpacing: labStyle.letterSpacing,
          color: labStyle.color,
          height: labelRes.getBoundingClientRect().height
        } : null,
        description: desc ? {
          fontSize: dStyle.fontSize,
          lineHeight: dStyle.lineHeight,
          color: dStyle.color,
          width: desc.getBoundingClientRect().width,
          height: desc.getBoundingClientRect().height
        } : null
      }
    };
  });

  console.log('--- SOLSHINE 1440PX DATA ---');
  console.log(JSON.stringify(data1440, null, 2));

  // Take screenshot of Solshine section
  if (data1440.section) {
    const shotPath = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'solshine_section_03_three_col_1440.png');
    const artifactPath = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39\\solshine_section_03_three_col_1440.png';
    const dir = path.dirname(shotPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    await page.evaluate((top) => window.scrollTo(0, top), data1440.section.top);
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({
      path: shotPath,
      clip: {
        x: 0,
        y: data1440.section.top,
        width: 1440,
        height: Math.round(data1440.section.height)
      }
    });
    await page.screenshot({
      path: artifactPath,
      clip: {
        x: 0,
        y: data1440.section.top,
        width: 1440,
        height: Math.round(data1440.section.height)
      }
    });
    console.log('Saved Solshine section screenshot to:', shotPath);
  }

  // 2. Measure at 1840px
  await page.setViewport({ width: 1840, height: 1000 });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 800));

  const data1840 = await page.evaluate(() => {
    const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText && el.innerText.includes('10+ years of experience'));
    if (!h2) return null;
    let section = h2;
    while (section && section.parentElement && section.tagName !== 'SECTION' && section.getBoundingClientRect().height < 500) {
      section = section.parentElement;
    }
    const sRect = section.getBoundingClientRect();
    const h2Rect = h2.getBoundingClientRect();
    return {
      sectionWidth: sRect.width,
      sectionHeight: sRect.height,
      h2Width: h2Rect.width,
      h2Left: h2Rect.left,
    };
  });

  console.log('--- SOLSHINE 1840PX DATA ---');
  console.log(JSON.stringify(data1840, null, 2));

  await browser.close();
}

measure().catch(console.error);
