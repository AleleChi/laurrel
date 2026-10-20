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
  const loginDesktop = path.join(artifactDir, 'admin-login-desktop-1440.png');
  await page.screenshot({ path: loginDesktop, fullPage: false });
  fs.copyFileSync(loginDesktop, path.join(screenshotsDir, 'admin-login-desktop-1440.png'));
  console.log('Captured admin login desktop.');

  // 2. Capture Login at Mobile (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
  const loginMobile = path.join(artifactDir, 'admin-login-mobile-390.png');
  await page.screenshot({ path: loginMobile, fullPage: false });
  fs.copyFileSync(loginMobile, path.join(screenshotsDir, 'admin-login-mobile-390.png'));
  console.log('Captured admin login mobile.');

  // 3. Create a valid HMAC cookie for session viewing
  const crypto = require('crypto');
  const sessionUser = {
    id: 'admin_test_operator',
    email: 'operations@laurrelservices.ca',
    name: 'Laurrel Dispatch Lead',
    role: 'admin',
  };
  const payload = {
    user: sessionUser,
    sessionId: 'sess_visual_inspection_2026',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  const secret = 'laurrel-development-only-session-secret-local';
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

  // 4. Capture Dashboard Overview at Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  // Wait a moment for data fetch
  await new Promise((r) => setTimeout(r, 1000));
  const overviewDesktop = path.join(artifactDir, 'admin-overview-desktop-1440.png');
  await page.screenshot({ path: overviewDesktop, fullPage: true });
  fs.copyFileSync(overviewDesktop, path.join(screenshotsDir, 'admin-overview-desktop-1440.png'));
  console.log('Captured admin overview desktop.');

  // 5. Capture Dashboard Overview at Tablet (768x1024)
  await page.setViewport({ width: 768, height: 1024 });
  await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const overviewTablet = path.join(artifactDir, 'admin-overview-tablet-768.png');
  await page.screenshot({ path: overviewTablet, fullPage: true });
  fs.copyFileSync(overviewTablet, path.join(screenshotsDir, 'admin-overview-tablet-768.png'));
  console.log('Captured admin overview tablet.');

  // 6. Capture Customer Enquiries at Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const enquiriesDesktop = path.join(artifactDir, 'admin-enquiries-desktop-1440.png');
  await page.screenshot({ path: enquiriesDesktop, fullPage: true });
  fs.copyFileSync(enquiriesDesktop, path.join(screenshotsDir, 'admin-enquiries-desktop-1440.png'));
  console.log('Captured admin enquiries desktop.');

  // 7. Capture Customer Enquiries at Mobile (390x844)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/admin/enquiries', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));
  const enquiriesMobile = path.join(artifactDir, 'admin-enquiries-mobile-390.png');
  await page.screenshot({ path: enquiriesMobile, fullPage: true });
  fs.copyFileSync(enquiriesMobile, path.join(screenshotsDir, 'admin-enquiries-mobile-390.png'));
  console.log('Captured admin enquiries mobile.');

  await browser.close();
  console.log('All admin screenshots captured successfully.');
}

main().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
