const puppeteer = require('puppeteer');

async function inspectMobileWorker() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle2' });
  await page.evaluate(() => document.fonts.ready);
  
  const info = await page.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Why Laurrel Services"]');
    const img = sec.querySelector('img');
    const imgParent = img ? img.parentElement : null;
    const motionDiv = imgParent ? imgParent.parentElement : null;
    return {
      imgSrc: img ? img.currentSrc || img.src : null,
      imgComplete: img ? img.complete : null,
      naturalWidth: img ? img.naturalWidth : null,
      naturalHeight: img ? img.naturalHeight : null,
      imgComputed: img ? {
        opacity: window.getComputedStyle(img).opacity,
        display: window.getComputedStyle(img).display,
        visibility: window.getComputedStyle(img).visibility,
      } : null,
      motionDivStyle: motionDiv ? {
        opacity: window.getComputedStyle(motionDiv).opacity,
        transform: window.getComputedStyle(motionDiv).transform,
        display: window.getComputedStyle(motionDiv).display,
        visibility: window.getComputedStyle(motionDiv).visibility
      } : null,
      imgRect: img ? img.getBoundingClientRect() : null,
      motionRect: motionDiv ? motionDiv.getBoundingClientRect() : null
    };
  });
  console.log(JSON.stringify(info, null, 2));

  // Now scroll to image and check again
  await page.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Why Laurrel Services"]');
    const img = sec.querySelector('img');
    if (img) img.scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 600));

  const afterScroll = await page.evaluate(() => {
    const sec = document.querySelector('section[aria-label="Why Laurrel Services"]');
    const img = sec.querySelector('img');
    const imgParent = img ? img.parentElement : null;
    const motionDiv = imgParent ? imgParent.parentElement : null;
    return {
      motionOpacity: motionDiv ? window.getComputedStyle(motionDiv).opacity : null,
      motionTransform: motionDiv ? window.getComputedStyle(motionDiv).transform : null,
      imgComplete: img ? img.complete : null,
      naturalWidth: img ? img.naturalWidth : null,
      naturalHeight: img ? img.naturalHeight : null,
      imgRect: img ? img.getBoundingClientRect() : null
    };
  });

  console.log('After scrollIntoView:', JSON.stringify(afterScroll, null, 2));

  await browser.close();
}

inspectMobileWorker().catch(console.error);
