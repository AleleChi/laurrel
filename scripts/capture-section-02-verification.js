const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function verifySection02() {
  const artifactDir = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
  const localDir = path.join(__dirname, '..', 'docs', 'reference', 'section-02-verification');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900 },
    { name: 'desktop_1840', width: 1840, height: 1000 },
    { name: 'laptop_1024', width: 1024, height: 900 },
    { name: 'tablet_768', width: 768, height: 1024 },
    { name: 'mobile_390', width: 390, height: 844 },
  ];

  const results = {};

  for (const vp of viewports) {
    console.log(`Setting viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 600));

    // Find the What We Do section (section index 2: banner=0, aboutCompany=1, whatWeDo=2)
    const metrics = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (!main || main.children.length < 3) return null;
      const section = main.children[2];
      const rect = section.getBoundingClientRect();
      const style = window.getComputedStyle(section);

      const h2 = section.querySelector('h2');
      const h2Style = h2 ? window.getComputedStyle(h2) : null;
      const h2Rect = h2 ? h2.getBoundingClientRect() : null;

      const p = section.querySelector('p');
      const pStyle = p ? window.getComputedStyle(p) : null;
      const pRect = p ? p.getBoundingClientRect() : null;

      const eyebrow = section.querySelector('span');
      const eyebrowStyle = eyebrow ? window.getComputedStyle(eyebrow) : null;

      // Find the 3 lower columns
      const cols = Array.from(section.querySelectorAll('.grid > div.flex-col'));

      const colMetrics = cols.map(c => {
        const cRect = c.getBoundingClientRect();
        const label = c.querySelector('a, span');
        const rule = c.querySelector('[role="separator"]');
        const displayWord = c.querySelector('span.text-6xl, span.text-7xl, span[class*="[84px]"], span[class*="[96px]"]');
        const desc = c.querySelector('p');

        const dStyle = displayWord ? window.getComputedStyle(displayWord) : null;
        const dRect = displayWord ? displayWord.getBoundingClientRect() : null;
        const rRect = rule ? rule.getBoundingClientRect() : null;

        return {
          colWidth: cRect.width,
          colLeft: cRect.left,
          colTop: cRect.top,
          labelText: label ? label.innerText.trim() : '',
          ruleWidth: rRect ? rRect.width : 0,
          ruleTop: rRect ? rRect.top : 0,
          displayWordText: displayWord ? displayWord.innerText.trim() : '',
          displayWordFontSize: dStyle ? dStyle.fontSize : '',
          displayWordLineHeight: dStyle ? dStyle.lineHeight : '',
          displayWordFontWeight: dStyle ? dStyle.fontWeight : '',
          displayWordTop: dRect ? dRect.top : 0,
          descText: desc ? desc.innerText.trim() : '',
        };
      });

      return {
        top: window.scrollY + rect.top,
        width: rect.width,
        height: rect.height,
        padding: style.padding,
        bg: style.backgroundColor,
        eyebrow: eyebrow ? eyebrow.innerText.trim() : '',
        h2: {
          text: h2 ? h2.innerText : '',
          fontSize: h2Style ? h2Style.fontSize : '',
          lineHeight: h2Style ? h2Style.lineHeight : '',
          fontWeight: h2Style ? h2Style.fontWeight : '',
          width: h2Rect ? h2Rect.width : 0,
          height: h2Rect ? h2Rect.height : 0,
          left: h2Rect ? h2Rect.left : 0,
        },
        intro: {
          text: p ? p.innerText : '',
          fontSize: pStyle ? pStyle.fontSize : '',
          lineHeight: pStyle ? pStyle.lineHeight : '',
          width: pRect ? pRect.width : 0,
          height: pRect ? pRect.height : 0,
          left: pRect ? pRect.left : 0,
        },
        colMetrics,
      };
    });

    results[vp.name] = metrics;

    if (metrics) {
      await page.evaluate((top) => window.scrollTo(0, top), metrics.top);
      await new Promise(r => setTimeout(r, 400));

      const filename = `laurrel_section_02_what_we_do_${vp.name}.png`;
      const localPath = path.join(localDir, filename);
      const artifactPath = path.join(artifactDir, filename);

      await page.screenshot({
        path: localPath,
        clip: {
          x: 0,
          y: metrics.top,
          width: vp.width,
          height: Math.round(metrics.height),
        },
      });

      await page.screenshot({
        path: artifactPath,
        clip: {
          x: 0,
          y: metrics.top,
          width: vp.width,
          height: Math.round(metrics.height),
        },
      });

      console.log(`Saved screenshot: ${filename} (h: ${Math.round(metrics.height)}px)`);
    }
  }

  // Generate Side-by-Side Comparison HTML and capture it
  console.log('Generating Side-by-Side comparison at 1440px...');
  const solshinePath = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details', 'solshine_section_03_three_col_1440.png');
  const laurrelPath = path.join(localDir, 'laurrel_section_02_what_we_do_desktop_1440.png');

  if (fs.existsSync(solshinePath) && fs.existsSync(laurrelPath)) {
    const solshineBase64 = fs.readFileSync(solshinePath).toString('base64');
    const laurrelBase64 = fs.readFileSync(laurrelPath).toString('base64');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 32px;
            background: #111;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #fff;
          }
          .title {
            text-align: center;
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 24px;
            letter-spacing: -0.5px;
          }
          .container {
            display: flex;
            flex-direction: column;
            gap: 32px;
            max-width: 1440px;
            margin: 0 auto;
          }
          .card {
            background: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #333;
          }
          .card-header {
            padding: 16px 24px;
            font-size: 16px;
            font-weight: 600;
            background: #222;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
          }
          .card-header span.tag {
            background: #C8E80B;
            color: #000;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 700;
          }
          .card img {
            width: 100%;
            height: auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="title">Section 02 Architectural Comparison: Solshine Reference vs. Rebuilt Laurrel (1440px Desktop)</div>
        <div class="container">
          <div class="card">
            <div class="card-header">
              <span>1. SOLSHINE REFERENCE — 3-COLUMN INFORMATION SECTION</span>
              <span class="tag">REFERENCE</span>
            </div>
            <img src="data:image/png;base64,${solshineBase64}" />
          </div>
          <div class="card">
            <div class="card-header">
              <span>2. LAURREL SERVICES — RECONSTRUCTED WHAT WE DO SECTION</span>
              <span class="tag">RECONSTRUCTED</span>
            </div>
            <img src="data:image/png;base64,${laurrelBase64}" />
          </div>
        </div>
      </body>
      </html>
    `;

    const compPage = await browser.newPage();
    await compPage.setViewport({ width: 1520, height: 1600 });
    await compPage.setContent(htmlContent, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));

    const compLocal = path.join(localDir, 'solshine_vs_laurrel_section_02_comparison.png');
    const compArtifact = path.join(artifactDir, 'solshine_vs_laurrel_section_02_comparison.png');

    await compPage.screenshot({ path: compLocal, fullPage: true });
    await compPage.screenshot({ path: compArtifact, fullPage: true });
    console.log('Saved Side-by-Side comparison to:', compLocal);
    await compPage.close();
  }

  await browser.close();

  console.log('\n--- VERIFICATION METRICS SUMMARY ---');
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(
    path.join(localDir, 'section_02_metrics.json'),
    JSON.stringify(results, null, 2)
  );
}

verifySection02().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
