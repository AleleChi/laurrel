const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureSection01() {
  const artifactDir = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
  const localDir = path.join(__dirname, '..', 'docs', 'reference', 'laurrel-about-reconstructed');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 1000 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  for (const vp of viewports) {
    console.log(`Setting viewport ${vp.name}...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 600));

    // Find the second section (Section 01: About Company)
    const sectionInfo = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main || main.children.length < 2) return null;
      const section = main.children[1]; // 0 is banner, 1 is About Company
      const rect = section.getBoundingClientRect();
      const h2 = section.querySelector('h2');
      const img = section.querySelector('img');
      const cta = section.querySelector('a');
      const eyebrow = section.querySelector('span');

      const h2Style = h2 ? window.getComputedStyle(h2) : null;
      const imgContainer = img ? img.parentElement : null;
      const imgStyle = imgContainer ? window.getComputedStyle(imgContainer) : null;
      const ctaStyle = cta ? window.getComputedStyle(cta) : null;

      return {
        top: window.scrollY + rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        metrics: {
          headlineText: h2 ? h2.innerText : '',
          headlineFontSize: h2Style ? h2Style.fontSize : '',
          headlineLineHeight: h2Style ? h2Style.lineHeight : '',
          headlineFontWeight: h2Style ? h2Style.fontWeight : '',
          imageWidth: imgContainer ? imgContainer.getBoundingClientRect().width : 0,
          imageHeight: imgContainer ? imgContainer.getBoundingClientRect().height : 0,
          imageBorderRadius: imgStyle ? imgStyle.borderRadius : '',
          ctaHeight: cta ? cta.getBoundingClientRect().height : 0,
          ctaBorderRadius: ctaStyle ? ctaStyle.borderRadius : '',
          ctaBgColor: ctaStyle ? ctaStyle.backgroundColor : '',
        }
      };
    });

    console.log(`Viewport ${vp.name} metrics:`, JSON.stringify(sectionInfo?.metrics, null, 2));

    if (sectionInfo) {
      await page.evaluate((top) => window.scrollTo(0, top), sectionInfo.top);
      await new Promise(r => setTimeout(r, 300));

      const filename = `section_01_about_company_${vp.name}.png`;
      const localPath = path.join(localDir, filename);
      const artifactPath = path.join(artifactDir, filename);

      await page.screenshot({
        path: localPath,
        clip: {
          x: 0,
          y: sectionInfo.top,
          width: vp.width,
          height: sectionInfo.height,
        },
      });

      await page.screenshot({
        path: artifactPath,
        clip: {
          x: 0,
          y: sectionInfo.top,
          width: vp.width,
          height: sectionInfo.height,
        },
      });

      console.log(`Saved screenshot: ${filename} (h: ${sectionInfo.height}px)`);
    }
  }

  await browser.close();
  console.log('Capture completed successfully!');
}

captureSection01().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
