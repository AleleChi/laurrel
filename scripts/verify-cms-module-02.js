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

async function runCmsVerification() {
  console.log('===========================================================');
  console.log('LAURREL SERVICES — CMS MODULE 02 VERIFICATION SUITE');
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

    // Step 2: Open Website Content Overview
    console.log('\nStep 2: Navigating to /admin/website...');
    await page.goto('http://localhost:3000/admin/website', { waitUntil: 'networkidle0' });
    await page.waitForSelector('table');
    console.log('✅ CMS Overview table rendered.');

    // Capture Overview Desktop Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'cms-overview-desktop-1440.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'cms-overview-desktop-1440.png'),
      path.join(ARTIFACTS_DIR, 'cms-overview-desktop-1440.png')
    );
    console.log('📸 Captured: cms-overview-desktop-1440.png');

    // Capture Overview Mobile Screenshot
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'cms-overview-mobile-390.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'cms-overview-mobile-390.png'),
      path.join(ARTIFACTS_DIR, 'cms-overview-mobile-390.png')
    );
    console.log('📸 Captured: cms-overview-mobile-390.png');

    // Step 3: Open Homepage Editor
    console.log('\nStep 3: Opening Homepage Editor at /admin/website/home...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/website/home', { waitUntil: 'networkidle0' });
    await page.waitForSelector('input');
    console.log('✅ Homepage editor workspace loaded.');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'cms-editor-desktop-1440.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'cms-editor-desktop-1440.png'),
      path.join(ARTIFACTS_DIR, 'cms-editor-desktop-1440.png')
    );
    console.log('📸 Captured: cms-editor-desktop-1440.png');

    // Step 4: Edit hero headline line 1
    console.log('\nStep 4: Editing hero headline line 1 to draft value...');
    await page.waitForSelector('#hero-headline-line1');
    const headlineInput = await page.$('#hero-headline-line1');
    if (!headlineInput) throw new Error('Could not find #hero-headline-line1 input field');

    await headlineInput.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await headlineInput.type('Clean spaces in the Capital.');

    // Step 5: Save Draft
    console.log('Step 5: Clicking Save Draft...');
    await page.waitForSelector('#save-draft-btn:not([disabled])');
    await page.click('#save-draft-btn');
    await page.waitForFunction(() => document.body.innerText.includes('Draft revisions saved successfully.'));
    console.log('✅ Draft saved message confirmed in UI.');

    // Step 6: Verify public website is UNCHANGED
    console.log('\nStep 6: Verifying public website http://localhost:3000/ is UNCHANGED...');
    const publicPage = await browser.newPage();
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const publicText = await publicPage.evaluate(() => document.body.innerText);

    if (publicText.includes('Clean spaces in the Capital.')) {
      throw new Error('❌ FAILURE: Public website displayed draft changes before publication!');
    }
    if (!publicText.includes('Clean spaces.')) {
      throw new Error('❌ FAILURE: Original headline not found on public website!');
    }
    console.log('✅ Public website confirmed unchanged. Original "Clean spaces." is still live.');

    // Step 7: Preview Draft
    console.log('\nStep 7: Verifying draft preview route http://localhost:3000/admin/website/preview/home...');
    const previewPage = await browser.newPage();
    await previewPage.setViewport({ width: 1440, height: 900 });
    await previewPage.goto('http://localhost:3000/admin/website/preview/home', { waitUntil: 'networkidle0' });
    const previewText = await previewPage.evaluate(() => document.body.innerText);

    if (!previewText.includes('DRAFT PREVIEW MODE')) {
      throw new Error('❌ FAILURE: Preview banner missing from preview page');
    }
    if (!previewText.includes('Clean spaces in the Capital.')) {
      throw new Error('❌ FAILURE: Draft change did not appear in preview');
    }
    console.log('✅ Draft preview confirmed: Shows banner and unpublished heading "Clean spaces in the Capital."');

    await previewPage.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'cms-draft-preview-1440.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'cms-draft-preview-1440.png'),
      path.join(ARTIFACTS_DIR, 'cms-draft-preview-1440.png')
    );
    console.log('📸 Captured: cms-draft-preview-1440.png');
    await previewPage.close();

    // Step 8: Publish the change
    console.log('\nStep 8: Publishing changes to live site...');
    await page.bringToFront();
    await page.waitForSelector('#publish-live-btn:not([disabled])');
    await page.click('#publish-live-btn');

    await page.waitForSelector('#publish-notes-input');
    await page.type('#publish-notes-input', 'QA Test: Hero headline update verification');
    await page.click('#confirm-publish-btn');

    await page.waitForFunction(() => document.body.innerText.includes('Published successfully as Revision #'));
    console.log('✅ Published successfully confirmed in UI.');

    // Step 9: Confirm published heading appears on public website
    console.log('\nStep 9: Confirming published heading appears on public website...');
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const updatedPublicText = await publicPage.evaluate(() => document.body.innerText);

    if (!updatedPublicText.includes('Clean spaces in the Capital.')) {
      throw new Error('❌ FAILURE: Published heading did not reflect on live website!');
    }
    console.log('✅ Confirmed: Published heading "Clean spaces in the Capital." is now live on the public website!');

    // Step 10: Open Revision History & Restore Revision #1
    console.log('\nStep 10: Opening Revision History to restore Revision #1...');
    await page.bringToFront();
    await page.waitForSelector('#open-history-btn');
    await page.click('#open-history-btn');
    await page.waitForSelector('.restore-trigger-btn');
    console.log('✅ Revision history drawer opened.');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'cms-revision-history-drawer.png'),
      fullPage: false,
    });
    fs.copyFileSync(
      path.join(SCREENSHOTS_DIR, 'cms-revision-history-drawer.png'),
      path.join(ARTIFACTS_DIR, 'cms-revision-history-drawer.png')
    );
    console.log('📸 Captured: cms-revision-history-drawer.png');

    await page.click('.restore-trigger-btn');
    await page.waitForSelector('#confirm-restore-btn');
    await page.click('#confirm-restore-btn');

    await page.waitForFunction(() => document.body.innerText.includes('Successfully restored revision #'));
    console.log('✅ Restored revision confirmed in UI.');

    // Step 11: Confirm original content is restored on public website
    console.log('\nStep 11: Confirming original content is restored on public website...');
    await publicPage.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    const restoredPublicText = await publicPage.evaluate(() => document.body.innerText);

    if (!restoredPublicText.includes('Clean spaces.')) {
      throw new Error('❌ FAILURE: Original headline was not restored on public website!');
    }
    console.log('✅ Confirmed: Original "Clean spaces." is successfully restored on live site!');
    await publicPage.close();

    // Step 12: Test RBAC - Unauthorized user cannot publish
    console.log('\nStep 12: Testing RBAC enforcement (Unauthorized publishing attempt)...');
    const rbacRes = await fetch('http://localhost:5000/api/admin/cms/pages/home/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': process.env.ADMIN_API_SECRET,
        'x-admin-user-id': 'test_viewer_id',
        'x-admin-user-role': 'viewer',
      },
      body: JSON.stringify({ notes: 'Illegal publish test' }),
    });

    if (rbacRes.status !== 403) {
      throw new Error(`❌ FAILURE: Expected 403 Forbidden for viewer role, got: ${rbacRes.status}`);
    }
    console.log('✅ RBAC Confirmed: Role "viewer" received 403 Forbidden on publish.');

    // Step 13: Test input sanitization against XSS
    console.log('\nStep 13: Testing input sanitization...');
    const sanitizeRes = await fetch('http://localhost:5000/api/admin/cms/pages/home/draft', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': process.env.ADMIN_API_SECRET,
        'x-admin-user-id': 'test_owner_id',
        'x-admin-user-role': 'owner',
      },
      body: JSON.stringify({
        sections: {
          hero: {
            eyebrow: 'Test <script>alert("xss")</script> Eyebrow',
          },
        },
      }),
    });
    const sanitizeData = await sanitizeRes.json();
    const cleanEyebrow = sanitizeData.page?.sections?.find((s) => s.sectionKey === 'hero')?.draftContent?.eyebrow;

    if (cleanEyebrow && cleanEyebrow.includes('<script>')) {
      throw new Error('❌ FAILURE: Script tag was not stripped by sanitizer!');
    }
    console.log(`✅ Input Sanitized: "${cleanEyebrow}" (Script tag stripped cleanly).`);

    // Step 14: Responsive screenshots of About, Services, and Contact Editors
    console.log('\nStep 14: Capturing responsive screenshots of About, Services, Contact editors...');
    const viewports = [
      { name: 'desktop-1440', width: 1440, height: 900 },
      { name: 'tablet-768', width: 768, height: 1024 },
      { name: 'mobile-390', width: 390, height: 844 },
    ];

    for (const pId of ['about', 'services', 'contact']) {
      for (const vp of viewports) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.goto(`http://localhost:3000/admin/website/${pId}`, { waitUntil: 'networkidle0' });
        const filename = `cms-editor-${pId}-${vp.name}.png`;
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, filename),
          fullPage: false,
        });
        fs.copyFileSync(
          path.join(SCREENSHOTS_DIR, filename),
          path.join(ARTIFACTS_DIR, filename)
        );
        console.log(`📸 Captured: ${filename}`);
      }
    }

    console.log('\n===========================================================');
    console.log('✅ ALL MODULE 02 CMS VERIFICATION TESTS PASSED SUCCESSFULLY');
    console.log('===========================================================');
  } finally {
    await browser.close();
    await pool.end();
  }
}

runCmsVerification().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
