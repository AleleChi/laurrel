const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { Pool } = require('../backend/node_modules/pg');
const argon2 = require('../backend/node_modules/argon2');

async function check() {
  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const r = await p.query('SELECT password_hash FROM admin_users WHERE email = $1', [process.env.ADMIN_OWNER_EMAIL]);
    if (r.rows.length === 0) {
      console.log('No owner found with email:', process.env.ADMIN_OWNER_EMAIL);
      return;
    }
    const match = await argon2.verify(r.rows[0].password_hash, process.env.ADMIN_OWNER_PASSWORD);
    console.log('Owner credentials match in Neon database:', match);
  } finally {
    await p.end();
  }
}

check();
