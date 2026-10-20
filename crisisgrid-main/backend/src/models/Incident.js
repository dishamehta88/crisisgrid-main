const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const connectDB = async() => {
    try {
        await pool.query('SELECT 1');
        console.log('[db] Postgres connected');
    } catch (e) {
        console.log('[db] Postgres connect error:', e.message);
    }
};

// taaki dono tarah se kaam kare:
// 1) require('./config/db')() -> connectDB
// 2) require('./config/db').query() -> pool.query
connectDB.query = (...args) => pool.query(...args);
connectDB.pool = pool;

module.exports = connectDB;