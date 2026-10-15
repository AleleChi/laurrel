const puppeteer = require('puppeteer');
const fs = require('fs');

async function testWebmRecording() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600 });
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });

  // Record 2 seconds of smooth scrolling using MediaRecorder on canvas
  const videoBuffer = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.start();

    // Draw some frames while scrolling
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#390044' : '#C8E80B';
      ctx.fillRect(0, 0, 800, 600);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.fillText('Frame ' + i, 50, 50);
      await new Promise(r => setTimeout(r, 33));
    }

    recorder.stop();
    await new Promise(r => recorder.onstop = r);

    const blob = new Blob(chunks, { type: 'video/webm' });
    const buffer = await blob.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  });

  console.log('Video bytes generated:', videoBuffer.length);
  await browser.close();
}

testWebmRecording().catch(console.error);
