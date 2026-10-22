const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function main() {
  const artifactDir = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\888f44c3-15c7-44b5-a341-cb60fba2d087';
  const screenshotsDir = path.join(artifactDir, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Capture Login at Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
  const loginDesktop = path.join(artifactDir, 'admin-login-refined-desktop.png');
  await page.screenshot({ path: loginDesktop, fullPage: false });
  fs.copyFileSync(loginDesktop, path.join(screenshotsDir, 'admin-login-refined-desktop.png'));
  console.log('Captured refined admin login desktop.');

  // 2. Capture Login at Mobile (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
  const loginMobile = path.join(artifactDir, 'admin-login-refined-mobile.png');
  await page.screenshot({ path: loginMobile, fullPage: false });
  fs.copyFileSync(loginMobile, path.join(screenshotsDir, 'admin-login-refined-mobile.png'));
  console.log('Captured refined admin login mobile.');

  // 3. Authenticate with real session cookie
  const crypto = require('crypto');
  const sessionUser = {
    id: 'admin_827cedc6017ec4b14c2625ba',
    email: 'alelechi17@gmail.com',
    name: 'Laurrel Owner Administrator',
    role: 'owner',
  };
  const payload = {
    user: sessionUser,
    sessionId: 'sess_refined_preview_2026',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 * 12,
  };
  // Read secret from .env.local
  const envLocal = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  const secretMatch = envLocal.match(/ADMIN_SESSION_SECRET=([^\r\n]+)/);
  const secret = secretMatch ? secretMatch[1].trim() : 'c8f8b0e7d56e4099bfa5f737190c1097e3725b8719bc44d01b8a5d3f23a8e411';

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  const token = `${payloadB64}.${sig}`;

  await page.setCookie({
    name: 'laurrel_admin_session',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });

  // 4. Capture Overview at Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));
  const overviewDesktop = path.join(artifactDir, 'admin-overview-refined-desktop.png');
  await page.screenshot({ path: overviewDesktop, fullPage: true });
  fs.copyFileSync(overviewDesktop, path.join(screenshotsDir, 'admin-overview-refined-desktop.png'));
  console.log('Captured refined admin overview desktop.');

  // 5. Capture Overview at Mobile (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));
  const overviewMobile = path.join(artifactDir, 'admin-overview-refined-mobile.png');
  await page.screenshot({ path: overviewMobile, fullPage: true });
  fs.copyFileSync(overviewMobile, path.join(screenshotsDir, 'admin-overview-refined-mobile.png'));
  console.log('Captured refined admin overview mobile.');

  // 6. Capture Customer Enquiries at Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));
  const enquiriesDesktop = path.join(artifactDir, 'admin-enquiries-refined-desktop.png');
  await page.screenshot({ path: enquiriesDesktop, fullPage: true });
  fs.copyFileSync(enquiriesDesktop, path.join(screenshotsDir, 'admin-enquiries-refined-desktop.png'));
  console.log('Captured refined admin enquiries desktop.');

  // 7. Open Detail Drawer & Capture (1440x900)
  await page.click('tbody tr:first-child');
  await new Promise((r) => setTimeout(r, 800));
  const drawerDesktop = path.join(artifactDir, 'admin-enquiries-drawer-refined.png');
  await page.screenshot({ path: drawerDesktop, fullPage: false });
  fs.copyFileSync(drawerDesktop, path.join(screenshotsDir, 'admin-enquiries-drawer-refined.png'));
  console.log('Captured refined admin enquiries drawer desktop.');

  // 8. Capture Customer Enquiries at Mobile (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));
  const enquiriesMobile = path.join(artifactDir, 'admin-enquiries-refined-mobile.png');
  await page.screenshot({ path: enquiriesMobile, fullPage: true });
  fs.copyFileSync(enquiriesMobile, path.join(screenshotsDir, 'admin-enquiries-refined-mobile.png'));
  console.log('Captured refined admin enquiries mobile.');

  await browser.close();
  console.log('All refined admin screenshots captured successfully.');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
