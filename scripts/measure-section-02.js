const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('https://solshine.framer.website/about-us', { waitUntil: 'networkidle2' });

  const metrics = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    
    // Eyebrow
    const eyebrowEl = all.find(el => el.innerText && el.innerText.trim() === 'ABOUT OUR COMPANY' && el.getBoundingClientRect().top < 1000);
    const eyebrowStyle = eyebrowEl ? window.getComputedStyle(eyebrowEl) : null;
    const eyebrowRect = eyebrowEl ? eyebrowEl.getBoundingClientRect() : null;

    // Heading
    const headingEl = all.find(el => el.innerText && el.innerText.includes('Innovations in green technology'));
    const headingStyle = headingEl ? window.getComputedStyle(headingEl) : null;
    const headingRect = headingEl ? headingEl.getBoundingClientRect() : null;

    // Paragraph
    const pEl = all.find(el => el.innerText && el.innerText.includes('sustainable energy solutions') && el.tagName === 'P');
    const pStyle = pEl ? window.getComputedStyle(pEl) : null;
    const pRect = pEl ? pEl.getBoundingClientRect() : null;

    // Section container
    let container = eyebrowEl;
    while (container && container.parentElement && container.getBoundingClientRect().width < 1200) {
      container = container.parentElement;
    }
    const containerStyle = container ? window.getComputedStyle(container) : null;
    const containerRect = container ? container.getBoundingClientRect() : null;

    // Section root
    let section = container;
    while (section && section.parentElement && section.tagName !== 'SECTION' && section.parentElement.tagName !== 'MAIN') {
      section = section.parentElement;
    }
    const secStyle = section ? window.getComputedStyle(section) : null;
    const secRect = section ? section.getBoundingClientRect() : null;

    // Image in section
    const img = section ? section.querySelector('img') : null;
    const imgStyle = img ? window.getComputedStyle(img) : null;
    const imgRect = img ? img.getBoundingClientRect() : null;
    const imgParent = img ? img.parentElement : null;
    const imgParentStyle = imgParent ? window.getComputedStyle(imgParent) : null;
    const imgParentRect = imgParent ? imgParent.getBoundingClientRect() : null;

    // Feature items
    const feature1 = all.find(el => el.innerText && el.innerText.includes('Protects sensitive data') && el.children.length === 0);
    const f1Style = feature1 ? window.getComputedStyle(feature1) : null;
    const f1Parent = feature1 ? feature1.parentElement : null;
    const f1ParentStyle = f1Parent ? window.getComputedStyle(f1Parent) : null;
    const f1GrandParent = f1Parent ? f1Parent.parentElement : null;
    const f1GrandParentStyle = f1GrandParent ? window.getComputedStyle(f1GrandParent) : null;
    const f1Icon = f1GrandParent ? f1GrandParent.querySelector('svg') : null;

    // CTA button
    const btn = all.find(el => el.innerText && el.innerText.includes('View all services') && (el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'button'));
    const btnStyle = btn ? window.getComputedStyle(btn) : null;
    const btnRect = btn ? btn.getBoundingClientRect() : null;

    const btnStructure = btn ? Array.from(btn.querySelectorAll('*')).map(c => ({
      tag: c.tagName,
      className: c.className,
      rect: {
        width: Math.round(c.getBoundingClientRect().width),
        height: Math.round(c.getBoundingClientRect().height),
      },
      style: {
        display: window.getComputedStyle(c).display,
        backgroundColor: window.getComputedStyle(c).backgroundColor,
        borderRadius: window.getComputedStyle(c).borderRadius,
        color: window.getComputedStyle(c).color,
        padding: window.getComputedStyle(c).padding,
      },
      text: c.innerText ? c.innerText.trim() : null,
      html: c.outerHTML.slice(0, 200)
    })) : [];

    return {
      section: {
        top: secRect ? Math.round(secRect.top + window.scrollY) : null,
        width: secRect ? Math.round(secRect.width) : null,
        height: secRect ? Math.round(secRect.height) : null,
        padding: secStyle ? secStyle.padding : null,
        backgroundColor: secStyle ? secStyle.backgroundColor : null,
      },
      container: {
        width: containerRect ? Math.round(containerRect.width) : null,
        height: containerRect ? Math.round(containerRect.height) : null,
        maxWidth: containerStyle ? containerStyle.maxWidth : null,
        padding: containerStyle ? containerStyle.padding : null,
        display: containerStyle ? containerStyle.display : null,
        gap: containerStyle ? containerStyle.gap : null,
      },
      image: {
        src: img ? img.src : null,
        width: imgRect ? Math.round(imgRect.width) : null,
        height: imgRect ? Math.round(imgRect.height) : null,
        borderRadius: imgStyle ? imgStyle.borderRadius : null,
        parentWidth: imgParentRect ? Math.round(imgParentRect.width) : null,
        parentHeight: imgParentRect ? Math.round(imgParentRect.height) : null,
        parentRadius: imgParentStyle ? imgParentStyle.borderRadius : null,
      },
      eyebrow: {
        text: eyebrowEl ? eyebrowEl.innerText.trim() : null,
        fontSize: eyebrowStyle ? eyebrowStyle.fontSize : null,
        fontWeight: eyebrowStyle ? eyebrowStyle.fontWeight : null,
        fontFamily: eyebrowStyle ? eyebrowStyle.fontFamily : null,
        lineHeight: eyebrowStyle ? eyebrowStyle.lineHeight : null,
        letterSpacing: eyebrowStyle ? eyebrowStyle.letterSpacing : null,
        color: eyebrowStyle ? eyebrowStyle.color : null,
        html: eyebrowEl ? eyebrowEl.outerHTML : null,
      },
      heading: {
        text: headingEl ? headingEl.innerText.trim() : null,
        fontSize: headingStyle ? headingStyle.fontSize : null,
        fontWeight: headingStyle ? headingStyle.fontWeight : null,
        fontFamily: headingStyle ? headingStyle.fontFamily : null,
        lineHeight: headingStyle ? headingStyle.lineHeight : null,
        letterSpacing: headingStyle ? headingStyle.letterSpacing : null,
        color: headingStyle ? headingStyle.color : null,
        width: headingRect ? Math.round(headingRect.width) : null,
        height: headingRect ? Math.round(headingRect.height) : null,
      },
      paragraph: {
        fontSize: pStyle ? pStyle.fontSize : null,
        lineHeight: pStyle ? pStyle.lineHeight : null,
        color: pStyle ? pStyle.color : null,
        width: pRect ? Math.round(pRect.width) : null,
      },
      feature: {
        fontSize: f1Style ? f1Style.fontSize : null,
        fontWeight: f1Style ? f1Style.fontWeight : null,
        fontFamily: f1Style ? f1Style.fontFamily : null,
        color: f1Style ? f1Style.color : null,
        iconSvg: f1Icon ? f1Icon.outerHTML : null,
        grandParentDisplay: f1GrandParentStyle ? f1GrandParentStyle.display : null,
        grandParentGap: f1GrandParentStyle ? f1GrandParentStyle.gap : null,
      },
      button: {
        text: btn ? btn.innerText.trim() : null,
        width: btnRect ? Math.round(btnRect.width) : null,
        height: btnRect ? Math.round(btnRect.height) : null,
        padding: btnStyle ? btnStyle.padding : null,
        backgroundColor: btnStyle ? btnStyle.backgroundColor : null,
        borderRadius: btnStyle ? btnStyle.borderRadius : null,
        fontSize: btnStyle ? btnStyle.fontSize : null,
        fontWeight: btnStyle ? btnStyle.fontWeight : null,
        fontFamily: btnStyle ? btnStyle.fontFamily : null,
        color: btnStyle ? btnStyle.color : null,
        children: btnStructure,
      }
    };
  });

  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
})();
