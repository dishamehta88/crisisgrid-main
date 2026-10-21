require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

const DEMO_USERS = [
  { name: 'Aarav Sharma', email: 'citizen@demo.crisisgrid.app', role: 'citizen', phone: '9820000001' },
  { name: 'EOC Mumbai Control', email: 'eoc@demo.crisisgrid.app', role: 'eoc', org: 'Mumbai Disaster Management Cell' },
  { name: 'NDRF Team 4', email: 'rescue@demo.crisisgrid.app', role: 'rescue_team', org: 'NDRF Team 4' },
  { name: 'Sion Hospital Admin', email: 'hospital@demo.crisisgrid.app', role: 'hospital', org: 'Sion Hospital' },
  { name: 'BKC Relief Camp', email: 'shelter@demo.crisisgrid.app', role: 'shelter', org: 'BKC Relief Camp' },
];

async function seed() {
  console.log('[pgSeed] Starting...');
  await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      phone VARCHAR(20),
      organization_name VARCHAR(255),
      verification_document JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('[pgSeed] users table ready');
  const hashed = await bcrypt.hash('Demo@1234', 10);
  for (const u of DEMO_USERS) {
    await db.query(`
      INSERT INTO users (name, email, password_hash, role, phone, organization_name)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (email) DO UPDATE SET password_hash=$3, name=$1
    `, [u.name, u.email, hashed, u.role, u.phone || null, u.org || null]);
  }
  console.log('[pgSeed] Demo users seeded. Password: Demo@1234');
  process.exit(0);
}
seed().catch(e => { console.error('[pgSeed] Failed:', e); process.exit(1); });
