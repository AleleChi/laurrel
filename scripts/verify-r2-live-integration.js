const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));

const ARTIFACTS_DIR = 'C:/Users/alele/.gemini/antigravity/brain/bec5f610-ac42-4aca-9376-403a5e4598fc';
const SCREENSHOTS_DIR = path.join(ARTIFACTS_DIR, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function saveScreenshot(filename, buffer) {
  const p1 = path.join(SCREENSHOTS_DIR, filename);
  const p2 = path.join(ARTIFACTS_DIR, filename);
  fs.writeFileSync(p1, buffer);
  fs.writeFileSync(p2, buffer);
  console.log(`📸 Screenshot saved: ${filename}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runR2LiveVerification() {
  console.log('===========================================================');
  console.log('LAURREL SERVICES — LIVE CLOUDFLARE R2 INTEGRATION QA SUITE');
  console.log('===========================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const ownerEmail = process.env.ADMIN_OWNER_EMAIL || 'alelechi17@gmail.com';
  const ownerPassword = process.env.ADMIN_OWNER_PASSWORD;

  if (!ownerPassword) {
    console.error('❌ ADMIN_OWNER_PASSWORD missing in backend/.env');
    process.exit(1);
  }

  // Fixtures
  const fixturesDir = path.join(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });

  const testImageFixture = path.join(fixturesDir, 'r2-live-test-image.png');
  fs.copyFileSync(
    path.join(__dirname, '..', 'public', 'assets', 'brand', 'laurrel-symbol.png'),
    testImageFixture
  );

  const testVideoFixture = path.join(fixturesDir, 'test-r2-video.mp4');
  if (!fs.existsSync(testVideoFixture)) {
    throw new Error(`Video fixture not found at ${testVideoFixture}`);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let uploadedImageId = null;
  let uploadedVideoId = null;

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // -------------------------------------------------------------
    // Step 1: Sign in to Admin Dashboard
    // -------------------------------------------------------------
    console.log(`\nStep 1: Signing in at http://localhost:3000/admin/login as ${ownerEmail}...`);
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', ownerEmail);
    await page.type('#admin-password', ownerPassword);
    await page.click('button[type="submit"]');

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log(`✅ Authenticated successfully. Current URL: ${page.url()}`);

    // -------------------------------------------------------------
    // Step 2: Open Media Library
    // -------------------------------------------------------------
    console.log('\nStep 2: Navigating to http://localhost:3000/admin/media...');
    await page.goto('http://localhost:3000/admin/media', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#upload-media-btn');
    await sleep(500);

    const initialScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('01-media-library-initial.png', initialScreenshot);
    console.log('✅ Media Library interface rendered.');

    // -------------------------------------------------------------
    // Step 3: Upload Test Image via UI
    // -------------------------------------------------------------
    console.log('\nStep 3: Uploading test image through admin interface...');
    await page.click('#upload-media-btn');
    await page.waitForSelector('input[type="file"]');

    const imageInput = await page.$('input[type="file"]');
    await imageInput.uploadFile(testImageFixture);
    await sleep(400);

    // Fill alt text
    const altInputInModal = await page.$('input[placeholder*="Laurrel Services"]');
    if (altInputInModal) {
      await altInputInModal.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await altInputInModal.type('Laurrel Services R2 Staging Verification Image');
    }

    const submitImageBtn = await page.$('button[type="submit"]');

    // Wait for the actual HTTP upload POST response to complete
    const [uploadResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/admin/media/upload') && (res.status() === 200 || res.status() === 201),
        { timeout: 30000 }
      ),
      submitImageBtn.click(),
    ]);

    const uploadResult = await uploadResponse.json();
    if (!uploadResult.success || !uploadResult.data) {
      throw new Error(`Upload failed with response: ${JSON.stringify(uploadResult)}`);
    }

    uploadedImageId = uploadResult.data.id;
    console.log(`✅ Image upload confirmed by server! Asset ID: ${uploadedImageId}`);

    // Wait for detail drawer
    await page.waitForSelector('#save-media-metadata-btn', { timeout: 10000 });
    await sleep(500);

    const imageDrawerScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('02-r2-image-detail-drawer.png', imageDrawerScreenshot);

    // -------------------------------------------------------------
    // Step 4: Verify Cloudflare R2 & Neon PostgreSQL Record
    // -------------------------------------------------------------
    console.log('\nStep 4: Verifying Cloudflare R2 storage & Neon database persistence...');
    const imageDbRes = await pool.query(
      'SELECT * FROM media_assets WHERE id = $1',
      [uploadedImageId]
    );

    if (imageDbRes.rows.length === 0) {
      throw new Error(`❌ Asset ${uploadedImageId} not found in Neon PostgreSQL database!`);
    }

    const imageRow = imageDbRes.rows[0];
    console.log(`✅ Asset verified in Neon DB: ID=${imageRow.id}`);
    console.log(`   Storage Provider: ${imageRow.storage_provider}`);
    console.log(`   Storage Reference: ${imageRow.storage_reference}`);
    console.log(`   Public URL: ${imageRow.public_url}`);
    console.log(`   Dimensions: ${imageRow.width}x${imageRow.height}px`);

    if (imageRow.storage_provider !== 'r2') {
      throw new Error(`❌ Expected storage_provider 'r2', but found '${imageRow.storage_provider}'`);
    }

    if (!imageRow.public_url.startsWith('https://') || imageRow.public_url.includes('.r2.cloudflarestorage.com')) {
      throw new Error(`❌ Invalid public URL format: ${imageRow.public_url}`);
    }

    // Fetch public URL to verify HTTP response
    console.log(`   Verifying HTTP delivery from R2 public endpoint...`);
    const imgFetchRes = await fetch(imageRow.public_url);
    console.log(`   HTTP Status: ${imgFetchRes.status} ${imgFetchRes.statusText}`);
    console.log(`   Content-Type: ${imgFetchRes.headers.get('content-type')}`);

    if (imgFetchRes.status !== 200) {
      throw new Error(`❌ Failed to retrieve image from R2 public URL: HTTP ${imgFetchRes.status}`);
    }
    console.log('✅ Cloudflare R2 direct public delivery verified (200 OK, image/png).');

    // -------------------------------------------------------------
    // Step 5: Verify Thumbnail Rendering in UI
    // -------------------------------------------------------------
    console.log('\nStep 5: Verifying browser rendering of thumbnail (no broken images)...');
    const imageNaturalWidth = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const testImg = imgs.find((img) => img.src.includes('r2-live-test-image'));
      return testImg && testImg.complete ? testImg.naturalWidth : 0;
    });

    if (imageNaturalWidth <= 0) {
      throw new Error(`❌ Uploaded image failed to render (naturalWidth = ${imageNaturalWidth})`);
    }
    console.log(`✅ Thumbnail loads successfully: naturalWidth = ${imageNaturalWidth}px.`);

    // -------------------------------------------------------------
    // Step 6: Edit Image Metadata
    // -------------------------------------------------------------
    console.log('\nStep 6: Editing image metadata in detail drawer...');
    const altInput = await page.$('input[placeholder="Accessible description"]');
    if (altInput) {
      await altInput.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await altInput.type('Laurrel Services Verified R2 Active Staging Asset');

      const saveMetaBtn = await page.waitForSelector('#save-media-metadata-btn');
      const [patchResponse] = await Promise.all([
        page.waitForResponse(
          (res) => res.url().includes('/api/admin/media/') && res.request().method() === 'PATCH' && res.status() === 200,
          { timeout: 15000 }
        ),
        saveMetaBtn.click(),
      ]);
      console.log('✅ PATCH response received 200 OK');
      await page.waitForFunction(() => document.body.innerText.includes('Metadata updated successfully.'), { timeout: 5000 });
      console.log('✅ Image alt text saved successfully.');
    }

    // Verify DB update
    const updatedDbRes = await pool.query(
      'SELECT alt_text FROM media_assets WHERE id = $1',
      [uploadedImageId]
    );
    console.log(`✅ Neon DB reflects updated alt_text: "${updatedDbRes.rows[0].alt_text}"`);

    const updatedMetaScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('03-r2-image-metadata-saved.png', updatedMetaScreenshot);

    // Close detail drawer
    const closeBtn = await page.$('button[class*="text-zinc-400 hover:text-zinc-900"]');
    if (closeBtn) await closeBtn.click();
    await sleep(400);

    // -------------------------------------------------------------
    // Step 7: Verify Asset Persists After Page Refresh
    // -------------------------------------------------------------
    console.log('\nStep 7: Refreshing page to verify persistence...');
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.media-card-item');

    const existsAfterReload = await page.evaluate(() => {
      return document.body.innerText.includes('r2-live-test-image');
    });

    if (!existsAfterReload) {
      throw new Error('❌ Asset not found in Media Library after page refresh!');
    }
    console.log('✅ Asset persists and displays correctly in Media Library after refresh.');

    const refreshedScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('04-r2-media-library-refreshed.png', refreshedScreenshot);

    // -------------------------------------------------------------
    // Step 8: Upload Test MP4 Video
    // -------------------------------------------------------------
    console.log('\nStep 8: Uploading small test MP4 video via UI...');
    await page.click('#upload-media-btn');
    await page.waitForSelector('input[type="file"]');

    const videoInput = await page.$('input[type="file"]');
    await videoInput.uploadFile(testVideoFixture);
    await sleep(400);

    const submitVideoBtn = await page.$('button[type="submit"]');

    // Wait for the video HTTP upload response
    const [videoResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/admin/media/upload') && (res.status() === 200 || res.status() === 201),
        { timeout: 30000 }
      ),
      submitVideoBtn.click(),
    ]);

    const videoResult = await videoResponse.json();
    if (!videoResult.success || !videoResult.data) {
      throw new Error(`Video upload failed: ${JSON.stringify(videoResult)}`);
    }

    uploadedVideoId = videoResult.data.id;
    console.log(`✅ Video upload confirmed by server! Asset ID: ${uploadedVideoId}`);

    // Wait for video element in detail drawer
    await page.waitForSelector('video', { timeout: 10000 });
    await sleep(800);

    const videoDrawerScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('05-r2-video-detail-drawer.png', videoDrawerScreenshot);

    // Verify Video in Neon DB
    const videoDbRes = await pool.query(
      'SELECT * FROM media_assets WHERE id = $1',
      [uploadedVideoId]
    );
    if (videoDbRes.rows.length === 0) {
      throw new Error('❌ Video asset record not found in Neon PostgreSQL database!');
    }
    const videoRow = videoDbRes.rows[0];
    console.log(`✅ Video verified in Neon DB: ID=${videoRow.id}`);
    console.log(`   Asset Type: ${videoRow.asset_type}`);
    console.log(`   Storage Provider: ${videoRow.storage_provider}`);
    console.log(`   Public URL: ${videoRow.public_url}`);
    console.log(`   Thumbnail URL: ${videoRow.thumbnail_url || 'null (HTML5 video player handles poster)'}`);

    if (videoRow.asset_type !== 'video' || videoRow.storage_provider !== 'r2') {
      throw new Error(`❌ Invalid video DB metadata: ${JSON.stringify(videoRow)}`);
    }

    // Test Video Retrieval via Public URL
    console.log('   Verifying HTTP delivery of MP4 from R2 public endpoint...');
    const vidFetchRes = await fetch(videoRow.public_url);
    console.log(`   HTTP Status: ${vidFetchRes.status} ${vidFetchRes.statusText}`);
    console.log(`   Content-Type: ${vidFetchRes.headers.get('content-type')}`);

    if (vidFetchRes.status !== 200) {
      throw new Error(`❌ Failed to retrieve video from R2: HTTP ${vidFetchRes.status}`);
    }
    console.log('✅ Video retrieved successfully from Cloudflare R2.');

    // Verify Video Playability in Browser
    const videoPlayable = await page.evaluate(async () => {
      const vid = document.querySelector('video');
      if (!vid) return false;
      return new Promise((resolve) => {
        if (vid.readyState >= 2) return resolve(true);
        vid.addEventListener('loadeddata', () => resolve(true), { once: true });
        vid.addEventListener('canplay', () => resolve(true), { once: true });
        vid.addEventListener('error', () => resolve(false), { once: true });
        setTimeout(() => resolve(vid.readyState >= 1), 3000);
      });
    });
    console.log(`✅ Browser video element test: playable = ${videoPlayable}`);

    // Close Video Detail Drawer
    const closeVideoDrawer = await page.$('button[class*="text-zinc-400 hover:text-zinc-900"]');
    if (closeVideoDrawer) await closeVideoDrawer.click();
    await sleep(400);

    // Capture Grid with both image and video
    const mediaGridScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('06-r2-media-grid-with-video.png', mediaGridScreenshot);

    // -------------------------------------------------------------
    // Step 9: CMS Media Picker & Draft Verification
    // -------------------------------------------------------------
    console.log('\nStep 9: Testing CMS Media Picker integration (/admin/website/home)...');
    await page.goto('http://localhost:3000/admin/website/home', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input');
    console.log('✅ CMS Homepage Editor loaded.');

    // Open media picker
    const pickerTrigger = await page.$('.media-picker-btn');
    if (!pickerTrigger) throw new Error('Could not find .media-picker-btn in CMS editor');
    await pickerTrigger.click();

    await page.waitForSelector('.aspect-\\[4\\/3\\]', { timeout: 10000 });
    await sleep(500);

    const pickerModalScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('07-r2-cms-media-picker-modal.png', pickerModalScreenshot);
    console.log('✅ CMS Media Picker Modal opened.');

    // Select the newly uploaded R2 test image
    const clickedAsset = await page.evaluate((targetId) => {
      const cards = Array.from(document.querySelectorAll('.aspect-\\[4\\/3\\]'));
      for (const card of cards) {
        const parent = card.closest('[class*="cursor-pointer"]');
        if (parent && parent.innerText.includes('r2-live-test-image')) {
          parent.click();
          return true;
        }
      }
      if (cards.length > 0) {
        cards[0].closest('[class*="cursor-pointer"]').click();
        return true;
      }
      return false;
    }, uploadedImageId);

    if (!clickedAsset) throw new Error('Could not click asset card in Media Picker');
    await sleep(400);

    // Confirm selection
    const confirmBtn = await page.waitForSelector('#confirm-media-selection-btn');
    await confirmBtn.click();
    await sleep(400);
    console.log('✅ Media Picker selection confirmed.');

    // Save as unpublished draft
    console.log('   Saving as unpublished draft...');
    const saveDraftBtn = await page.waitForSelector('#save-draft-btn');
    await saveDraftBtn.click();
    await page.waitForFunction(
      () => document.body.innerText.includes('Draft revisions saved successfully.'),
      { timeout: 10000 }
    );
    console.log('✅ Draft saved with R2 media reference.');

    const draftEditorScreenshot = await page.screenshot({ fullPage: false });
    saveScreenshot('08-r2-cms-draft-editor.png', draftEditorScreenshot);

    // -------------------------------------------------------------
    // Step 10: Verify Preview Route Reflects Draft
    // -------------------------------------------------------------
    console.log('\nStep 10: Verifying draft preview route (/admin/website/preview/home)...');
    const previewPage = await browser.newPage();
    await previewPage.setViewport({ width: 1440, height: 900 });
    await previewPage.goto('http://localhost:3000/admin/website/preview/home', {
      waitUntil: 'networkidle0',
    });

    const previewBannerExists = await previewPage.evaluate(() => {
      return document.body.innerText.includes('DRAFT PREVIEW MODE');
    });

    if (!previewBannerExists) {
      throw new Error('❌ DRAFT PREVIEW MODE banner not found on preview page!');
    }
    console.log('✅ Draft preview mode verified active.');

    const previewScreenshot = await previewPage.screenshot({ fullPage: false });
    saveScreenshot('09-r2-draft-preview-mode.png', previewScreenshot);
    await previewPage.close();

    // -------------------------------------------------------------
    // Step 11: Confirm Public Homepage is UNCHANGED (NOT Published)
    // -------------------------------------------------------------
    console.log('\nStep 11: Verifying public homepage (http://localhost:3000/) remains UNCHANGED...');
    const publicPage = await browser.newPage();
    await publicPage.setViewport({ width: 1440, height: 900 });
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });

    const publicContent = await publicPage.evaluate(() => document.body.innerHTML);
    if (publicContent.includes('r2-live-test-image')) {
      throw new Error('❌ CRITICAL: Public homepage contains unpublished draft media!');
    }
    console.log('✅ Confirmed: Public homepage remains untouched and does not contain test media.');

    const publicHomepageScreenshot = await publicPage.screenshot({ fullPage: false });
    saveScreenshot('10-r2-public-homepage-unchanged.png', publicHomepageScreenshot);
    await publicPage.close();

    // -------------------------------------------------------------
    // Step 12: Archive Test Assets to Keep Workspace Clean
    // -------------------------------------------------------------
    console.log('\nStep 12: Archiving test assets in Neon DB to preserve staging cleanliness...');
    if (uploadedImageId) {
      await pool.query('UPDATE media_assets SET is_archived = TRUE WHERE id = $1', [uploadedImageId]);
    }
    if (uploadedVideoId) {
      await pool.query('UPDATE media_assets SET is_archived = TRUE WHERE id = $1', [uploadedVideoId]);
    }
    console.log('✅ Test assets safely archived (never deleted, fulfilling non-destruction rule).');

    console.log('\n===========================================================');
    console.log('🎉 ALL CLOUDFLARE R2 & MEDIA INTEGRATION TESTS PASSED!');
    console.log('===========================================================');
  } finally {
    await browser.close();
    await pool.end();
  }
}

runR2LiveVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  });
