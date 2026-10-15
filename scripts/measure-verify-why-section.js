const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function verifyWhySection() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'desktop_1840', width: 1840, height: 1000 },
    { name: 'laptop_1024', width: 1024, height: 800 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
    { name: 'mobile_360', width: 360, height: 740 },
  ];

  const results = {};

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 600));

    const data = await page.evaluate(() => {
      const section = document.querySelector('section[aria-label="Why Laurrel Services"]');
      if (!section) return null;

      const sRect = section.getBoundingClientRect();
      const sStyle = window.getComputedStyle(section);

      const eyebrow = section.querySelector('span');
      const eyebrowRect = eyebrow ? eyebrow.getBoundingClientRect() : null;

      const h2 = section.querySelector('h2');
      const h2Rect = h2 ? h2.getBoundingClientRect() : null;

      const items = Array.from(section.querySelectorAll('h3')).map(h3 => {
        const itemBlock = h3.parentElement;
        const bRect = itemBlock ? itemBlock.getBoundingClientRect() : null;
        const iconTile = itemBlock ? itemBlock.querySelector('div') : null;
        const iRect = iconTile ? iconTile.getBoundingClientRect() : null;
        return {
          title: h3.innerText.trim(),
          blockTop: bRect ? bRect.top : null,
          iconTop: iRect ? iRect.top : null,
          iconHeight: iRect ? iRect.height : null
        };
      });

      const workerImg = section.querySelector('img');
      const imgRect = workerImg ? workerImg.getBoundingClientRect() : null;

      return {
        sectionHeight: sRect.height,
        sectionTop: window.scrollY + sRect.top,
        paddingTop: sStyle.paddingTop,
        eyebrowTop: eyebrowRect ? eyebrowRect.top : null,
        h2Top: h2Rect ? h2Rect.top : null,
        h2Bottom: h2Rect ? h2Rect.bottom : null,
        gapH2ToFirstFeature: (items[0] && items[0].iconTop && h2Rect) ? (items[0].iconTop - h2Rect.bottom) : null,
        featureRow1Top: items[0] ? items[0].iconTop : null,
        featureRow2Top: items[2] ? items[2].iconTop : null,
        workerImg: imgRect ? {
          width: imgRect.width,
          height: imgRect.height,
          left: imgRect.left,
          top: imgRect.top,
          bottom: imgRect.bottom,
          distFromBottom: sRect.bottom - imgRect.bottom
        } : null,
        items
      };
    });

    results[vp.name] = data;

    if (data && data.sectionTop !== undefined) {
      // Temporarily hide fixed header so it doesn't obstruct section in screenshot
      await page.evaluate(() => {
        const header = document.querySelector('header');
        if (header) header.style.display = 'none';
      });

      const localPath = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', `laurrel_why_section_${vp.name}.png`);
      const artifactPath = `C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39\\laurrel_why_section_${vp.name}.png`;

      // Scroll through section so all whileInView animations trigger cleanly
      await page.evaluate(() => {
        const sec = document.querySelector('section[aria-label="Why Laurrel Services"]');
        const img = sec ? sec.querySelector('img') : null;
        if (img) img.scrollIntoView({ block: 'center' });
      });
      await new Promise(r => setTimeout(r, 800));

      await page.evaluate((top) => window.scrollTo(0, top), data.sectionTop);
      await new Promise(r => setTimeout(r, 600));

      await page.screenshot({
        path: localPath,
        clip: {
          x: 0,
          y: data.sectionTop,
          width: vp.width,
          height: Math.round(data.sectionHeight)
        }
      });

      await page.screenshot({
        path: artifactPath,
        clip: {
          x: 0,
          y: data.sectionTop,
          width: vp.width,
          height: Math.round(data.sectionHeight)
        }
      });

      console.log(`Captured ${vp.name} screenshot.`);
    }
  }

  console.log('--- LAURREL WHY SECTION MEASUREMENTS ---');
  console.log(JSON.stringify(results, null, 2));

  // Generate clean side-by-side comparison
  const solshinePath = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'solshine_why_choose_1440.png');
  const laurrelPath = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'laurrel_why_section_desktop_1440.png');
  const comparisonLocal = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'solshine_vs_laurrel_why_comparison.png');
  const comparisonArtifact = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39\\solshine_vs_laurrel_why_comparison.png';

  if (fs.existsSync(solshinePath) && fs.existsSync(laurrelPath)) {
    const solshineMeta = await sharp(solshinePath).metadata();
    const laurrelMeta = await sharp(laurrelPath).metadata();

    const targetHeight = Math.max(solshineMeta.height, laurrelMeta.height);
    const solshineResized = await sharp(solshinePath)
      .resize({ height: targetHeight, fit: 'contain', background: { r: 202, g: 243, b: 29, alpha: 1 } })
      .toBuffer();
    const laurrelResized = await sharp(laurrelPath)
      .resize({ height: targetHeight, fit: 'contain', background: { r: 200, g: 232, b: 11, alpha: 1 } })
      .toBuffer();

    const solResMeta = await sharp(solshineResized).metadata();
    const lauResMeta = await sharp(laurrelResized).metadata();

    const totalWidth = solResMeta.width + lauResMeta.width;

    await sharp({
      create: {
        width: totalWidth,
        height: targetHeight,
        channels: 4,
        background: { r: 32, g: 32, b: 36, alpha: 1 }
      }
    })
    .composite([
      { input: solshineResized, left: 0, top: 0 },
      { input: laurrelResized, left: solResMeta.width, top: 0 }
    ])
    .toFile(comparisonLocal);

    await sharp(comparisonLocal).toFile(comparisonArtifact);
    console.log('Saved clean comparison to', comparisonLocal, 'and artifact.');
  }

  await browser.close();
}

verifyWhySection().catch(console.error);
