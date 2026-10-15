const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-reconstructed');
const SOLSHINE_DIR = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details');

async function generateFullComparison() {
  console.log('Generating full page comparison using HTML file...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 2880, height: 1600 });

  const solshinePath = path.join(SOLSHINE_DIR, 'solshine_service_detail_1440_full.png').replace(/\\/g, '/');
  const laurrelPath = path.join(DOCS_DIR, 'laurrel_services_reconstructed_desktop_1440_full.png').replace(/\\/g, '/');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background: #121214; color: #fff; padding: 36px; }
        .header { text-align: center; margin-bottom: 24px; }
        .title { font-size: 26px; font-weight: 700; margin-bottom: 6px; }
        .subtitle { font-size: 15px; color: #a1a1aa; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; }
        .card-header { padding: 16px 20px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 17px; font-weight: 600; }
        .tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
        .tag-ref { background: rgba(200, 232, 11, 0.15); color: #c8e80b; }
        .tag-laurrel { background: rgba(57, 0, 68, 0.5); color: #f8f7f4; border: 1px solid #c8e80b; }
        .img-wrap { width: 100%; overflow: hidden; }
        .img-wrap img { width: 100%; display: block; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">Comparison B & C — Complete Services Page Architecture (1440px Desktop)</h1>
        <p class="subtitle">Left: Solshine Reference (Photographic Banner + Two-Column Layout) | Right: Laurrel Services Implementation</p>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Solshine Service Detail Page (Reference)</span>
            <span class="tag tag-ref">Framer Live Production</span>
          </div>
          <div class="img-wrap">
            <img src="file:///${solshinePath}" alt="Solshine Full Page" />
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Laurrel Services Page (Reconstructed)</span>
            <span class="tag tag-laurrel">Next.js Reconstructed Production</span>
          </div>
          <div class="img-wrap">
            <img src="file:///${laurrelPath}" alt="Laurrel Reconstructed Full Page" />
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const tempHtmlPath = path.join(DOCS_DIR, 'temp-full-comparison.html');
  fs.writeFileSync(tempHtmlPath, html);

  await page.goto(`file:///${tempHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'load', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2000));

  const compFullPath = path.join(DOCS_DIR, 'solshine_vs_laurrel_services_full_comparison.png');
  const compFullArtifactPath = path.join(ARTIFACT_DIR, 'solshine_vs_laurrel_services_full_comparison.png');
  await page.screenshot({ path: compFullPath, fullPage: true });
  fs.copyFileSync(compFullPath, compFullArtifactPath);
  console.log('Saved Comparison B & C: Full Page Comparison');

  fs.unlinkSync(tempHtmlPath);
  await browser.close();
}

generateFullComparison().catch((err) => {
  console.error('Comparison Error:', err);
  process.exit(1);
});
