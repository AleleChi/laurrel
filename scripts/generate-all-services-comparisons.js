const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-reconstructed');
const SOLSHINE_DIR = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details');

async function run() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // 1. Capture Cleaning Detail and Footer Transition on Laurrel at 1440px
  console.log('Capturing section details on Laurrel 1440px...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  // Section 01 Cleaning Detail
  const cleaningEl = await page.$('#cleaning');
  if (cleaningEl) {
    const cleaningPath = path.join(DOCS_DIR, 'laurrel_services_cleaning_detail_1440.png');
    await cleaningEl.screenshot({ path: cleaningPath });
    fs.copyFileSync(cleaningPath, path.join(ARTIFACT_DIR, 'laurrel_services_cleaning_detail_1440.png'));
    console.log('Saved laurrel_services_cleaning_detail_1440.png');
  }

  // Sidebar Nav Active State
  const sidebarEl = await page.$('aside nav');
  if (sidebarEl) {
    const navPath = path.join(DOCS_DIR, 'laurrel_services_nav_active_1440.png');
    await sidebarEl.screenshot({ path: navPath });
    fs.copyFileSync(navPath, path.join(ARTIFACT_DIR, 'laurrel_services_nav_active_1440.png'));
    console.log('Saved laurrel_services_nav_active_1440.png');
  }

  // Footer Transition Detail (from lime CTA banner through footer)
  const ctaBanner = await page.$('section.bg-\\[\\#C8E80B\\]');
  if (ctaBanner) {
    const box = await ctaBanner.boundingBox();
    if (box) {
      const footerPath = path.join(DOCS_DIR, 'laurrel_services_footer_transition_1440.png');
      await page.screenshot({
        path: footerPath,
        clip: {
          x: 0,
          y: Math.max(0, box.y - 40),
          width: 1440,
          height: 900,
        },
      });
      fs.copyFileSync(footerPath, path.join(ARTIFACT_DIR, 'laurrel_services_footer_transition_1440.png'));
      console.log('Saved laurrel_services_footer_transition_1440.png');
    }
  }

  // 2. Generate Tablet Comparison (768px)
  console.log('Generating Tablet Comparison (768px)...');
  await page.setViewport({ width: 1600, height: 1400 });
  const solshine768 = path.join(SOLSHINE_DIR, 'solshine_service_detail_768.png').replace(/\\/g, '/');
  const laurrel768 = path.join(DOCS_DIR, 'laurrel_services_reconstructed_tablet_768_full.png').replace(/\\/g, '/');

  const tabletHtml = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body { background: #121214; color: #fff; padding: 32px; }
      .header { text-align: center; margin-bottom: 24px; }
      .title { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
      .subtitle { font-size: 14px; color: #a1a1aa; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; }
      .card-header { padding: 14px 18px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
      .card-title { font-size: 16px; font-weight: 600; }
      .tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
      .tag-ref { background: rgba(200, 232, 11, 0.15); color: #c8e80b; }
      .tag-laurrel { background: rgba(57, 0, 68, 0.5); color: #f8f7f4; border: 1px solid #c8e80b; }
      .img-wrap { width: 100%; overflow: hidden; }
      .img-wrap img { width: 100%; display: block; }
    </style></head><body>
      <div class="header">
        <h1 class="title">Tablet Comparison — 768px Viewport</h1>
        <p class="subtitle">Left: Solshine Reference | Right: Laurrel Services Reconstructed</p>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-header"><span class="card-title">Solshine (768px Tablet)</span><span class="tag tag-ref">Reference</span></div>
          <div class="img-wrap"><img src="file:///${solshine768}"></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Laurrel Services (768px Tablet)</span><span class="tag tag-laurrel">Laurrel</span></div>
          <div class="img-wrap"><img src="file:///${laurrel768}"></div>
        </div>
      </div>
    </body></html>
  `;
  const tempTabletPath = path.join(DOCS_DIR, 'temp-tablet-comp.html');
  fs.writeFileSync(tempTabletPath, tabletHtml);
  await page.goto(`file:///${tempTabletPath.replace(/\\/g, '/')}`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1500));
  const tabletCompPath = path.join(DOCS_DIR, 'solshine_vs_laurrel_tablet_comparison.png');
  await page.screenshot({ path: tabletCompPath, fullPage: true });
  fs.copyFileSync(tabletCompPath, path.join(ARTIFACT_DIR, 'solshine_vs_laurrel_tablet_comparison.png'));
  fs.unlinkSync(tempTabletPath);
  console.log('Saved solshine_vs_laurrel_tablet_comparison.png');

  // 3. Generate Mobile Comparison (390px)
  console.log('Generating Mobile Comparison (390px)...');
  const solshine390 = path.join(SOLSHINE_DIR, 'solshine_service_detail_390.png').replace(/\\/g, '/');
  const laurrel390 = path.join(DOCS_DIR, 'laurrel_services_reconstructed_mobile_390_full.png').replace(/\\/g, '/');

  const mobileHtml = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body { background: #121214; color: #fff; padding: 32px; }
      .header { text-align: center; margin-bottom: 24px; }
      .title { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
      .subtitle { font-size: 14px; color: #a1a1aa; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; max-width: 900px; margin: 0 auto; }
      .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; }
      .card-header { padding: 14px 18px; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; align-items: center; }
      .card-title { font-size: 16px; font-weight: 600; }
      .tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
      .tag-ref { background: rgba(200, 232, 11, 0.15); color: #c8e80b; }
      .tag-laurrel { background: rgba(57, 0, 68, 0.5); color: #f8f7f4; border: 1px solid #c8e80b; }
      .img-wrap { width: 100%; overflow: hidden; }
      .img-wrap img { width: 100%; display: block; }
    </style></head><body>
      <div class="header">
        <h1 class="title">Mobile Comparison — 390px Viewport</h1>
        <p class="subtitle">Left: Solshine Reference | Right: Laurrel Services Reconstructed</p>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-header"><span class="card-title">Solshine (390px Mobile)</span><span class="tag tag-ref">Reference</span></div>
          <div class="img-wrap"><img src="file:///${solshine390}"></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Laurrel Services (390px Mobile)</span><span class="tag tag-laurrel">Laurrel</span></div>
          <div class="img-wrap"><img src="file:///${laurrel390}"></div>
        </div>
      </div>
    </body></html>
  `;
  const tempMobilePath = path.join(DOCS_DIR, 'temp-mobile-comp.html');
  fs.writeFileSync(tempMobilePath, mobileHtml);
  await page.goto(`file:///${tempMobilePath.replace(/\\/g, '/')}`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1500));
  const mobileCompPath = path.join(DOCS_DIR, 'solshine_vs_laurrel_mobile_comparison.png');
  await page.screenshot({ path: mobileCompPath, fullPage: true });
  fs.copyFileSync(mobileCompPath, path.join(ARTIFACT_DIR, 'solshine_vs_laurrel_mobile_comparison.png'));
  fs.unlinkSync(tempMobilePath);
  console.log('Saved solshine_vs_laurrel_mobile_comparison.png');

  // 4. Generate Active Navigation Comparison
  console.log('Generating Navigation Active State Comparison...');
  const navLaurrelPath = path.join(DOCS_DIR, 'laurrel_services_nav_active_1440.png').replace(/\\/g, '/');

  const navHtml = `
    <!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      body { background: #121214; color: #fff; padding: 32px; }
      .header { text-align: center; margin-bottom: 24px; }
      .title { font-size: 24px; font-weight: 700; margin-bottom: 6px; }
      .subtitle { font-size: 14px; color: #a1a1aa; }
      .container { max-width: 900px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 20px; }
      .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
      .tag { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
      .tag-ref { background: rgba(200, 232, 11, 0.15); color: #c8e80b; }
      .tag-laurrel { background: rgba(57, 0, 68, 0.5); color: #f8f7f4; border: 1px solid #c8e80b; }
      .ref-mock { background: rgb(248, 248, 248); border-radius: 36px; padding: 24px; }
      .ref-mock-item { height: 58px; border-radius: 30px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-weight: 600; margin-bottom: 8px; font-size: 15px; }
      .ref-mock-item.active { background: rgb(202, 243, 29); color: #000; }
      .ref-mock-item.inactive { background: #fff; color: #000; }
      .arrow { width: 14px; height: 14px; }
      .img-wrap img { width: 100%; border-radius: 36px; display: block; }
    </style></head><body>
      <div class="header">
        <h1 class="title">Active State Navigation Comparison</h1>
        <p class="subtitle">Solshine Reference vs. Laurrel Services Sticky Sidebar</p>
      </div>
      <div class="container">
        <div class="card">
          <div class="card-title"><span>Solshine Reference Sidebar</span><span class="tag tag-ref">Reference</span></div>
          <div class="ref-mock">
            <div class="ref-mock-item active"><span>Solar Panel Cleaning</span><span>→</span></div>
            <div class="ref-mock-item inactive"><span>Solar Panel Maintenance</span><span>→</span></div>
            <div class="ref-mock-item inactive"><span>Solar Panel Installation</span><span>→</span></div>
            <div class="ref-mock-item inactive"><span>Energy Storage Solutions</span><span>→</span></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title"><span>Laurrel Services Sidebar</span><span class="tag tag-laurrel">Laurrel</span></div>
          <div class="img-wrap">
            <img src="file:///${navLaurrelPath}">
          </div>
        </div>
      </div>
    </body></html>
  `;
  const tempNavPath = path.join(DOCS_DIR, 'temp-nav-comp.html');
  fs.writeFileSync(tempNavPath, navHtml);
  await page.goto(`file:///${tempNavPath.replace(/\\/g, '/')}`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1000));
  const navCompPath = path.join(DOCS_DIR, 'solshine_vs_laurrel_nav_active_comparison.png');
  await page.screenshot({ path: navCompPath, fullPage: true });
  fs.copyFileSync(navCompPath, path.join(ARTIFACT_DIR, 'solshine_vs_laurrel_nav_active_comparison.png'));
  fs.unlinkSync(tempNavPath);
  console.log('Saved solshine_vs_laurrel_nav_active_comparison.png');

  await browser.close();
  console.log('All detailed comparisons generated successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
