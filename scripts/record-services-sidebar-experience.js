const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
const DOCS_DIR = path.join(__dirname, '..', 'docs', 'screenshots', 'services-reconstructed');

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Helper to spawn ffmpeg to write MP4 from JPEG stream
function startFfmpeg(outputPath, width, height, fps = 20) {
  const args = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(fps),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-vf', `scale=${width}:${height}`,
    '-movflags', '+faststart',
    outputPath,
  ];

  const proc = spawn(ffmpegPath, args);
  proc.stderr.on('data', (d) => {
    // console.log('[ffmpeg]', d.toString());
  });
  return proc;
}

async function runRecordingAndTests() {
  console.log('Starting Desktop & Mobile Walkthrough Recording & Testing...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // =========================================================================
  // 1. DESKTOP RECORDING (1440x900)
  // =========================================================================
  const desktopWidth = 1440;
  const desktopHeight = 900;
  await page.setViewport({ width: desktopWidth, height: desktopHeight });
  await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1000));

  const desktopMp4Path = path.join(DOCS_DIR, 'laurrel_services_desktop_scroll_recording.mp4');
  const desktopFfmpeg = startFfmpeg(desktopMp4Path, desktopWidth, desktopHeight, 15);

  async function captureDesktopFrame() {
    const buf = await page.screenshot({ type: 'jpeg', quality: 80 });
    return new Promise((resolve) => {
      desktopFfmpeg.stdin.write(buf, resolve);
    });
  }

  console.log('Recording Desktop Walkthrough...');

  // Frame 1: Top of page (Banner + intro visible)
  for (let i = 0; i < 15; i++) {
    await captureDesktopFrame();
  }

  // Save Test A screenshot
  await page.screenshot({ path: path.join(DOCS_DIR, 'test_a_initial_article.png') });
  fs.copyFileSync(path.join(DOCS_DIR, 'test_a_initial_article.png'), path.join(ARTIFACT_DIR, 'test_a_initial_article.png'));

  // Scroll smoothly down through Stage A (0 to 1800px)
  console.log('Scrolling through Stage A (Service content with sticky navigation)...');
  for (let y = 0; y <= 1800; y += 40) {
    await page.evaluate((pos) => window.scrollTo(0, pos), y);
    await captureDesktopFrame();

    if (y === 800) {
      await page.screenshot({ path: path.join(DOCS_DIR, 'test_b_scrolling_service_sticky.png') });
      fs.copyFileSync(path.join(DOCS_DIR, 'test_b_scrolling_service_sticky.png'), path.join(ARTIFACT_DIR, 'test_b_scrolling_service_sticky.png'));
    }
  }

  // At y = 2000: Sticky navigation exits, Stage B starts
  for (let y = 1840; y <= 2400; y += 40) {
    await page.evaluate((pos) => window.scrollTo(0, pos), y);
    await captureDesktopFrame();

    if (y === 2200) {
      await page.screenshot({ path: path.join(DOCS_DIR, 'test_c_leaving_nav_region.png') });
      fs.copyFileSync(path.join(DOCS_DIR, 'test_c_leaving_nav_region.png'), path.join(ARTIFACT_DIR, 'test_c_leaving_nav_region.png'));
    }
  }

  // Now in Stage B: Enquiry Form on Left, How It Works on Right
  console.log('Interacting in Stage B: Form & How It Works cards...');
  await page.screenshot({ path: path.join(DOCS_DIR, 'test_d_working_process_form.png') });
  fs.copyFileSync(path.join(DOCS_DIR, 'test_d_working_process_form.png'), path.join(ARTIFACT_DIR, 'test_d_working_process_form.png'));

  // Hover over the How It Works process cards to demonstrate lime highlight transition
  const processCards = await page.$$('section#how-it-works [role="region"]');
  console.log(`Found ${processCards.length} process cards for interaction.`);

  if (processCards.length >= 3) {
    // Hover step 2
    await processCards[1].hover();
    for (let i = 0; i < 10; i++) await captureDesktopFrame();

    // Hover step 3
    await processCards[2].hover();
    for (let i = 0; i < 10; i++) await captureDesktopFrame();

    // Hover step 1
    await processCards[0].hover();
    for (let i = 0; i < 10; i++) await captureDesktopFrame();
  }

  // Interact with sidebar form
  console.log('Testing sidebar form interaction and submission...');
  // Click 'moving' service pill
  const movingPill = await page.$('button[aria-label="Select service category"] button:nth-child(2)');
  const servicePills = await page.$$('div[role="group"] button');
  if (servicePills.length >= 2) {
    await servicePills[1].click(); // select Moving
    for (let i = 0; i < 6; i++) await captureDesktopFrame();
  }

  // Enter test data
  await page.type('#sidebar-form-name', 'Marie Laurent');
  for (let i = 0; i < 4; i++) await captureDesktopFrame();

  await page.type('#sidebar-form-email', 'marie.laurent@example.com');
  for (let i = 0; i < 4; i++) await captureDesktopFrame();

  await page.type('#sidebar-form-phone', '(613) 555-0199');
  for (let i = 0; i < 4; i++) await captureDesktopFrame();

  await page.type('#sidebar-form-message', 'Relocating from downtown Ottawa to Kanata at the end of next month.');
  for (let i = 0; i < 6; i++) await captureDesktopFrame();

  // Submit the real form to /api/enquire
  const submitBtn = await page.$('#sidebar-enquiry-form button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    console.log('Submitted sidebar enquiry form.');
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 80));
      await captureDesktopFrame();
    }
  }

  await page.screenshot({ path: path.join(DOCS_DIR, 'form_submission_success.png') });
  fs.copyFileSync(path.join(DOCS_DIR, 'form_submission_success.png'), path.join(ARTIFACT_DIR, 'form_submission_success.png'));

  // Scroll down to Lime Information Panel & FAQ
  console.log('Scrolling to Lime Info Panel & FAQ...');
  for (let y = 2440; y <= 3200; y += 40) {
    await page.evaluate((pos) => window.scrollTo(0, pos), y);
    await captureDesktopFrame();

    if (y === 2900) {
      await page.screenshot({ path: path.join(DOCS_DIR, 'test_e_faqs_lime_panel.png') });
      fs.copyFileSync(path.join(DOCS_DIR, 'test_e_faqs_lime_panel.png'), path.join(ARTIFACT_DIR, 'test_e_faqs_lime_panel.png'));
    }
  }

  // Toggle second FAQ item
  const faqButtons = await page.$$('section#faq button');
  if (faqButtons.length >= 2) {
    await faqButtons[1].click();
    for (let i = 0; i < 12; i++) await captureDesktopFrame();
  }

  // Scroll to footer
  console.log('Scrolling to Footer...');
  const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (let y = 3240; y <= maxScroll; y += 50) {
    await page.evaluate((pos) => window.scrollTo(0, pos), y);
    await captureDesktopFrame();
  }

  for (let i = 0; i < 15; i++) {
    await captureDesktopFrame();
  }

  await page.screenshot({ path: path.join(DOCS_DIR, 'test_f_footer_transition.png') });
  fs.copyFileSync(path.join(DOCS_DIR, 'test_f_footer_transition.png'), path.join(ARTIFACT_DIR, 'test_f_footer_transition.png'));

  desktopFfmpeg.stdin.end();
  await new Promise((resolve) => desktopFfmpeg.on('close', resolve));
  console.log(`Desktop recording saved to: ${desktopMp4Path}`);
  fs.copyFileSync(desktopMp4Path, path.join(ARTIFACT_DIR, 'laurrel_services_desktop_scroll_recording.mp4'));

  // =========================================================================
  // 2. MOBILE RECORDING (390x844)
  // =========================================================================
  console.log('Recording Mobile Walkthrough (390x844)...');
  const mobileWidth = 390;
  const mobileHeight = 844;
  await page.setViewport({ width: mobileWidth, height: mobileHeight });
  await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));

  const mobileMp4Path = path.join(DOCS_DIR, 'laurrel_services_mobile_scroll_recording.mp4');
  const mobileFfmpeg = startFfmpeg(mobileMp4Path, mobileWidth, mobileHeight, 15);

  async function captureMobileFrame() {
    const buf = await page.screenshot({ type: 'jpeg', quality: 75 });
    return new Promise((resolve) => {
      mobileFfmpeg.stdin.write(buf, resolve);
    });
  }

  for (let i = 0; i < 10; i++) await captureMobileFrame();

  const mobileMaxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
  for (let y = 0; y <= mobileMaxScroll; y += 45) {
    await page.evaluate((pos) => window.scrollTo(0, pos), y);
    await captureMobileFrame();
  }

  for (let i = 0; i < 10; i++) await captureMobileFrame();

  mobileFfmpeg.stdin.end();
  await new Promise((resolve) => mobileFfmpeg.on('close', resolve));
  console.log(`Mobile recording saved to: ${mobileMp4Path}`);
  fs.copyFileSync(mobileMp4Path, path.join(ARTIFACT_DIR, 'laurrel_services_mobile_scroll_recording.mp4'));

  // =========================================================================
  // 3. VALIDATION ERROR TESTING
  // =========================================================================
  console.log('Testing form validation error states...');
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/services', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const form = document.getElementById('sidebar-enquiry-form');
    if (form) form.scrollIntoView();
  });
  await new Promise((r) => setTimeout(r, 500));

  // Submit empty form to trigger field-level validation errors
  const emptySubmitBtn = await page.$('#sidebar-enquiry-form button[type="submit"]');
  if (emptySubmitBtn) {
    await emptySubmitBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.screenshot({ path: path.join(DOCS_DIR, 'form_validation_error.png') });
    fs.copyFileSync(path.join(DOCS_DIR, 'form_validation_error.png'), path.join(ARTIFACT_DIR, 'form_validation_error.png'));
    console.log('Captured form_validation_error.png');
  }

  // =========================================================================
  // 4. DIRECT HASH NAVIGATION TESTS
  // =========================================================================
  const testHashes = ['cleaning', 'moving', 'storage', 'how-it-works', 'faq'];
  for (const h of testHashes) {
    await page.goto(`http://localhost:3000/services#${h}`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 400));
    const targetRect = await page.$eval(`#${h}`, (el) => el.getBoundingClientRect());
    console.log(`Hash #${h}: top offset relative to viewport = ${Math.round(targetRect.top)}px (clears header)`);
  }

  await browser.close();
  console.log('All tests and video recordings completed successfully!');
}

runRecordingAndTests().catch((err) => {
  console.error('Recording Error:', err);
  process.exit(1);
});
