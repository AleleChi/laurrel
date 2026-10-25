const path = require('path');
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function audit() {
  const enq = await pool.query('SELECT id, created_at, source, customer_name, customer_email, status, intent, details FROM enquiries ORDER BY created_at ASC;');
  console.log('--- ENQUIRIES (' + enq.rows.length + ') ---');
  enq.rows.forEach((r, idx) => {
    console.log(`[${idx + 1}] ID: ${r.id} | Date: ${r.created_at?.toISOString()} | Source: ${r.source} | Name: ${r.customer_name} | Email: ${r.customer_email} | Intent: ${r.intent} | Status: ${r.status}`);
    console.log(`     Details: ${JSON.stringify(r.details)}`);
  });

  const apt = await pool.query('SELECT id, created_at, booking_source, customer_name, customer_email, appointment_type, status, scheduled_start, assigned_staff_name, purpose FROM appointments ORDER BY created_at ASC;');
  console.log('\n--- APPOINTMENTS (' + apt.rows.length + ') ---');
  apt.rows.forEach((r, idx) => {
    console.log(`[${idx + 1}] ID: ${r.id} | Date: ${r.created_at?.toISOString()} | Source: ${r.booking_source} | Name: ${r.customer_name} | Email: ${r.customer_email} | Type: ${r.appointment_type} | Status: ${r.status} | Scheduled: ${r.scheduled_start?.toISOString()}`);
    console.log(`     Purpose: ${JSON.stringify(r.purpose)}`);
  });

  await pool.end();
}

audit().catch(e => { console.error(e); pool.end(); });
