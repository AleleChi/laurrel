const path = require('path');
const dotenv = require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { Pool } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
});

async function run() {
  console.log('=== NEON POSTGRESQL DATA AUDIT ===\n');

  // Enquiries
  const enqCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'enquiries' ORDER BY ordinal_position");
  console.log('Enquiries columns:', enqCols.rows.map(r => r.column_name).join(', '));
  
  const enqs = await pool.query("SELECT id, customer_name, customer_email, services, status, source, created_at FROM enquiries ORDER BY created_at DESC");
  console.log(`Total Enquiries in DB: ${enqs.rowCount}\n`);
  
  // Categorize enquiries
  const testEnquiries = [];
  const genuineEnquiries = [];
  for (const row of enqs.rows) {
    if (
      row.id.startsWith('ENQ-REGRESS') ||
      row.id.startsWith('ENQ-TEST') ||
      row.customer_name?.includes('Test') ||
      row.customer_email?.includes('test') ||
      row.customer_email?.includes('example.com')
    ) {
      testEnquiries.push(row);
    } else {
      genuineEnquiries.push(row);
    }
  }

  console.log(`Test / Automated Enquiries (${testEnquiries.length}):`);
  testEnquiries.forEach(e => console.log(` - [${e.id}] ${e.customer_name} (${e.customer_email}) | Services: ${JSON.stringify(e.services)} | Status: ${e.status} | Created: ${e.created_at?.toISOString()}`));

  console.log(`\nGenuine / Customer Enquiries (${genuineEnquiries.length}):`);
  genuineEnquiries.forEach(e => console.log(` - [${e.id}] ${e.customer_name} (${e.customer_email}) | Services: ${JSON.stringify(e.services)} | Status: ${e.status} | Created: ${e.created_at?.toISOString()}`));

  // Appointments
  const appts = await pool.query("SELECT id, enquiry_id, title, status, appointment_type, scheduled_start, customer_name, customer_email, assigned_staff_name, created_at FROM appointments ORDER BY scheduled_start DESC");
  console.log(`\nTotal Appointments in DB: ${appts.rowCount}\n`);

  const testAppts = [];
  const genuineAppts = [];
  for (const row of appts.rows) {
    if (
      row.id.startsWith('apt_test_') ||
      row.id.startsWith('apt_regress_') ||
      row.enquiry_id?.startsWith('ENQ-REGRESS') ||
      row.enquiry_id?.startsWith('ENQ-TEST') ||
      row.customer_name?.includes('Test') ||
      row.customer_email?.includes('test') ||
      row.customer_email?.includes('example.com')
    ) {
      testAppts.push(row);
    } else {
      genuineAppts.push(row);
    }
  }

  console.log(`Test / Automated Appointments (${testAppts.length}):`);
  testAppts.forEach(a => console.log(` - [${a.id}] (Enquiry: ${a.enquiry_id}) ${a.title} | ${a.customer_name} | Start: ${a.scheduled_start?.toISOString()} | Status: ${a.status} | Staff: ${a.assigned_staff_name}`));

  console.log(`\nGenuine / Customer Appointments (${genuineAppts.length}):`);
  genuineAppts.forEach(a => console.log(` - [${a.id}] (Enquiry: ${a.enquiry_id}) ${a.title} | ${a.customer_name} | Start: ${a.scheduled_start?.toISOString()} | Status: ${a.status} | Staff: ${a.assigned_staff_name}`));

  // Status counts in enquiries
  const statusCounts = await pool.query("SELECT status, count(*) as count FROM enquiries GROUP BY status");
  console.log('\nEnquiry status breakdown:', statusCounts.rows);

  await pool.end();
}

run().catch(err => {
  console.error('Audit failed:', err);
  pool.end();
});
