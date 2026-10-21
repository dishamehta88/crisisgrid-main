const db = require('../config/db');
const bcrypt = require('bcryptjs');

const ROLES = [
  'citizen',
  'eoc',
  'rescue_team',
  'hospital',
  'shelter',
  'volunteer',
  'ngo',
  'admin',
];

async function findByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function createUser({ name, email, password, role, organizationName, phone, verificationDocument }) {
  const hashed = await bcrypt.hash(password, 10);
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash, role, phone, organization_name, verification_document)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      name,
      email.toLowerCase(),
      hashed,
      role || 'citizen',
      phone || null,
      organizationName || null,
      verificationDocument ? JSON.stringify(verificationDocument) : null
    ]
  );
  return rows[0];
}

async function updateRefreshToken(userId, refreshTokenHash) {
  await db.query('UPDATE users SET refresh_token_hash = $1 WHERE id = $2', [refreshTokenHash, userId]);
}

async function clearRefreshToken(userId) {
  await db.query('UPDATE users SET refresh_token_hash = NULL WHERE id = $1', [userId]);
}

function toSafeUser(user) {
  if (!user) return null;
  const { password_hash, refresh_token_hash, ...safe } = user;
  // frontend expects `organizationName` and `id`
  safe.organizationName = safe.organization_name;
  safe.verificationDocument = safe.verification_document;
  delete safe.organization_name;
  delete safe.verification_document;
  return safe;
}

module.exports = {
  ROLES,
  findByEmail,
  findById,
  createUser,
  updateRefreshToken,
  clearRefreshToken,
  toSafeUser,
};
