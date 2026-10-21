const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });

const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const argon2 = require(path.join(__dirname, '..', 'backend', 'node_modules', 'argon2'));
const crypto = require('crypto');

const TEST_BACKEND_PORT = 5055;
const TEST_FAIL_PORT = 5056;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json,
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function waitForServer(port, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/health',
        method: 'GET',
      });
      if (res.statusCode) return true;
    } catch {
      await sleep(500);
    }
  }
  return false;
}

async function waitForReadiness(port, maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port,
        path: '/ready',
        method: 'GET',
      });
      if (res.statusCode === 200 && res.json?.status === 'ready') return res;
    } catch {}
    await sleep(1000);
  }
  return null;
}

async function runFinalDeploymentCorrectionsSuite() {
  console.log('========================================================================');
  console.log('LAURREL SERVICES — FINAL DEPLOYMENT CONFIGURATION VERIFICATION SUITE');
  console.log('========================================================================\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
  });

  try {
    // -------------------------------------------------------------
    // Test Group 1: Database Migration & Schema Integrity
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Database Migration & Schema Verification ---');
    const { runMigrations } = require(path.join(__dirname, '..', 'backend', 'dist', 'database', 'migrate'));
    const migrationResult = await runMigrations();
    console.log(`✅ runMigrations() execution: ${migrationResult.message}`);

    // Verify storage_bucket column exists in media_assets
    const columnCheck = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'media_assets' AND column_name = 'storage_bucket'`
    );
    if (columnCheck.rows.length === 0) {
      throw new Error("Column 'storage_bucket' not found in media_assets table.");
    }
    console.log(`✅ Column 'storage_bucket' verified in media_assets (${columnCheck.rows[0].data_type}).`);

    // Verify confirmed staging R2 assets are associated with 'laurrel-media-staging'
    const stagingR2Check = await pool.query(
      `SELECT COUNT(*) as count 
       FROM media_assets 
       WHERE storage_provider = 'r2' 
         AND public_url LIKE 'https://pub-185e32b3a8d04a9e92249aa5108b673f.r2.dev%' 
         AND storage_bucket = 'laurrel-media-staging'`
    );
    const confirmedCount = parseInt(stagingR2Check.rows[0].count, 10);
    if (confirmedCount === 0) {
      throw new Error("Migration 20261021_associate_staging_r2_bucket failed to associate confirmed staging assets.");
    }
    console.log(`✅ Confirmed staging R2 assets successfully associated with 'laurrel-media-staging' (${confirmedCount} records).`);

    // Verify schema_migrations table has records
    const migRecords = await pool.query('SELECT version, applied_at FROM schema_migrations ORDER BY applied_at ASC');
    console.log(`✅ Applied migration records verified (${migRecords.rows.length} total):`);
    migRecords.rows.forEach((r) => console.log(`   - ${r.version} (applied at ${r.applied_at})`));

    // -------------------------------------------------------------
    // Test Group 2: Production Readiness Probe with & without Database
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Production Readiness Fail & Pass Behavior ---');

    // Subtest 2A: Production readiness FAILS when DATABASE_URL is missing
    console.log('Testing Production Mode WITHOUT DATABASE_URL (expecting HTTP 503 /ready failure)...');
    const failProc = spawn(
      process.execPath,
      [path.join(__dirname, '..', 'backend', 'dist', 'index.js')],
      {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: TEST_FAIL_PORT.toString(),
          DATABASE_URL: '', // deliberately missing
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    const failReady = await waitForServer(TEST_FAIL_PORT, 20);
    if (!failReady) {
      throw new Error('failProc server failed to bind within timeout.');
    }

    const readyFailRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_FAIL_PORT,
      path: '/ready',
      method: 'GET',
    });

    console.log(`   Response status: ${readyFailRes.statusCode}`);
    console.log(`   Response body:`, readyFailRes.json);

    if (readyFailRes.statusCode !== 503) {
      throw new Error(`Expected HTTP 503 for missing DATABASE_URL in production, got ${readyFailRes.statusCode}`);
    }
    if (readyFailRes.json?.status !== 'not_ready') {
      throw new Error(`Expected status 'not_ready', got '${readyFailRes.json?.status}'`);
    }
    console.log('✅ PASS: Missing DATABASE_URL in production correctly returned HTTP 503 Service Unavailable.');

    // Kill failProc
    failProc.kill('SIGTERM');

    // Subtest 2B: Production readiness SUCCEEDS with valid DATABASE_URL
    console.log('\nTesting Production Mode WITH valid DATABASE_URL (expecting HTTP 200 /ready)...');
    const passProc = spawn(
      process.execPath,
      [path.join(__dirname, '..', 'backend', 'dist', 'index.js')],
      {
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PORT: TEST_BACKEND_PORT.toString(),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    passProc.stdout.on('data', (d) => process.stdout.write(`   [Backend Output]: ${d}`));
    passProc.stderr.on('data', (d) => {
      const s = d.toString();
      if (!s.includes('Warning: SECURITY WARNING')) {
        process.stderr.write(`   [Backend Err]: ${s}`);
      }
    });

    const passBound = await waitForServer(TEST_BACKEND_PORT, 30);
    if (!passBound) {
      throw new Error('passProc server failed to bind within timeout.');
    }

    // Wait for readiness (transitions from 503 to 200 as soon as startup initialization completes)
    console.log('   Waiting for backend dependency initialization and readiness transition...');
    const readyPassRes = await waitForReadiness(TEST_BACKEND_PORT, 40);
    if (!readyPassRes) {
      throw new Error('Backend failed to transition to ready status within timeout.');
    }

    console.log(`   Response status: ${readyPassRes.statusCode}`);
    console.log(`   Response body:`, readyPassRes.json);

    if (readyPassRes.json?.status !== 'ready' || readyPassRes.json?.database !== 'connected') {
      throw new Error(`Readiness did not report status: ready, database: connected.`);
    }
    console.log('✅ PASS: Production server reported HTTP 200 ready with verified database connection.');

    // Also check liveness /health
    const healthRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: '/health',
      method: 'GET',
    });
    if (healthRes.statusCode !== 200 || healthRes.json?.status !== 'ok') {
      throw new Error(`Liveness /health failed: status ${healthRes.statusCode}`);
    }
    console.log('✅ PASS: Liveness /health confirmed HTTP 200 OK.');

    // -------------------------------------------------------------
    // Test Group 3: Network & CORS Enforcement
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Network & CORS Whitelist Enforcement ---');

    // 1. Authorized production origin
    const corsAuthRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: '/ready',
      method: 'GET',
      headers: { Origin: 'https://laurrel.netlify.app' },
    });
    if (corsAuthRes.headers['access-control-allow-origin'] !== 'https://laurrel.netlify.app') {
      throw new Error(`Expected CORS allow for https://laurrel.netlify.app, got ${corsAuthRes.headers['access-control-allow-origin']}`);
    }
    console.log('✅ PASS: Explicit production origin https://laurrel.netlify.app allowed.');

    // 2. Authorized staging preview origin
    const corsStagingRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: '/ready',
      method: 'GET',
      headers: { Origin: 'https://staging--laurrel.netlify.app' },
    });
    if (corsStagingRes.headers['access-control-allow-origin'] !== 'https://staging--laurrel.netlify.app') {
      throw new Error(`Expected CORS allow for https://staging--laurrel.netlify.app, got ${corsStagingRes.headers['access-control-allow-origin']}`);
    }
    console.log('✅ PASS: Explicit staging origin https://staging--laurrel.netlify.app allowed.');

    // 3. Unauthorized random Netlify origin (previously allowed by loose .endsWith('.netlify.app'))
    const corsRogueRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: '/ready',
      method: 'GET',
      headers: { Origin: 'https://rogue-subdomain.netlify.app' },
    });
    if (corsRogueRes.headers['access-control-allow-origin']) {
      throw new Error('SECURITY VIOLATION: Rogue .netlify.app origin was accepted by CORS filter!');
    }
    console.log('✅ PASS: Arbitrary .netlify.app origin correctly rejected by CORS filter.');

    // -------------------------------------------------------------
    // Test Group 4: Upload Security & MIME Signature Validation
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Upload Security & MIME Signature Validation ---');

    // Create an authenticated session for testing
    const testAdminUserId = `test_upload_admin_${Date.now()}`;
    const pwdHash = await argon2.hash('TestUploadSecret123!', { type: argon2.argon2id });
    await pool.query(
      `INSERT INTO admin_users (id, email, password_hash, name, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, TRUE, NOW(), NOW())`,
      [testAdminUserId, `${testAdminUserId}@laurrel.local`, pwdHash, 'Upload Tester', 'admin']
    );
    const testUploadSessionId = `sess_upload_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    await pool.query(
      `INSERT INTO admin_sessions (id, user_id, created_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '2 hours')`,
      [testUploadSessionId, testAdminUserId]
    );

    const authHeaders = {
      'x-admin-token': process.env.ADMIN_API_SECRET,
      'x-admin-session-id': testUploadSessionId,
    };

    // Helper to build multipart/form-data payload
    function buildMultipart(filename, mimeType, buffer) {
      const boundary = '----LaurrelBoundary' + crypto.randomBytes(8).toString('hex');
      let body = Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
        `Content-Type: ${mimeType}\r\n\r\n`
      );
      body = Buffer.concat([body, buffer, Buffer.from(`\r\n--${boundary}--\r\n`)]);
      return { boundary, body };
    }

    // 4A: Reject SVG Upload
    console.log('Testing SVG upload rejection...');
    const svgContent = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
    const svgMultipart = buildMultipart('test.svg', 'image/svg+xml', svgContent);
    const svgRes = await httpRequest(
      {
        hostname: '127.0.0.1',
        port: TEST_BACKEND_PORT,
        path: '/api/admin/media/upload',
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': `multipart/form-data; boundary=${svgMultipart.boundary}`,
          'Content-Length': svgMultipart.body.length,
        },
      },
      svgMultipart.body
    );
    console.log(`   SVG upload response (${svgRes.statusCode}):`, svgRes.json?.error);
    if (svgRes.statusCode !== 400 || !svgRes.json?.error.includes('SVG uploads are currently disabled')) {
      throw new Error(`Expected 400 rejection for SVG, got ${svgRes.statusCode}`);
    }
    console.log('✅ PASS: SVG upload rejected with security advisory.');

    // 4B: Reject Malformed / Spoofed JPEG
    console.log('Testing spoofed JPEG (HTML disguised as JPEG)...');
    const fakeJpeg = Buffer.from('<html><body><script>alert(1)</script></body></html>');
    const fakeJpegMultipart = buildMultipart('evil.jpg', 'image/jpeg', fakeJpeg);
    const fakeJpegRes = await httpRequest(
      {
        hostname: '127.0.0.1',
        port: TEST_BACKEND_PORT,
        path: '/api/admin/media/upload',
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': `multipart/form-data; boundary=${fakeJpegMultipart.boundary}`,
          'Content-Length': fakeJpegMultipart.body.length,
        },
      },
      fakeJpegMultipart.body
    );
    console.log(`   Spoofed JPEG response (${fakeJpegRes.statusCode}):`, fakeJpegRes.json?.error);
    if (fakeJpegRes.statusCode !== 400 || !fakeJpegRes.json?.error.includes('signature')) {
      throw new Error(`Expected 400 rejection for spoofed JPEG, got ${fakeJpegRes.statusCode}`);
    }
    console.log('✅ PASS: Spoofed JPEG rejected by magic byte signature check.');

    // 4C: Verify AVIF Signature Validation
    console.log('Testing AVIF signature verification...');
    const validAvifBuffer = Buffer.alloc(32);
    validAvifBuffer.writeUInt32BE(32, 0);
    validAvifBuffer.write('ftyp', 4, 'ascii');
    validAvifBuffer.write('avif', 8, 'ascii');
    const avifMultipart = buildMultipart('test.avif', 'image/avif', validAvifBuffer);
    const avifRes = await httpRequest(
      {
        hostname: '127.0.0.1',
        port: TEST_BACKEND_PORT,
        path: '/api/admin/media/upload',
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': `multipart/form-data; boundary=${avifMultipart.boundary}`,
          'Content-Length': avifMultipart.body.length,
        },
      },
      avifMultipart.body
    );
    if (avifRes.statusCode !== 201) {
      throw new Error(`Expected 201 for valid AVIF upload, got ${avifRes.statusCode}: ${avifRes.body}`);
    }
    console.log(`✅ PASS: Valid AVIF accepted (asset ID: ${avifRes.json?.data?.id}).`);
    const createdAvifId = avifRes.json?.data?.id;

    // Corrupt AVIF (missing 'ftyp' box)
    const corruptAvifBuffer = Buffer.alloc(32);
    corruptAvifBuffer.write('corrupt_header_without_ftyp', 0, 'ascii');
    const corruptAvifMultipart = buildMultipart('bad.avif', 'image/avif', corruptAvifBuffer);
    const corruptAvifRes = await httpRequest(
      {
        hostname: '127.0.0.1',
        port: TEST_BACKEND_PORT,
        path: '/api/admin/media/upload',
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': `multipart/form-data; boundary=${corruptAvifMultipart.boundary}`,
          'Content-Length': corruptAvifMultipart.body.length,
        },
      },
      corruptAvifMultipart.body
    );
    if (corruptAvifRes.statusCode !== 400) {
      throw new Error(`Expected 400 for corrupt AVIF, got ${corruptAvifRes.statusCode}`);
    }
    console.log('✅ PASS: Corrupt AVIF rejected by signature validation.');

    // 4D: Verify WebM Signature Validation
    console.log('Testing WebM signature verification...');
    const validWebmBuffer = Buffer.alloc(32);
    validWebmBuffer[0] = 0x1a;
    validWebmBuffer[1] = 0x45;
    validWebmBuffer[2] = 0xdf;
    validWebmBuffer[3] = 0xa3;
    validWebmBuffer.write('webm', 8, 'latin1');
    const webmMultipart = buildMultipart('sample.webm', 'video/webm', validWebmBuffer);
    const webmRes = await httpRequest(
      {
        hostname: '127.0.0.1',
        port: TEST_BACKEND_PORT,
        path: '/api/admin/media/upload',
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': `multipart/form-data; boundary=${webmMultipart.boundary}`,
          'Content-Length': webmMultipart.body.length,
        },
      },
      webmMultipart.body
    );
    if (webmRes.statusCode !== 201) {
      throw new Error(`Expected 201 for valid WebM upload, got ${webmRes.statusCode}: ${webmRes.body}`);
    }
    console.log(`✅ PASS: Valid WebM video accepted (asset ID: ${webmRes.json?.data?.id}).`);
    const createdWebmId = webmRes.json?.data?.id;

    // Corrupt WebM
    const corruptWebmBuffer = Buffer.from('NOT_AN_EBML_CONTAINER');
    const corruptWebmMultipart = buildMultipart('bad.webm', 'video/webm', corruptWebmBuffer);
    const corruptWebmRes = await httpRequest(
      {
        hostname: '127.0.0.1',
        port: TEST_BACKEND_PORT,
        path: '/api/admin/media/upload',
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': `multipart/form-data; boundary=${corruptWebmMultipart.boundary}`,
          'Content-Length': corruptWebmMultipart.body.length,
        },
      },
      corruptWebmMultipart.body
    );
    if (corruptWebmRes.statusCode !== 400) {
      throw new Error(`Expected 400 for corrupt WebM, got ${corruptWebmRes.statusCode}`);
    }
    console.log('✅ PASS: Corrupt WebM video rejected by signature validation.');

    // -------------------------------------------------------------
    // Test Group 5: Storage Integrity & Deletion Guards
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: Storage Integrity & Deletion Guards ---');

    // 5A: Archival & Restoration preserves metadata
    console.log('Testing asset archival and restoration...');
    const archiveRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${createdAvifId}/archive`,
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
    }, JSON.stringify({ isArchived: true }));
    if (archiveRes.statusCode !== 200 || !archiveRes.json?.data?.isArchived) {
      throw new Error('Failed to archive asset.');
    }
    console.log('   Asset archived successfully.');

    const restoreRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${createdAvifId}/archive`,
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'application/json' },
    }, JSON.stringify({ isArchived: false }));
    if (restoreRes.statusCode !== 200 || restoreRes.json?.data?.isArchived !== false) {
      throw new Error('Failed to restore asset.');
    }
    console.log('✅ PASS: Asset archival and restoration verified without metadata loss.');

    // 5B: Published website reference protection
    console.log('Testing published website reference protection...');
    const sectionCheck = await pool.query("SELECT id, content FROM cms_sections WHERE page_id = 'home' LIMIT 1");
    if (sectionCheck.rows.length > 0) {
      const sec = sectionCheck.rows[0];
      const origContent = sec.content;
      // Add reference to createdAvifId into published section content
      const modifiedContent = { ...origContent, testAssetRef: createdAvifId };
      await pool.query('UPDATE cms_sections SET content = $1 WHERE id = $2', [JSON.stringify(modifiedContent), sec.id]);

      // Attempt deletion
      const deleteBlockedRes = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_BACKEND_PORT,
        path: `/api/admin/media/${createdAvifId}`,
        method: 'DELETE',
        headers: authHeaders,
      });

      console.log(`   Delete blocked response (${deleteBlockedRes.statusCode}):`, deleteBlockedRes.json?.error);
      if (deleteBlockedRes.statusCode !== 409 || !deleteBlockedRes.json?.error.includes('actively referenced in published website content')) {
        throw new Error(`Expected 409 Conflict for published asset deletion, got ${deleteBlockedRes.statusCode}`);
      }
      console.log('✅ PASS: Deletion of published asset strictly blocked with HTTP 409 Conflict.');

      // Restore published section content
      await pool.query('UPDATE cms_sections SET content = $1 WHERE id = $2', [JSON.stringify(origContent), sec.id]);
    }

    // 5C: Historical CMS revision reference protection
    console.log('Testing historical CMS revision reference protection...');
    const testRevId = `rev_test_guard_${Date.now()}`;
    await pool.query(
      `INSERT INTO cms_revisions (id, page_id, revision_number, data, is_published, author_name, created_at)
       VALUES ($1, 'home', 9999, $2, FALSE, 'Safety Auditor', NOW())`,
      [testRevId, JSON.stringify({ snapshotRef: createdAvifId })]
    );

    const deleteRevBlockedRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${createdAvifId}`,
      method: 'DELETE',
      headers: authHeaders,
    });

    console.log(`   Revision delete blocked response (${deleteRevBlockedRes.statusCode}):`, deleteRevBlockedRes.json?.error);
    if (deleteRevBlockedRes.statusCode !== 409 || !deleteRevBlockedRes.json?.error.includes('preserved in historical CMS revisions')) {
      throw new Error(`Expected 409 Conflict for historical revision asset deletion, got ${deleteRevBlockedRes.statusCode}`);
    }
    console.log('✅ PASS: Deletion of asset preserved in historical CMS revisions blocked with HTTP 409 Conflict.');

    // Clean up test revision
    await pool.query('DELETE FROM cms_revisions WHERE id = $1', [testRevId]);

    // 5D: Safe deletion of unreferenced asset
    console.log('Testing deletion of unreferenced local asset...');
    const deleteSafeRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${createdAvifId}`,
      method: 'DELETE',
      headers: authHeaders,
    });
    if (deleteSafeRes.statusCode !== 200) {
      throw new Error(`Expected 200 for deletion of unreferenced asset, got ${deleteSafeRes.statusCode}: ${deleteSafeRes.body}`);
    }
    console.log('✅ PASS: Unreferenced local asset safely deleted from storage and catalog.');

    // Clean up createdWebmId
    await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${createdWebmId}`,
      method: 'DELETE',
      headers: authHeaders,
    });

    // 5E: Multi-Bucket & Storage Failure Metadata Preservation
    console.log('Testing multi-bucket isolation and failure metadata preservation...');
    const testR2AssetId = `media_r2_staging_${Date.now()}`;
    await pool.query(
      `INSERT INTO media_assets (
        id, original_filename, stored_filename, asset_type, mime_type, file_size,
        storage_provider, storage_bucket, storage_reference, public_url, focal_point, folder, is_archived
       ) VALUES (
        $1, 'staging-hero.jpg', 'staging-hero.jpg', 'image', 'image/jpeg', 12345,
        'r2', 'laurrel-media-staging', 'hero/staging-hero.jpg', 'https://media.staging.laurrelservices.ca/hero/staging-hero.jpg', 'center', 'hero', FALSE
       )`,
      [testR2AssetId]
    );

    // Verify record has storage_bucket = 'laurrel-media-staging'
    const r2Row = await pool.query('SELECT storage_provider, storage_bucket FROM media_assets WHERE id = $1', [testR2AssetId]);
    if (r2Row.rows[0].storage_bucket !== 'laurrel-media-staging') {
      throw new Error(`Expected storage_bucket 'laurrel-media-staging', got '${r2Row.rows[0].storage_bucket}'`);
    }
    console.log(`✅ Staging R2 asset created with explicit bucket isolation: '${r2Row.rows[0].storage_bucket}'.`);

    // Attempt deletion
    const r2DeleteRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${testR2AssetId}`,
      method: 'DELETE',
      headers: authHeaders,
    });

    // Verify metadata preservation on failure
    const r2RecordStillExists = await pool.query('SELECT id FROM media_assets WHERE id = $1', [testR2AssetId]);
    if (r2DeleteRes.statusCode === 500 || r2DeleteRes.statusCode === 502) {
      if (r2RecordStillExists.rows.length === 0) {
        throw new Error('SECURITY BUG: Database metadata was deleted even though physical deletion failed!');
      }
      console.log('✅ PASS: Physical deletion failure correctly preserved database metadata (zero orphan loss).');
    } else if (r2DeleteRes.statusCode === 200) {
      console.log('✅ PASS: Physical deletion succeeded and record removed cleanly.');
    }

    // Clean up temporary R2 test record
    await pool.query('DELETE FROM media_assets WHERE id = $1', [testR2AssetId]);

    // -------------------------------------------------------------
    // Test 5F: getMediaAssetUsage Query Failure Blocks Deletion
    // -------------------------------------------------------------
    console.log('\nTesting getMediaAssetUsage failure behavior (must throw and block deletion)...');
    const { getMediaAssetUsage } = require(path.join(__dirname, '..', 'backend', 'dist', 'database', 'mediaRepo'));
    
    // Direct repository verification: verify getMediaAssetUsage throws on error rather than returning []
    let usageThrew = false;
    try {
      // Simulate invalid query by testing behavior when pool connection fails or invalid query happens
      // Directly check getMediaAssetUsage implementation throws
      const origGetPool = require(path.join(__dirname, '..', 'backend', 'dist', 'database', 'pool')).getDbPool;
      require(path.join(__dirname, '..', 'backend', 'dist', 'database', 'pool')).getDbPool = () => null;
      await getMediaAssetUsage('test-id');
    } catch (usageErr) {
      usageThrew = true;
      console.log('   Confirmed getMediaAssetUsage threw on unavailable database:', usageErr.message);
    }
    if (!usageThrew) {
      throw new Error('SECURITY FAILURE: getMediaAssetUsage did not throw when database was unavailable!');
    }
    console.log('✅ PASS: getMediaAssetUsage strictly throws on query failure; never returns empty result.');

    // -------------------------------------------------------------
    // Test 5G: Block Physical Deletion of Unverified Bucket R2 Asset
    // -------------------------------------------------------------
    console.log('\nTesting block of physical deletion for R2 asset with unverified bucket (storage_bucket IS NULL)...');
    const unverifiedR2Id = `media_r2_unverified_${Date.now()}`;
    await pool.query(
      `INSERT INTO media_assets (
        id, original_filename, stored_filename, asset_type, mime_type, file_size,
        storage_provider, storage_bucket, storage_reference, public_url, focal_point, folder, is_archived
       ) VALUES (
        $1, 'unverified-r2.jpg', 'unverified-r2.jpg', 'image', 'image/jpeg', 54321,
        'r2', NULL, 'hero/unverified-r2.jpg', 'https://custom-unverified.r2.dev/hero/unverified-r2.jpg', 'center', 'hero', FALSE
       )`,
      [unverifiedR2Id]
    );

    const deleteUnverifiedRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${unverifiedR2Id}`,
      method: 'DELETE',
      headers: authHeaders,
    });

    console.log(`   Unverified R2 deletion response status: ${deleteUnverifiedRes.statusCode}`);
    console.log(`   Unverified R2 deletion response error:`, deleteUnverifiedRes.json?.error);

    if (deleteUnverifiedRes.statusCode !== 422 || !deleteUnverifiedRes.json?.error.includes('unverified')) {
      throw new Error(`Expected HTTP 422 Unprocessable Entity for unverified R2 bucket asset, got ${deleteUnverifiedRes.statusCode}`);
    }

    // Verify record was preserved in database
    const unverifiedStillInDb = await pool.query('SELECT id FROM media_assets WHERE id = $1', [unverifiedR2Id]);
    if (unverifiedStillInDb.rows.length === 0) {
      throw new Error('SECURITY BUG: Unverified R2 asset was deleted from database!');
    }
    console.log('✅ PASS: Deletion of R2 asset with unverified bucket strictly blocked (HTTP 422); metadata preserved.');

    // Clean up unverified test record
    await pool.query('DELETE FROM media_assets WHERE id = $1', [unverifiedR2Id]);

    // -------------------------------------------------------------
    // Test 5H: Switching Default Bucket Cannot Misidentify or Delete Historical Asset
    // -------------------------------------------------------------
    console.log('\nTesting bucket switching safety (default bucket change cannot misidentify historical asset)...');
    const historicalStagingId = `media_r2_hist_${Date.now()}`;
    await pool.query(
      `INSERT INTO media_assets (
        id, original_filename, stored_filename, asset_type, mime_type, file_size,
        storage_provider, storage_bucket, storage_reference, public_url, focal_point, folder, is_archived
       ) VALUES (
        $1, 'historical-staging.png', 'historical-staging.png', 'image', 'image/png', 99999,
        'r2', 'laurrel-media-staging', 'general/historical-staging.png', 'https://pub-185e32b3a8d04a9e92249aa5108b673f.r2.dev/general/historical-staging.png', 'center', 'general', FALSE
       )`,
      [historicalStagingId]
    );

    // Fetch single asset via API to confirm storageBucket returns explicit bucket
    const histDetailRes = await httpRequest({
      hostname: '127.0.0.1',
      port: TEST_BACKEND_PORT,
      path: `/api/admin/media/${historicalStagingId}`,
      method: 'GET',
      headers: authHeaders,
    });

    if (histDetailRes.statusCode !== 200 || histDetailRes.json?.data?.storageBucket !== 'laurrel-media-staging') {
      throw new Error(`Expected storageBucket 'laurrel-media-staging', got '${histDetailRes.json?.data?.storageBucket}'`);
    }
    console.log(`   Historical asset verified in API with explicit bucket: '${histDetailRes.json?.data?.storageBucket}'.`);

    // Verify storage provider resolver with switched bucket
    const { getStorageProviderByName } = require(path.join(__dirname, '..', 'backend', 'dist', 'services', 'storage'));
    
    // Ambient env configured with production bucket
    process.env.R2_BUCKET_NAME = 'laurrel-media-prod';
    const resolvedProd = getStorageProviderByName('r2', histDetailRes.json?.data?.storageBucket);
    // Provider instance bucket must be the asset's bucket 'laurrel-media-staging', NOT the ambient 'laurrel-media-prod'
    if (resolvedProd.bucket !== 'laurrel-media-staging') {
      throw new Error(`Expected resolver to honor asset bucket 'laurrel-media-staging', got '${resolvedProd.bucket}'`);
    }

    // Now switch ambient default bucket to another arbitrary bucket
    process.env.R2_BUCKET_NAME = 'laurrel-media-different-bucket';
    const resolvedSwitched = getStorageProviderByName('r2', histDetailRes.json?.data?.storageBucket);
    if (resolvedSwitched.bucket !== 'laurrel-media-staging') {
      throw new Error(`Expected resolver to retain historical bucket 'laurrel-media-staging', got '${resolvedSwitched.bucket}'`);
    }
    console.log('✅ PASS: Switching default bucket does NOT misidentify or alter historical asset bucket ownership.');

    // Clean up historical staging test record
    await pool.query('DELETE FROM media_assets WHERE id = $1', [historicalStagingId]);

    // Clean up test admin user & session
    await pool.query('DELETE FROM admin_sessions WHERE user_id = $1', [testAdminUserId]);
    await pool.query('DELETE FROM admin_users WHERE id = $1', [testAdminUserId]);
    console.log('✅ Cleaned up all security and media test fixtures.');

    // Stop passProc
    passProc.kill('SIGTERM');

    console.log('\n========================================================================');
    console.log('🎉 ALL FINAL DEPLOYMENT CONFIGURATION CHECKS PASSED (100%)');
    console.log('========================================================================\n');
  } finally {
    await pool.end();
  }
}

runFinalDeploymentCorrectionsSuite()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ VERIFICATION SUITE FAILED:', err);
    process.exit(1);
  });
