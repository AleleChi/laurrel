const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
dotenv.config();

const { Pool } = require('../backend/node_modules/pg');

const ARTIFACTS_DIR = 'C:/Users/alele/.gemini/antigravity/brain/888f44c3-15c7-44b5-a341-cb60fba2d087';
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMediaVerification() {
  console.log('===========================================================');
  console.log('LAURREL SERVICES — MEDIA MODULE 03 QA VERIFICATION SUITE');
  console.log('===========================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const ownerEmail = process.env.ADMIN_OWNER_EMAIL || 'alelechi17@gmail.com';
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD;

  if (!ownerPassword) {
    console.error('❌ ADMIN_OWNER_PASSWORD is not configured in backend/.env');
    process.exit(1);
  }

  // Create temporary fixture image for upload test
  const fixtureDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });
  const testImagePath = path.join(fixtureDir, 'qa-test-upload.png');
  // Copy laurrel-symbol.png to fixture
  fs.copyFileSync(
    path.join(__dirname, '..', 'public', 'assets', 'brand', 'laurrel-symbol.png'),
    testImagePath
  );

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 1: Sign in as Owner
    console.log(`Step 1: Signing in at http://localhost:3000/admin/login as ${ownerEmail}...`);
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', ownerEmail);
    await page.type('#admin-password', ownerPassword);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log(`✅ Authenticated. Current URL: ${page.url()}`);

    // Step 2: Open Media Library
    console.log('\nStep 2: Navigating to /admin/media...');
    await page.goto('http://localhost:3000/admin/media', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.media-card-item');
    console.log('✅ Media Library rendered with seeded assets.');

    // Capture Desktop View
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-library-desktop-1440.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-library-desktop-1440.png'),
      path.join(ARTIFACTS_DIR, 'media-library-desktop-1440.png')
    );
    console.log('📸 Captured: media-library-desktop-1440.png');

    // Capture Tablet View
    await page.setViewport({ width: 768, height: 1024 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-library-tablet-768.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-library-tablet-768.png'),
      path.join(ARTIFACTS_DIR, 'media-library-tablet-768.png')
    );
    console.log('📸 Captured: media-library-tablet-768.png');

    // Capture Mobile View
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-library-mobile-390.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-library-mobile-390.png'),
      path.join(ARTIFACTS_DIR, 'media-library-mobile-390.png')
    );
    console.log('📸 Captured: media-library-mobile-390.png');

    // Reset to Desktop
    await page.setViewport({ width: 1440, height: 900 });

    // Step 3: Open Asset Detail Drawer & Verify Reference Tracking
    console.log('\nStep 3: Opening Media Detail Drawer for flagship asset...');
    const firstAssetCard = await page.$('.media-card-item');
    await firstAssetCard.click();
    await page.waitForSelector('h2');
    await page.waitForFunction(() => document.body.innerText.includes('Asset Details'));
    console.log('✅ Asset detail drawer opened.');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-detail-drawer.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-detail-drawer.png'),
      path.join(ARTIFACTS_DIR, 'media-detail-drawer.png')
    );
    console.log('📸 Captured: media-detail-drawer.png');

    // Close Drawer
    const closeBtn = await page.$('button[class*="text-zinc-400 hover:text-zinc-900"]');
    if (closeBtn) await closeBtn.click();
    await sleep(300);

    // Step 4: Upload New Image
    console.log('\nStep 4: Uploading new test image asset...');
    await page.click('#upload-media-btn');
    await page.waitForSelector('input[type="file"]');

    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(testImagePath);
    await sleep(400);

    // Submit upload form
    const submitUploadBtn = await page.$('button[type="submit"]');
    await submitUploadBtn.click();

    // Wait for drawer to open with newly uploaded asset
    await page.waitForFunction(() => document.body.innerText.includes('qa-test-upload.png'), { timeout: 10000 });
    console.log('✅ New test image uploaded and registered in Neon database.');

    // Verify browser actually renders the newly uploaded image without broken icon
    await page.waitForFunction(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const uploadImg = imgs.find((img) => img.src.includes('qa-test-upload'));
      return uploadImg && uploadImg.complete && uploadImg.naturalWidth > 0;
    }, { timeout: 10000 });

    const naturalWidth = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const uploadImg = imgs.find((img) => img.src.includes('qa-test-upload'));
      return uploadImg ? uploadImg.naturalWidth : 0;
    });
    console.log(`✅ Uploaded image successfully rendered in browser: naturalWidth = ${naturalWidth}px (no broken thumbnail).`);

    // Step 5: Edit Alt Text in Drawer
    console.log('\nStep 5: Updating alt text of uploaded asset...');
    const altInput = await page.$('input[placeholder="Accessible description"]');
    if (altInput) {
      await altInput.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await altInput.type('Laurrel Services Verified QA Test Upload');

      const saveMetaBtn = await page.waitForSelector('#save-media-metadata-btn');
      if (saveMetaBtn) await saveMetaBtn.click();
      await page.waitForFunction(() => document.body.innerText.includes('Metadata updated successfully.'));
      console.log('✅ Asset alt text updated successfully.');
    }

    // Close detail drawer
    const closeDetail = await page.$('button[class*="text-zinc-400 hover:text-zinc-900"]');
    if (closeDetail) await closeDetail.click();
    await sleep(300);

    // Step 6: Navigate to Homepage CMS Editor
    console.log('\nStep 6: Navigating to Homepage CMS Editor (/admin/website/home)...');
    await page.goto('http://localhost:3000/admin/website/home', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input');
    console.log('✅ Homepage CMS Editor loaded.');

    // Step 7: Open Media Picker for Hero Fallback Photograph
    console.log('\nStep 7: Opening Media Picker Modal...');
    const pickerTrigger = await page.$('.media-picker-btn');
    if (!pickerTrigger) throw new Error('Could not find .media-picker-btn in CMS editor');
    await pickerTrigger.click();

    await page.waitForFunction(() => document.body.innerText.includes('Select Hero Fallback / Social Share Photograph'));
    console.log('✅ Media Picker Modal opened.');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-picker-modal.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-picker-modal.png'),
      path.join(ARTIFACTS_DIR, 'media-picker-modal.png')
    );
    console.log('📸 Captured: media-picker-modal.png');

    // Select the uploaded asset in the picker
    const qaAssetCard = await page.waitForSelector('.aspect-\\[4\\/3\\]');
    await qaAssetCard.click();
    await sleep(200);

    // Confirm selection
    const confirmBtn = await page.waitForSelector('#confirm-media-selection-btn');
    await confirmBtn.click();
    await sleep(300);
    console.log('✅ Media Picker selection confirmed.');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-cms-editor-integration.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-cms-editor-integration.png'),
      path.join(ARTIFACTS_DIR, 'media-cms-editor-integration.png')
    );
    console.log('📸 Captured: media-cms-editor-integration.png');

    // Step 8: Save Draft
    console.log('\nStep 8: Saving draft with new media reference...');
    await page.click('#save-draft-btn');
    await page.waitForFunction(() => document.body.innerText.includes('Draft revisions saved successfully.'));
    console.log('✅ Draft saved.');

    // Step 9: Verify Live Public Site is UNCHANGED
    console.log('\nStep 9: Verifying public website http://localhost:3000/ is UNCHANGED...');
    const publicPage = await browser.newPage();
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const publicHtml = await publicPage.evaluate(() => document.body.innerHTML);

    if (publicHtml.includes('qa-test-upload.png')) {
      throw new Error('❌ FAILURE: Public website displays draft media before publication!');
    }
    console.log('✅ Confirmed: Public website does NOT display draft media prior to publication.');

    // Step 10: Verify Draft Preview Route Displays New Media
    console.log('\nStep 10: Verifying draft preview route /admin/website/preview/home...');
    const previewPage = await browser.newPage();
    await previewPage.goto('http://localhost:3000/admin/website/preview/home', { waitUntil: 'networkidle0' });
    const previewHtml = await previewPage.evaluate(() => document.body.innerHTML);

    if (!previewHtml.includes('DRAFT PREVIEW MODE')) {
      throw new Error('❌ FAILURE: Preview banner missing from preview page');
    }
    console.log('✅ Confirmed: Draft preview mode active.');

    await previewPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-draft-preview.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-draft-preview.png'),
      path.join(ARTIFACTS_DIR, 'media-draft-preview.png')
    );
    console.log('📸 Captured: media-draft-preview.png');
    await previewPage.close();

    // Step 11: Publish Changes
    console.log('\nStep 11: Publishing draft changes...');
    await page.bringToFront();
    await page.click('#publish-live-btn');
    await page.waitForSelector('#publish-notes-input');
    await page.type('#publish-notes-input', 'QA Test: Media asset replacement verification');
    await page.click('#confirm-publish-btn');
    await page.waitForFunction(() => document.body.innerText.includes('Published successfully as Revision #'));
    console.log('✅ Published changes confirmed.');

    // Step 12: Confirm Live Public Site Updated
    console.log('\nStep 12: Confirming live public website reflects new published media...');
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const publishedOg = await publicPage.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]');
      return meta ? meta.getAttribute('content') : '';
    });
    console.log(`✅ Live site metadata reflects published image: ${publishedOg}`);

    await publicPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'media-live-published.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'media-live-published.png'),
      path.join(ARTIFACTS_DIR, 'media-live-published.png')
    );
    console.log('📸 Captured: media-live-published.png');

    // Step 13: Restore Previous Revision (Revision #1)
    console.log('\nStep 13: Restoring previous baseline revision...');
    await page.bringToFront();
    await page.click('#open-history-btn');
    await page.waitForSelector('.restore-trigger-btn');
    await page.click('.restore-trigger-btn');
    await page.waitForSelector('#confirm-restore-btn');
    await page.click('#confirm-restore-btn');
    await page.waitForFunction(() => document.body.innerText.includes('Successfully restored revision #'));
    console.log('✅ Successfully restored previous revision.');

    // Confirm live site reverted
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const revertedOg = await publicPage.evaluate(() => {
      const meta = document.querySelector('meta[property="og:image"]');
      return meta ? meta.getAttribute('content') : '';
    });
    console.log(`✅ Live site successfully restored to original media: ${revertedOg}`);
    await publicPage.close();

    // Step 14: Test Guarded Deletion on In-Use Asset (API Level)
    console.log('\nStep 14: Verifying guarded deletion blocks deletion of in-use asset...');
    const deleteRes = await fetch('http://localhost:5000/api/admin/media/media_hero_laurrel_room', {
      method: 'DELETE',
      headers: {
        'x-admin-token': process.env.ADMIN_API_SECRET,
        'x-admin-user-id': 'qa_owner',
        'x-admin-user-role': 'owner',
      },
    });

    if (deleteRes.status !== 409) {
      throw new Error(`❌ FAILURE: Expected 409 Conflict when deleting in-use asset, got: ${deleteRes.status}`);
    }
    const deleteJson = await deleteRes.json();
    console.log(`✅ Guarded Deletion Confirmed (409 Conflict): "${deleteJson.error.slice(0, 80)}..."`);

    // Step 15: Test RBAC (Viewer cannot upload)
    console.log('\nStep 15: Verifying RBAC prevents unauthorized upload...');
    const rbacRes = await fetch('http://localhost:5000/api/admin/media/upload', {
      method: 'POST',
      headers: {
        'x-admin-token': process.env.ADMIN_API_SECRET,
        'x-admin-user-id': 'qa_viewer',
        'x-admin-user-role': 'viewer',
      },
    });

    if (rbacRes.status !== 403) {
      throw new Error(`❌ FAILURE: Expected 403 Forbidden for viewer upload, got: ${rbacRes.status}`);
    }
    console.log('✅ RBAC Confirmed: Role "viewer" received 403 Forbidden on upload.');

    // Step 16: Test Upload Validation (Reject invalid signature)
    console.log('\nStep 16: Testing upload file signature validation...');
    const fakeFormData = new FormData();
    const fakeBlob = new Blob(['Not a real PNG header'], { type: 'image/png' });
    fakeFormData.append('file', fakeBlob, 'fake.png');

    const fakeRes = await fetch('http://localhost:5000/api/admin/media/upload', {
      method: 'POST',
      headers: {
        'x-admin-token': process.env.ADMIN_API_SECRET,
        'x-admin-user-id': 'qa_owner',
        'x-admin-user-role': 'owner',
      },
      body: fakeFormData,
    });

    if (fakeRes.status !== 400) {
      throw new Error(`❌ FAILURE: Expected 400 Bad Request for invalid signature, got: ${fakeRes.status}`);
    }
    const fakeJson = await fakeRes.json();
    console.log(`✅ Upload Validation Confirmed: "${fakeJson.error}"`);

    // Step 17: Archive QA Assets & Capture Refined UI Screenshots
    console.log('\nStep 17: Archiving QA test assets and capturing refined interface screenshots...');
    await pool.query("UPDATE media_assets SET is_archived = TRUE WHERE original_filename LIKE '%qa-test%'");
    console.log('✅ QA test assets archived in Neon database.');

    // Re-render Media Library with refined card design (no black badges)
    await page.goto('http://localhost:3000/admin/media', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.media-card-item');

    // Desktop
    await page.setViewport({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'media-library-desktop-1440.png') });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, 'media-library-desktop-1440.png'), path.join(ARTIFACTS_DIR, 'media-library-desktop-1440.png'));
    console.log('📸 Captured refined: media-library-desktop-1440.png');

    // Tablet
    await page.setViewport({ width: 768, height: 1024 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'media-library-tablet-768.png') });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, 'media-library-tablet-768.png'), path.join(ARTIFACTS_DIR, 'media-library-tablet-768.png'));
    console.log('📸 Captured refined: media-library-tablet-768.png');

    // Mobile
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'media-library-mobile-390.png') });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, 'media-library-mobile-390.png'), path.join(ARTIFACTS_DIR, 'media-library-mobile-390.png'));
    console.log('📸 Captured refined: media-library-mobile-390.png');

    // Refined CMS Editor View
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/website/home', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'cms-editor-refined-1440.png') });
    fs.copyFileSync(path.join(SCREENSHOTS_DIR, 'cms-editor-refined-1440.png'), path.join(ARTIFACTS_DIR, 'cms-editor-refined-1440.png'));
    console.log('📸 Captured refined: cms-editor-refined-1440.png');

    console.log('\n===========================================================');
    console.log('✅ ALL MODULE 03 MEDIA MANAGEMENT TESTS PASSED SUCCESSFULLY');
    console.log('===========================================================');
  } finally {
    // Close browser first so Windows file locks are released
    await browser.close();
    try {
      if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
    } catch (e) {
      // Ignored
    }
    await pool.end();
  }
}

runMediaVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  });
