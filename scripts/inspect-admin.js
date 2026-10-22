const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
dotenv.config();

const { Pool } = require('../backend/node_modules/pg');

async function checkAdminUsers() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not found');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(
      `SELECT id, email, name, role, is_active as "isActive", created_at as "createdAt", last_login_at as "lastLoginAt"
       FROM admin_users;`
    );

    console.log('Admin Users count:', res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Query error:', err.message);
  } finally {
    await pool.end();
  }
}

checkAdminUsers();
