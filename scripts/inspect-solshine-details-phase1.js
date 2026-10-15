const puppeteer = require('puppeteer');

async function inspectDetails() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Inspect Header & Services Dropdown on Homepage
  console.log('--- Inspecting Solshine Header & Services Dropdown ---');
  await page.goto('https://solshine.framer.website/', { waitUntil: 'networkidle2' });

  const navInfo = await page.evaluate(() => {
    // Find nav container
    const nav = document.querySelector('nav') || document.querySelector('header');
    const links = Array.from(document.querySelectorAll('nav a, header a')).map(a => ({
      text: a.innerText.trim(),
      href: a.getAttribute('href')
    }));

    // Find services item
    const servicesTrigger = Array.from(document.querySelectorAll('nav div, nav a, header div, header a')).find(el => el.innerText && el.innerText.trim().startsWith('Services'));

    return {
      headerTag: nav ? nav.tagName : null,
      links,
      servicesTriggerText: servicesTrigger ? servicesTrigger.innerText : null
    };
  });
  console.log('Nav Info:', JSON.stringify(navInfo, null, 2));

  // Trigger hover or click on Services dropdown
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === 'Services');
    if (el) {
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      el.click();
    }
  });
  await new Promise(r => setTimeout(r, 600));

  const dropdownInfo = await page.evaluate(() => {
    // Look for dropdown elements that appeared
    const possibleMenus = Array.from(document.querySelectorAll('[role="menu"], [data-framer-name*="Dropdown"], [class*="dropdown"], [class*="menu"]')).map(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className.slice(0, 50),
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        bg: style.backgroundColor,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        text: el.innerText.replace(/\n/g, ' | ')
      };
    }).filter(m => m.width > 50 && m.height > 40 && m.top < 300);

    return possibleMenus;
  });
  console.log('Dropdown Info:', JSON.stringify(dropdownInfo, null, 2));

  // 2. Inspect Featured Image + Lime Panel on Homepage
  console.log('--- Inspecting Featured Image + Lime Panel on Homepage ---');
  const featureSectionInfo = await page.evaluate(() => {
    // Look for section with "Wind turbine repair" or similar
    const limeEl = Array.from(document.querySelectorAll('*')).find(el => {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      // rgb(200, 232, 11) or limeish rgb(215..245, 230..255, ...)
      return bg.includes('200') || bg.includes('217') || bg.includes('232') || (el.innerText && el.innerText.includes('Wind turbine'));
    });

    if (!limeEl) return null;

    // Find the enclosing feature container / section
    const section = limeEl.closest('section') || limeEl.closest('[data-framer-name]') || limeEl.parentElement.parentElement;
    const sRect = section.getBoundingClientRect();

    // Find the photograph next to it
    const imgEl = section.querySelector('img') || section.parentElement.querySelector('img');
    const imgRect = imgEl ? imgEl.getBoundingClientRect() : null;
    const limeRect = limeEl.getBoundingClientRect();
    const limeStyle = window.getComputedStyle(limeEl);

    return {
      sectionWidth: sRect.width,
      imgWidth: imgRect ? imgRect.width : null,
      imgHeight: imgRect ? imgRect.height : null,
      limeWidth: limeRect.width,
      limeHeight: limeRect.height,
      limeBg: limeStyle.backgroundColor,
      limeBorderRadius: limeStyle.borderRadius,
      gap: imgRect ? (limeRect.left - imgRect.right) : null,
      photoRatio: imgRect ? (imgRect.width / (imgRect.width + limeRect.width)) : null
    };
  });
  console.log('Feature Section Info:', JSON.stringify(featureSectionInfo, null, 2));

  // 3. Inspect Contact Page Layout & Measurements
  console.log('--- Inspecting Solshine Contact Page ---');
  await page.goto('https://solshine.framer.website/contact-us', { waitUntil: 'networkidle2' });

  const contactMetrics = await page.evaluate(() => {
    // Find banner
    const h1 = document.querySelector('h1');
    const bannerContainer = h1 ? h1.closest('section') || h1.parentElement.parentElement : null;
    const bannerRect = bannerContainer ? bannerContainer.getBoundingClientRect() : null;

    // Find dark info panels
    const darkPanels = Array.from(document.querySelectorAll('*')).filter(el => {
      const s = window.getComputedStyle(el);
      const bg = s.backgroundColor;
      const isDark = bg.startsWith('rgb(0,') || bg.startsWith('rgb(1') || bg.startsWith('rgb(2') || bg.startsWith('rgb(3');
      const r = el.getBoundingClientRect();
      return isDark && r.width > 100 && r.height > 50 && r.height < 400 && el.innerText && (el.innerText.includes('@') || el.innerText.includes('Franklin') || el.innerText.includes('+1'));
    }).map(el => {
      const r = el.getBoundingClientRect();
      const s = window.getComputedStyle(el);
      return {
        text: el.innerText.replace(/\n/g, ' '),
        width: r.width,
        height: r.height,
        borderRadius: s.borderRadius,
        bg: s.backgroundColor,
        padding: s.padding
      };
    });

    // Form inputs
    const form = document.querySelector('form');
    const formRect = form ? form.getBoundingClientRect() : null;
    const input = document.querySelector('form input');
    const inputStyle = input ? window.getComputedStyle(input) : null;
    const submitBtn = document.querySelector('form button[type="submit"]') || Array.from(document.querySelectorAll('form button')).find(b => b.innerText.includes('Send'));
    const btnStyle = submitBtn ? window.getComputedStyle(submitBtn) : null;
    const btnRect = submitBtn ? submitBtn.getBoundingClientRect() : null;

    // Two column container
    const leftCol = darkPanels.length > 0 ? document.querySelector('h2, [class*="heading"]').closest('div') : null;
    const leftRect = leftCol ? leftCol.getBoundingClientRect() : null;

    return {
      bannerHeight: bannerRect ? bannerRect.height : null,
      darkPanels,
      formRect: formRect ? { width: formRect.width, height: formRect.height } : null,
      inputStyle: inputStyle ? {
        height: inputStyle.height,
        borderRadius: inputStyle.borderRadius,
        border: inputStyle.border,
        bg: inputStyle.backgroundColor,
        padding: inputStyle.padding
      } : null,
      btnStyle: btnStyle ? {
        width: btnRect ? btnRect.width : null,
        height: btnRect ? btnRect.height : null,
        borderRadius: btnStyle.borderRadius,
        bg: btnStyle.backgroundColor,
        color: btnStyle.color,
        padding: btnStyle.padding
      } : null
    };
  });
  console.log('Contact Metrics:', JSON.stringify(contactMetrics, null, 2));

  await browser.close();
}

inspectDetails().catch(console.error);
