const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateFinalPreview() {
  console.log('Generating production social preview: laurrel-social-preview-v2.jpg and .webp...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1200, height: 630, deviceScaleFactor: 2 }
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630 });

  const logoSymbolB64 = fs.readFileSync('public/assets/brand/laurrel-symbol.png').toString('base64');
  const cleaningHeroB64 = fs.readFileSync('public/assets/hero/cleaning-hero.jpg').toString('base64');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1200px;
          height: 630px;
          overflow: hidden;
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #270030;
          display: flex;
        }
        .left-col {
          width: 560px;
          height: 630px;
          padding: 64px 56px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: linear-gradient(150deg, #340040 0%, #200027 100%);
          position: relative;
          z-index: 2;
          border-right: 1px solid rgba(255, 255, 255, 0.08);
        }
        .logo-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo-symbol {
          height: 48px;
          width: 48px;
          object-fit: contain;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .logo-brand {
          font-size: 26px;
          font-weight: 800;
          color: #FFFFFF;
          letter-spacing: 0.06em;
          line-height: 1;
        }
        .logo-services {
          font-size: 11px;
          font-weight: 700;
          color: #C8E80B;
          letter-spacing: 0.26em;
          margin-top: 4px;
        }
        .content-wrap {
          margin-top: -10px;
        }
        .descriptor {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #C8E80B;
          margin-bottom: 24px;
        }
        .descriptor-bar {
          width: 18px;
          height: 2px;
          background: #FE6000;
        }
        .headline {
          font-size: 64px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.035em;
          color: #FFFFFF;
          margin-bottom: 22px;
        }
        .headline .dot-orange {
          color: #FE6000;
        }
        .headline .dot-lime {
          color: #C8E80B;
        }
        .supporting {
          font-size: 21px;
          line-height: 1.4;
          color: #FFFFFF;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .footer-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }
        .domain {
          font-size: 17px;
          font-weight: 800;
          color: #C8E80B;
          letter-spacing: 0.01em;
        }
        .phone {
          font-size: 14px;
          font-weight: 600;
          color: #C2AFC7;
        }
        .right-col {
          width: 640px;
          height: 630px;
          position: relative;
          overflow: hidden;
        }
        .right-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 25%;
        }
      </style>
    </head>
    <body>
      <div class="left-col">
        <div class="logo-wrap">
          <img class="logo-symbol" src="data:image/png;base64,${logoSymbolB64}" alt="Laurrel" />
          <div class="logo-text">
            <span class="logo-brand">LAURREL</span>
            <span class="logo-services">SERVICES</span>
          </div>
        </div>
        <div class="content-wrap">
          <div class="descriptor">
            <span class="descriptor-bar"></span>
            Residential &bull; Commercial &bull; Property
          </div>
          <h1 class="headline">
            Cleaning<span class="dot-orange">.</span><br>
            Moving<span class="dot-lime">.</span><br>
            Storage<span class="dot-orange">.</span>
          </h1>
          <p class="supporting">
            Ottawa &amp; the National Capital Region
          </p>
        </div>
        <div class="footer-wrap">
          <span class="domain">laurrelservices.com</span>
          <span class="phone">(343) 843-3032</span>
        </div>
      </div>
      <div class="right-col">
        <img class="right-img" src="data:image/jpeg;base64,${cleaningHeroB64}" alt="Laurrel Services Interior Cleaning" />
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);

  const jpgPath = path.resolve('public/assets/brand/laurrel-social-preview-v2.jpg');
  const webpPath = path.resolve('public/assets/brand/laurrel-social-preview-v2.webp');

  await page.screenshot({
    path: jpgPath,
    type: 'jpeg',
    quality: 92,
  });
  console.log(`Saved ${jpgPath}`);

  await page.screenshot({
    path: webpPath,
    type: 'webp',
    quality: 92,
  });
  console.log(`Saved ${webpPath}`);

  await browser.close();
}

generateFinalPreview().catch((err) => {
  console.error(err);
  process.exit(1);
});
