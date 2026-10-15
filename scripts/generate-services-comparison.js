const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-highlight');

async function createComparison() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 2880, height: 1400 });

  const solshine1440Path = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'solshine_homepage_excellent_services_1440.png');
  const laurrel1440Path = path.join(DOCS_DIR, 'laurrel_services_highlight_desktop_1440.png');

  if (!fs.existsSync(solshine1440Path) || !fs.existsSync(laurrel1440Path)) {
    console.error('Missing comparison source images!');
    await browser.close();
    return;
  }

  const solshineBase64 = fs.readFileSync(solshine1440Path).toString('base64');
  const laurrelBase64 = fs.readFileSync(laurrel1440Path).toString('base64');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #121214; color: #fff; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
        .subtitle { font-size: 16px; color: #a1a1aa; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: start; }
        .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; }
        .card-header { padding: 18px 24px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 18px; font-weight: 600; }
        .tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .tag-ref { background: rgba(200, 232, 11, 0.15); color: #c8e80b; }
        .tag-laurrel { background: rgba(57, 0, 68, 0.4); color: #f8f7f4; border: 1px solid #c8e80b; }
        .img-wrap { width: 100%; overflow: hidden; background: #000; }
        .img-wrap img { width: 100%; display: block; }
        .metrics { padding: 20px 24px; background: #18181b; font-size: 14px; line-height: 1.6; color: #d4d4d8; }
        .metrics ul { list-style: none; padding-left: 0; }
        .metrics li { margin-bottom: 6px; }
        .metrics strong { color: #fff; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">Homepage Services Highlight Comparison (1440px Desktop)</h1>
        <p class="subtitle">Reference (Solshine Excellent Services) vs Implementation (Laurrel Services)</p>
      </div>
      <div class="grid">
        <!-- Reference Card -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Solshine Reference</span>
            <span class="tag tag-ref">Primary Design Reference</span>
          </div>
          <div class="img-wrap">
            <img src="data:image/png;base64,${solshineBase64}" alt="Solshine Reference" />
          </div>
          <div class="metrics">
            <ul>
              <li><strong>Layout:</strong> Full-width lime #CAF31D, 2-column split (Left: ~45%, Right: ~55%)</li>
              <li><strong>Left Column:</strong> Eyebrow EXCELLENT SERVICES + Large editorial H2 + Black CTA with white arrow holder</li>
              <li><strong>Right Column:</strong> 3 service rows without card borders or backgrounds</li>
              <li><strong>Illustrations:</strong> Purposeful black line-art drawings (~96–104px)</li>
            </ul>
          </div>
        </div>

        <!-- Laurrel Card -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Laurrel Services Implementation</span>
            <span class="tag tag-laurrel">Laurrel Production</span>
          </div>
          <div class="img-wrap">
            <img src="data:image/png;base64,${laurrelBase64}" alt="Laurrel Services" />
          </div>
          <div class="metrics">
            <ul>
              <li><strong>Brand Token:</strong> Full-bleed Laurrel lime #C8E80B, 2-column split container</li>
              <li><strong>Left Column:</strong> Eyebrow OUR SERVICES + H2 A space to clean. A move to make. Belongings to store. + Black CTA to /services</li>
              <li><strong>Right Column:</strong> 3 service rows (Cleaning, Moving, Storage) with verified Ottawa copy</li>
              <li><strong>Illustrations:</strong> 3 original animated SVG line-art components (Cleaning, Moving, Storage)</li>
            </ul>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  const compLocalPath = path.join(DOCS_DIR, 'solshine_vs_laurrel_services_comparison.png');
  const compArtifactPath = path.join(ARTIFACT_DIR, 'solshine_vs_laurrel_services_comparison.png');

  await page.screenshot({ path: compLocalPath, fullPage: true });
  fs.copyFileSync(compLocalPath, compArtifactPath);
  console.log('Saved side-by-side comparison to:', compLocalPath);

  await browser.close();
}

createComparison().catch(console.error);
