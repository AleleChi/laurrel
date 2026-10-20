const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
dotenv.config();

const { Pool } = require('../backend/node_modules/pg');

async function inspectOwnerHashFormat() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(
      `SELECT id, email, role,
              (password_hash LIKE '$argon2%') as "isArgon2",
              (password_hash LIKE '%:%') as "isLegacyScrypt",
              length(password_hash) as "hashLength"
       FROM admin_users WHERE role = 'owner';`
    );

    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

inspectOwnerHashFormat();
