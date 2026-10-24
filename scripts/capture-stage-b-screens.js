const puppeteer = require('puppeteer');
const path = require('path');
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));

dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
}

const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

const ARTIFACT_DIR = 'C:\\Users\\alele\\.gemini\\antigravity\\brain\\d497e002-dfa4-4b96-ac78-93caf91a938e';

async function capture() {
  console.log('Starting Stage B screenshot capture...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const take = async (filename, viewport, fullPage = false) => {
    await page.setViewport(viewport);
    await new Promise((r) => setTimeout(r, 1200));
    const dest = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: dest, fullPage });
    console.log(`📸 Saved: ${filename}`);
    return dest;
  };

  try {
    // 1. Book Step 1: Service Selection Desktop & Mobile
    console.log('\nCapturing /book Step 1 (Service Selection)...');
    await page.goto('http://localhost:3000/book', { waitUntil: 'networkidle0' });
    await take('stage-b-01-book-step1-desktop.png', { width: 1440, height: 900 });
    await take('stage-b-01-book-step1-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // Transition to Step 2
    console.log('\nTransitioning to /book Step 2 (Format / Channel Selection)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await take('stage-b-02-book-step2-desktop.png', { width: 1440, height: 900 });

    // Transition to Step 3 (Date & Time Picker)
    console.log('\nTransitioning to /book Step 3 (Date & Ottawa Time Picker)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 2500)); // wait for availability API
    await take('stage-b-03-book-step3-desktop.png', { width: 1440, height: 900 });

    // Select first available slot and continue to Step 4
    console.log('\nSelecting time slot and transitioning to /book Step 4 (Client Details Form)...');
    await page.evaluate(() => {
      const slotBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('AM') || b.innerText.includes('PM'));
      if (slotBtns.length > 0) slotBtns[0].click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const nextBtn = btns.find(b => b.innerText.includes('Continue'));
      if (nextBtn) nextBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await take('stage-b-04-book-step4-desktop.png', { width: 1440, height: 900 });

    // Fill in client details and go to Step 5 (Review)
    console.log('\nFilling client details and capturing Step 5 (Review & Confirmation)...');
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const nameInput = inputs.find(i => i.placeholder?.includes('Full name') || i.type === 'text');
      const emailInput = inputs.find(i => i.type === 'email');
      const phoneInput = inputs.find(i => i.type === 'tel');
      const textarea = document.querySelector('textarea');

      if (nameInput) {
        nameInput.value = 'Éléonore Gagnon';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (emailInput) {
        emailInput.value = 'eleonore.gagnon@ottawa-heritage.ca';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (phoneInput) {
        phoneInput.value = '+1 (613) 555-0182';
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (textarea) {
        textarea.value = 'Heritage downtown residence preliminary estimate.';
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise((r) => setTimeout(r, 600));
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reviewBtn = btns.find(b => b.innerText.includes('Review Consultation') || b.innerText.includes('Continue'));
      if (reviewBtn) reviewBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await take('stage-b-04b-book-step5-review.png', { width: 1440, height: 900 });

    // 2. Customer Management Portal (/book/[token])
    console.log('\nSetting up demo consultation for Customer Management Portal...');
    const staffRes = await pool.query("SELECT id, name FROM admin_users LIMIT 1");
    const staff = staffRes.rows[0];
    const demoToken = `demo_tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const demoAptId = `apt_demo_${Date.now()}`;
    const nextWeekOttawa = new Date();
    nextWeekOttawa.setDate(nextWeekOttawa.getDate() + 3);
    nextWeekOttawa.setHours(14, 0, 0, 0); // 10:00 AM EDT (14:00 UTC)
    const endOttawa = new Date(nextWeekOttawa.getTime() + 30 * 60000);

    // Confirmed Telephone Consultation
    await pool.query(
      `
      INSERT INTO appointments (
        id, enquiry_id, title, purpose, appointment_type, status,
        scheduled_start, scheduled_end, duration_minutes, timezone,
        customer_name, customer_email, customer_phone, location_or_link,
        assigned_staff_id, assigned_staff_name, created_by, management_token,
        service_address, booking_source, customer_timezone, customer_notes,
        conference_status
      )
      VALUES (
        $1, NULL, 'Residential Deep Cleaning Consultation — Éléonore Gagnon',
        'Initial pre-service estimate and walkthrough for heritage downtown residence.',
        'telephone', 'confirmed',
        $2, $3, 30, 'America/Toronto',
        'Éléonore Gagnon', 'eleonore.gagnon@ottawa-heritage.ca', '+1 (613) 555-0182',
        '+1 (613) 555-0182', $4, $5,
        $4, $6, '284 Somerset St W, Ottawa, ON K2P 0J6',
        'public_self_service', 'America/Toronto', 'Special care required for antique hardwood surfaces.',
        'none'
      )
      `,
      [demoAptId, nextWeekOttawa, endOttawa, staff.id, staff.name, demoToken]
    );

    console.log(`Navigating to customer management portal: /book/${demoToken}...`);
    await page.goto(`http://localhost:3000/book/${demoToken}`, { waitUntil: 'networkidle0' });
    await take('stage-b-05-customer-portal-desktop.png', { width: 1440, height: 900 });
    await take('stage-b-05-customer-portal-mobile.png', { width: 390, height: 844, isMobile: true, hasTouch: true });

    // Google Meet Consultation with Pending Video Details
    const meetToken = `meet_tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const meetAptId = `apt_meet_${Date.now()}`;
    await pool.query(
      `
      INSERT INTO appointments (
        id, enquiry_id, title, purpose, appointment_type, status,
        scheduled_start, scheduled_end, duration_minutes, timezone,
        customer_name, customer_email, customer_phone, location_or_link,
        assigned_staff_id, assigned_staff_name, created_by, management_token,
        service_address, booking_source, customer_timezone, customer_notes,
        conference_status
      )
      VALUES (
        $1, NULL, 'Commercial Cleaning Video Consultation — Ottawa Tech Hub',
        'Virtual walkthrough for multi-floor commercial office space.',
        'google_meet', 'confirmed',
        $2, $3, 30, 'America/Toronto',
        'Marcus Vance', 'marcus.vance@ottawatechhub.ca', '+1 (613) 555-0199',
        NULL, $4, $5,
        $4, $6, '340 Albert St, Ottawa, ON K1R 7Y6',
        'public_self_service', 'America/Toronto', 'Video consultation requested.',
        'pending_details'
      )
      `,
      [meetAptId, nextWeekOttawa, endOttawa, staff.id, staff.name, meetToken]
    );

    console.log(`Navigating to Google Meet pending details portal: /book/${meetToken}...`);
    await page.goto(`http://localhost:3000/book/${meetToken}`, { waitUntil: 'networkidle0' });
    await take('stage-b-05b-customer-portal-meet-pending.png', { width: 1440, height: 900 });

    // 3. Admin Staff Availability & Google Meet Settings (/admin/appointments/settings)
    console.log('\nAuthenticating as admin to capture Appointment Settings...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.type('#admin-email', 'alelechi17@gmail.com');
    await page.type('#admin-password', 'UniquePro2025');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]'),
    ]);
    console.log('✅ Admin authenticated.');

    console.log('Navigating to /admin/appointments/settings...');
    await page.goto('http://localhost:3000/admin/appointments/settings', { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 2000));
    await take('stage-b-06-admin-appointment-settings.png', { width: 1440, height: 900 });

    // Clean up demo fixtures
    await pool.query('DELETE FROM appointments WHERE id = ANY($1)', [[demoAptId, meetAptId]]);
    console.log('Cleaned up demo fixtures.');

  } catch (err) {
    console.error('Screenshot capture error:', err);
  } finally {
    await browser.close();
    await pool.end();
  }
}

capture().then(() => console.log('All Stage B screenshots captured successfully!'));
