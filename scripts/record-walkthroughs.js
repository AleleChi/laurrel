const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function createWebmFromFrames(page, frames, width, height, fps = 10) {
  return await page.evaluate(async (frameDataUrls, w, h, frameRate) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(frameRate);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.start();

    // Helper to load image
    const loadImage = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });

    const frameInterval = 1000 / frameRate;

    for (const dataUrl of frameDataUrls) {
      const img = await loadImage(dataUrl);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      await new Promise(r => setTimeout(r, frameInterval));
    }

    // Wait a brief moment before stopping to capture trailing frames
    await new Promise(r => setTimeout(r, 200));
    recorder.stop();
    await new Promise(r => {
      recorder.onstop = r;
    });

    const blob = new Blob(chunks, { type: 'video/webm' });
    const buffer = await blob.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  }, frames, width, height, fps);
}

async function recordWalkthroughs() {
  const outputDir = path.join(__dirname, '..', 'docs', 'screenshots', 'about-motion');
  const artifactDir = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  // -------------------------------------------------------------
  // RECORDING A: Full Desktop Walkthrough (1440x900)
  // -------------------------------------------------------------
  console.log('--- Recording A: Full Desktop Walkthrough ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log('Page total height:', totalHeight);

    const frames = [];
    const scrollStep = 180;
    const maxScroll = totalHeight - 900;

    for (let y = 0; y <= maxScroll; y += scrollStep) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y);
      await new Promise(r => setTimeout(r, 180));
      const shot = await page.screenshot({ type: 'jpeg', quality: 75 });
      frames.push(`data:image/jpeg;base64,${shot.toString('base64')}`);
    }

    // Final scroll position
    await page.evaluate((top) => window.scrollTo(0, top), maxScroll);
    await new Promise(r => setTimeout(r, 400));
    const finalShot = await page.screenshot({ type: 'jpeg', quality: 75 });
    frames.push(`data:image/jpeg;base64,${finalShot.toString('base64')}`);

    console.log(`Encoding ${frames.length} frames into Recording A...`);
    const videoBytes = await createWebmFromFrames(page, frames, 1440, 900, 6);
    const outPath = path.join(outputDir, 'recording-a-desktop-walkthrough.webm');
    const artPath = path.join(artifactDir, 'recording-a-desktop-walkthrough.webm');
    fs.writeFileSync(outPath, Buffer.from(videoBytes));
    fs.writeFileSync(artPath, Buffer.from(videoBytes));
    console.log(`Saved Recording A (${Math.round(videoBytes.length / 1024)} KB).`);
    await page.close();
  }

  // -------------------------------------------------------------
  // RECORDING B: Why Laurrel to Dark Marquee (1440x900)
  // -------------------------------------------------------------
  console.log('--- Recording B: Why Laurrel to Dark Marquee ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);

    const whyTop = await page.evaluate(() => {
      const sec = document.querySelector('section[aria-label="Why Laurrel Services"]');
      return sec ? window.scrollY + sec.getBoundingClientRect().top : 2400;
    });

    // Start slightly above Why section
    await page.evaluate((top) => window.scrollTo(0, top - 300), whyTop);
    await new Promise(r => setTimeout(r, 500));

    const frames = [];
    // Scroll through Why section down to the marquee
    for (let offset = -300; offset <= 900; offset += 90) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), whyTop + offset);
      await new Promise(r => setTimeout(r, 200));
      const shot = await page.screenshot({ type: 'jpeg', quality: 75 });
      frames.push(`data:image/jpeg;base64,${shot.toString('base64')}`);
    }

    // Linger on Marquee to capture horizontal motion
    for (let t = 0; t < 10; t++) {
      await new Promise(r => setTimeout(r, 300));
      const shot = await page.screenshot({ type: 'jpeg', quality: 75 });
      frames.push(`data:image/jpeg;base64,${shot.toString('base64')}`);
    }

    console.log(`Encoding ${frames.length} frames into Recording B...`);
    const videoBytes = await createWebmFromFrames(page, frames, 1440, 900, 6);
    const outPath = path.join(outputDir, 'recording-b-why-to-marquee.webm');
    const artPath = path.join(artifactDir, 'recording-b-why-to-marquee.webm');
    fs.writeFileSync(outPath, Buffer.from(videoBytes));
    fs.writeFileSync(artPath, Buffer.from(videoBytes));
    console.log(`Saved Recording B (${Math.round(videoBytes.length / 1024)} KB).`);
    await page.close();
  }

  // -------------------------------------------------------------
  // RECORDING C: Mobile Walkthrough (390x844)
  // -------------------------------------------------------------
  console.log('--- Recording C: Mobile Walkthrough ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    const frames = [];
    const scrollStep = 180;
    const maxScroll = totalHeight - 844;

    for (let y = 0; y <= maxScroll; y += scrollStep) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y);
      await new Promise(r => setTimeout(r, 180));
      const shot = await page.screenshot({ type: 'jpeg', quality: 75 });
      frames.push(`data:image/jpeg;base64,${shot.toString('base64')}`);
    }

    // Toggle FAQ item on mobile
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-controls="faq-panel-1"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 400));
    const faqShot = await page.screenshot({ type: 'jpeg', quality: 75 });
    frames.push(`data:image/jpeg;base64,${faqShot.toString('base64')}`);

    console.log(`Encoding ${frames.length} frames into Recording C...`);
    const videoBytes = await createWebmFromFrames(page, frames, 390, 844, 6);
    const outPath = path.join(outputDir, 'recording-c-mobile-walkthrough.webm');
    const artPath = path.join(artifactDir, 'recording-c-mobile-walkthrough.webm');
    fs.writeFileSync(outPath, Buffer.from(videoBytes));
    fs.writeFileSync(artPath, Buffer.from(videoBytes));
    console.log(`Saved Recording C (${Math.round(videoBytes.length / 1024)} KB).`);
    await page.close();
  }

  // -------------------------------------------------------------
  // RECORDING D: Reduced Motion (1440x900)
  // -------------------------------------------------------------
  console.log('--- Recording D: Reduced Motion ---');
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    const frames = [];
    const scrollStep = 240;
    const maxScroll = totalHeight - 900;

    for (let y = 0; y <= maxScroll; y += scrollStep) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await new Promise(r => setTimeout(r, 120));
      const shot = await page.screenshot({ type: 'jpeg', quality: 75 });
      frames.push(`data:image/jpeg;base64,${shot.toString('base64')}`);
    }

    console.log(`Encoding ${frames.length} frames into Recording D...`);
    const videoBytes = await createWebmFromFrames(page, frames, 1440, 900, 6);
    const outPath = path.join(outputDir, 'recording-d-reduced-motion.webm');
    const artPath = path.join(artifactDir, 'recording-d-reduced-motion.webm');
    fs.writeFileSync(outPath, Buffer.from(videoBytes));
    fs.writeFileSync(artPath, Buffer.from(videoBytes));
    console.log(`Saved Recording D (${Math.round(videoBytes.length / 1024)} KB).`);
    await page.close();
  }

  await browser.close();
  console.log('All 4 recordings generated successfully.');
}

recordWalkthroughs().catch(console.error);
