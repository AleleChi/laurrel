const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function createWebmFromFrames(page, frames, width, height, fps = 12) {
  return await page.evaluate(async (frameDataUrls, w, h, frameRate) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(frameRate);
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000,
    });

    const chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.start();

    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
      });

    const frameInterval = 1000 / frameRate;

    for (const dataUrl of frameDataUrls) {
      const img = await loadImage(dataUrl);
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      await new Promise((r) => setTimeout(r, frameInterval));
    }

    await new Promise((r) => setTimeout(r, 200));
    recorder.stop();
    await new Promise((r) => {
      recorder.onstop = r;
    });

    const blob = new Blob(chunks, { type: 'video/webm' });
    const buffer = await blob.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  }, frames, width, height, fps);
}

async function recordServicesMotion() {
  const outputDir = path.join(__dirname, '..', 'docs', 'screenshots', 'services-motion');
  const artifactDir = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\ae662322-3343-457e-82db-f6eb7bfa8b39';
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  const width = 1440;
  const height = 900;
  await page.setViewport({ width, height });

  console.log('Navigating to homepage...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Position viewport right before services section
  await page.evaluate(() => {
    const el = document.getElementById('services');
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, Math.max(0, top - 600));
    }
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log('Recording viewport entry and illustration motion...');
  const frames = [];

  // 1. Smooth scroll into the services section
  const totalScrollSteps = 15;
  for (let i = 0; i < totalScrollSteps; i++) {
    await page.evaluate(() => window.scrollBy(0, 40));
    const screenshot = await page.screenshot({ encoding: 'base64' });
    frames.push(`data:image/png;base64,${screenshot}`);
    await new Promise((r) => setTimeout(r, 60));
  }

  // 2. Capture animation sequence (eyebrow, headline, illustrations animating)
  const animSteps = 25;
  for (let i = 0; i < animSteps; i++) {
    const screenshot = await page.screenshot({ encoding: 'base64' });
    frames.push(`data:image/png;base64,${screenshot}`);
    await new Promise((r) => setTimeout(r, 80));
  }

  // 3. Hover over CTA button to demonstrate micro-interaction
  console.log('Recording CTA hover...');
  const cta = await page.$('a[href="/services"]');
  if (cta) {
    await cta.hover();
    for (let i = 0; i < 8; i++) {
      const screenshot = await page.screenshot({ encoding: 'base64' });
      frames.push(`data:image/png;base64,${screenshot}`);
      await new Promise((r) => setTimeout(r, 70));
    }
  }

  console.log(`Encoding ${frames.length} frames into WebM...`);
  const videoBytes = await createWebmFromFrames(page, frames, width, height, 12);

  const localVideoPath = path.join(outputDir, 'services_highlight_motion.webm');
  const artifactVideoPath = path.join(artifactDir, 'services_highlight_motion.webm');

  fs.writeFileSync(localVideoPath, Buffer.from(videoBytes));
  fs.writeFileSync(artifactVideoPath, Buffer.from(videoBytes));
  console.log('Saved WebM video recording to:', localVideoPath);

  await browser.close();
}

recordServicesMotion().catch(console.error);
