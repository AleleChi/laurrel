const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'reference', 'solshine-details');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '1840', width: 1840, height: 1080 },
  { name: '1440', width: 1440, height: 900 },
  { name: '1024', width: 1024, height: 768 },
  { name: '768', width: 768, height: 1024 },
  { name: '390', width: 390, height: 844 },
];

async function inspectSolshineServiceDetail() {
  console.log('Launching browser to inspect Solshine service detail reference...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const url = 'https://solshine.framer.website/services/solar-panel-cleaning-services';

  const report = {};

  for (const vp of VIEWPORTS) {
    console.log(`Inspecting viewport ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Capture screenshots
    const screenshotPath = path.join(OUTPUT_DIR, `solshine_service_detail_${vp.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot: solshine_service_detail_${vp.name}.png`);

    // Capture measurements at 1440px & 1840px
    if (vp.name === '1440' || vp.name === '1840') {
      const metrics = await page.evaluate(() => {
        const getStyle = (el) => (el ? window.getComputedStyle(el) : null);
        const getRect = (el) => (el ? el.getBoundingClientRect() : null);

        // Find banner
        // Usually first section or section with background image / H1
        const h1 = document.querySelector('h1');
        const h1Style = getStyle(h1);
        const h1Rect = getRect(h1);

        // Banner container (closest section or parent of h1)
        let banner = h1 ? h1.closest('section') || h1.parentElement.parentElement : null;
        let bannerRect = getRect(banner);
        let bannerStyle = getStyle(banner);

        // Breadcrumb
        const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]') || 
          Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Home'))?.parentElement;
        const breadcrumbRect = getRect(breadcrumb);
        const breadcrumbStyle = getStyle(breadcrumb);

        // Sidebar and main content layout
        // Look for the sidebar container with service links
        const links = Array.from(document.querySelectorAll('a'));
        const serviceLink = links.find(a => a.textContent.includes('Cleaning') && a.href.includes('services'));
        const sidebar = serviceLink ? (serviceLink.closest('nav') || serviceLink.parentElement.parentElement) : null;
        const sidebarRect = getRect(sidebar);
        const sidebarStyle = getStyle(sidebar);

        // Main article or right column
        const h2 = document.querySelector('h2');
        const h2Style = getStyle(h2);
        const h2Rect = getRect(h2);

        // Main content column
        let mainContent = h2 ? (h2.closest('article') || h2.parentElement) : null;
        let mainRect = getRect(mainContent);
        let mainStyle = getStyle(mainContent);

        // Parent container of both sidebar and main content
        let twoColContainer = null;
        if (sidebar && mainContent) {
          let p = sidebar.parentElement;
          while (p && !p.contains(mainContent)) {
            p = p.parentElement;
          }
          twoColContainer = p;
        }
        const twoColRect = getRect(twoColContainer);
        const twoColStyle = getStyle(twoColContainer);

        // Images in main content
        const articleImages = Array.from(document.querySelectorAll('img')).filter(img => {
          const r = img.getBoundingClientRect();
          return r.width > 300 && r.top > 300;
        }).map(img => {
          const r = img.getBoundingClientRect();
          const s = window.getComputedStyle(img);
          return {
            src: img.src,
            width: r.width,
            height: r.height,
            borderRadius: s.borderRadius,
          };
        });

        // Sidebar items
        const sidebarRows = sidebar ? Array.from(sidebar.querySelectorAll('a')).map(a => {
          const r = a.getBoundingClientRect();
          const s = window.getComputedStyle(a);
          return {
            text: a.textContent.trim(),
            width: r.width,
            height: r.height,
            bg: s.backgroundColor,
            color: s.color,
            borderRadius: s.borderRadius,
            fontSize: s.fontSize,
          };
        }) : [];

        // Header floating navigation
        const header = document.querySelector('header');
        const headerRect = getRect(header);
        const headerStyle = getStyle(header);

        return {
          banner: {
            rect: bannerRect,
            height: bannerStyle ? bannerStyle.height : null,
            padding: bannerStyle ? bannerStyle.padding : null,
            bg: bannerStyle ? bannerStyle.backgroundColor : null,
          },
          h1: {
            text: h1 ? h1.textContent.trim() : null,
            fontSize: h1Style ? h1Style.fontSize : null,
            lineHeight: h1Style ? h1Style.lineHeight : null,
            fontWeight: h1Style ? h1Style.fontWeight : null,
            color: h1Style ? h1Style.color : null,
            textAlign: h1Style ? h1Style.textAlign : null,
            rect: h1Rect,
          },
          breadcrumb: {
            text: breadcrumb ? breadcrumb.textContent.trim() : null,
            rect: breadcrumbRect,
            style: breadcrumbStyle ? {
              fontSize: breadcrumbStyle.fontSize,
              padding: breadcrumbStyle.padding,
              borderRadius: breadcrumbStyle.borderRadius,
              bg: breadcrumbStyle.backgroundColor,
            } : null,
          },
          twoColContainer: {
            rect: twoColRect,
            width: twoColStyle ? twoColStyle.width : null,
            maxWidth: twoColStyle ? twoColStyle.maxWidth : null,
            gap: twoColStyle ? twoColStyle.gap : null,
            padding: twoColStyle ? twoColStyle.padding : null,
          },
          sidebar: {
            rect: sidebarRect,
            width: sidebarStyle ? sidebarStyle.width : null,
            padding: sidebarStyle ? sidebarStyle.padding : null,
            bg: sidebarStyle ? sidebarStyle.backgroundColor : null,
            borderRadius: sidebarStyle ? sidebarStyle.borderRadius : null,
            rows: sidebarRows,
          },
          mainContent: {
            rect: mainRect,
            width: mainStyle ? mainStyle.width : null,
            h2: {
              text: h2 ? h2.textContent.trim() : null,
              fontSize: h2Style ? h2Style.fontSize : null,
              lineHeight: h2Style ? h2Style.lineHeight : null,
              fontWeight: h2Style ? h2Style.fontWeight : null,
            },
            images: articleImages,
          },
          header: {
            rect: headerRect,
            height: headerStyle ? headerStyle.height : null,
            position: headerStyle ? headerStyle.position : null,
          },
        };
      });

      report[`vp_${vp.name}`] = metrics;
    }
  }

  // Also capture full page screenshot at 1440px
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'solshine_service_detail_1440_full.png'), fullPage: true });

  fs.writeFileSync(
    path.join(__dirname, '..', 'docs', 'reference', 'solshine-services-metrics.json'),
    JSON.stringify(report, null, 2)
  );

  await browser.close();
  console.log('Solshine service detail inspection complete!');
}

inspectSolshineServiceDetail().catch((err) => {
  console.error('Inspection error:', err);
  process.exit(1);
});
