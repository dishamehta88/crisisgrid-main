const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()')
    .then(() => console.log('[db] Postgres connected to Neon'))
    .catch(err => console.error('[db] Postgres error:', err.message));

module.exports = pool;