const puppeteer = require('puppeteer');

async function inspectSliderSection() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/', { waitUntil: 'networkidle2' });

  const data = await page.evaluate(() => {
    // Look for the section with heading 'Customized solar energy systems'
    const allSections = Array.from(document.querySelectorAll('section'));
    const sliderSec = allSections.find(s => s.innerText.includes('Customized solar energy systems'));
    
    // Also look for the FAQ section on home
    const faqSec = allSections.find(s => s.innerText.includes('HAVE ANY QUESTIONS?') || s.innerText.includes('Have any questions?'));

    // Also look for CTA banner
    const ctaSec = allSections.find(s => s.innerText.includes('Ready to get started') || s.innerText.includes('Innovations in green') || s.innerText.includes('Get in touch'));

    function extractSec(s) {
      if (!s) return null;
      const style = window.getComputedStyle(s);
      const h2 = s.querySelector('h1, h2, h3');
      const p = s.querySelector('p');
      const btns = Array.from(s.querySelectorAll('button, a')).map(b => ({
        tag: b.tagName,
        text: b.innerText,
        className: b.className
      }));

      // Find image cards
      const images = Array.from(s.querySelectorAll('img')).map(img => {
        const parent = img.parentElement;
        return {
          src: img.src,
          alt: img.alt,
          w: img.offsetWidth,
          h: img.offsetHeight,
        };
      });

      return {
        tag: s.tagName,
        className: s.className,
        bg: style.backgroundColor,
        padding: style.padding,
        heading: h2 ? h2.innerText : null,
        p: p ? p.innerText : null,
        text: s.innerText.slice(0, 300).replace(/\n/g, ' -- '),
        btns,
        imagesCount: images.length,
        images: images.slice(0, 4)
      };
    }

    return {
      slider: extractSec(sliderSec),
      faq: extractSec(faqSec),
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

inspectSliderSection().catch(console.error);
