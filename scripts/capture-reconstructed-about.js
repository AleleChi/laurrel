const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function capture() {
  const artifactDir = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
  const localDir = path.join(__dirname, '..', 'docs', 'reference', 'laurrel-about-reconstructed');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  const viewports = [
    { name: '1440', width: 1440, height: 900 },
    { name: '1280', width: 1280, height: 800 },
    { name: '768', width: 768, height: 1024 },
    { name: '390', width: 390, height: 844 },
    { name: '360', width: 360, height: 780 },
  ];

  console.log('Navigating to http://localhost:3000/about...');
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 600));

  // 1. Capture full page across viewports at 1x scale factor to prevent Chrome texture memory overflow
  for (const vp of viewports) {
    console.log(`Capturing viewport ${vp.name}...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await new Promise(r => setTimeout(r, 400));

    const localFile = path.join(localDir, `reconstructed_about_full_${vp.name}.png`);
    const artifactFile = path.join(artifactDir, `reconstructed_about_${vp.name}.png`);

    await page.screenshot({ path: localFile, fullPage: true });
    await page.screenshot({ path: artifactFile, fullPage: true });
    console.log(`Saved full page ${vp.name}`);
  }

  // 2. Set to 1440px for individual section captures
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 400));

  const sections = await page.evaluate(() => {
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    const mainChildren = Array.from(main ? main.children : []);

    const res = [];
    mainChildren.forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      res.push({
        name: `section_0${index + 1}`,
        tag: child.tagName,
        top: window.scrollY + rect.top,
        height: rect.height,
        width: rect.width,
      });
    });

    if (footer) {
      const rect = footer.getBoundingClientRect();
      res.push({
        name: 'section_07_footer',
        tag: 'FOOTER',
        top: window.scrollY + rect.top,
        height: rect.height,
        width: rect.width,
      });
    }

    return res;
  });

  const sectionNames = [
    'reconstructed_01_banner_1440',
    'reconstructed_02_company_1440',
    'reconstructed_03_what_we_do_1440',
    'reconstructed_04_why_1440',
    'reconstructed_05_marquee_1440',
    'reconstructed_06_faq_1440',
    'reconstructed_07_footer_1440',
  ];

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const name = sectionNames[i] || `reconstructed_0${i + 1}_1440`;
    console.log(`Capturing ${name}...`);

    await page.evaluate((top) => window.scrollTo(0, top), sec.top);
    await new Promise(r => setTimeout(r, 300));

    const localFile = path.join(localDir, `${name}.png`);
    const artifactFile = path.join(artifactDir, `${name}.png`);

    await page.screenshot({
      path: localFile,
      clip: {
        x: 0,
        y: sec.top,
        width: 1440,
        height: Math.min(sec.height, 2000),
      },
    });

    await page.screenshot({
      path: artifactFile,
      clip: {
        x: 0,
        y: sec.top,
        width: 1440,
        height: Math.min(sec.height, 2000),
      },
    });
    console.log(`Saved ${name}`);
  }

  await browser.close();
  console.log('Finished capturing all responsive screenshots!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
