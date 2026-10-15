const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function measureSolshineWhy() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();

  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '1840', width: 1840, height: 1000 },
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 800));

    const data = await page.evaluate(() => {
      const h2 = Array.from(document.querySelectorAll('h2')).find(el => el.innerText && el.innerText.includes('first choice for solar energy'));
      if (!h2) return null;

      let section = h2;
      while (section && section.parentElement && section.getBoundingClientRect().height < 500) {
        section = section.parentElement;
      }

      const sRect = section.getBoundingClientRect();
      const sStyle = window.getComputedStyle(section);

      const eyebrow = Array.from(section.querySelectorAll('p, span')).find(e => e.innerText && e.innerText.trim() === 'WHY CHOOSE');
      const eyebrowStyle = eyebrow ? window.getComputedStyle(eyebrow) : null;
      const eyebrowRect = eyebrow ? eyebrow.getBoundingClientRect() : null;

      const h2Style = window.getComputedStyle(h2);
      const h2Rect = h2.getBoundingClientRect();

      // Find icons & features
      const features = Array.from(section.querySelectorAll('*')).filter(el => 
        el.innerText && ['Trusted & friendly', 'Veteran owned', 'Availability', '24/7 Support'].includes(el.innerText.trim()) && el.children.length === 0
      );

      const featMetrics = features.map(f => {
        let block = f.parentElement;
        while (block && block.parentElement && block.getBoundingClientRect().width < 180) {
          block = block.parentElement;
        }
        const bRect = block.getBoundingClientRect();
        const icon = block.querySelector('img, svg');
        const iconRect = icon ? icon.getBoundingClientRect() : null;

        const fStyle = window.getComputedStyle(f);
        return {
          title: f.innerText.trim(),
          titleFont: `${fStyle.fontSize} / ${fStyle.fontWeight} / ${fStyle.lineHeight}`,
          blockRect: { width: bRect.width, height: bRect.height, left: bRect.left, top: bRect.top },
          iconRect: iconRect ? { width: iconRect.width, height: iconRect.height, left: iconRect.left, top: iconRect.top } : null
        };
      });

      // Find person image
      const imgs = Array.from(section.querySelectorAll('img')).filter(img => img.getBoundingClientRect().height > 300);
      const personImg = imgs[0];
      const pRect = personImg ? personImg.getBoundingClientRect() : null;

      return {
        section: {
          width: sRect.width,
          height: sRect.height,
          top: window.scrollY + sRect.top,
          bg: sStyle.backgroundColor,
          padding: sStyle.padding,
        },
        eyebrow: {
          text: eyebrow ? eyebrow.innerText.trim() : null,
          font: eyebrowStyle ? `${eyebrowStyle.fontSize} / ${eyebrowStyle.fontWeight} / ${eyebrowStyle.letterSpacing}` : null,
          rect: eyebrowRect ? { left: eyebrowRect.left, top: eyebrowRect.top, width: eyebrowRect.width, height: eyebrowRect.height } : null
        },
        h2: {
          text: h2.innerText.trim(),
          fontSize: h2Style.fontSize,
          lineHeight: h2Style.lineHeight,
          fontWeight: h2Style.fontWeight,
          letterSpacing: h2Style.letterSpacing,
          rect: { left: h2Rect.left, top: h2Rect.top, width: h2Rect.width, height: h2Rect.height }
        },
        gapH2ToFirstFeature: featMetrics[0] && featMetrics[0].iconRect ? (featMetrics[0].iconRect.top - h2Rect.bottom) : null,
        featureRow1Top: featMetrics[0] ? featMetrics[0].blockRect.top : null,
        featureRow2Top: featMetrics[2] ? featMetrics[2].blockRect.top : null,
        featureRowGap: (featMetrics[2] && featMetrics[0]) ? (featMetrics[2].blockRect.top - (featMetrics[0].blockRect.top + featMetrics[0].blockRect.height)) : null,
        personImage: pRect ? {
          width: pRect.width,
          height: pRect.height,
          left: pRect.left,
          top: pRect.top,
          bottom: pRect.bottom,
          distFromRightEdge: sRect.right - pRect.right,
          distFromBottomEdge: sRect.bottom - pRect.bottom
        } : null,
        features: featMetrics
      };
    });

    console.log(`--- SOLSHINE WHY CHOOSE (${vp.name}px) ---`);
    console.log(JSON.stringify(data, null, 2));

    if (data && data.section) {
      const shotPath = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', `solshine_why_choose_${vp.name}.png`);
      const artifactPath = `C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39\\solshine_why_choose_${vp.name}.png`;
      await page.evaluate((top) => window.scrollTo(0, top), data.section.top);
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({
        path: shotPath,
        clip: {
          x: 0,
          y: data.section.top,
          width: vp.width,
          height: Math.round(data.section.height)
        }
      });
      await page.screenshot({
        path: artifactPath,
        clip: {
          x: 0,
          y: data.section.top,
          width: vp.width,
          height: Math.round(data.section.height)
        }
      });
      console.log(`Saved screenshot to ${shotPath}`);
    }
  }

  await browser.close();
}

measureSolshineWhy().catch(console.error);
