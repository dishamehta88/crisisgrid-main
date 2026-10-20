const pool = require('../config/db');

// Safe table creation - won't crash deploy if DB not ready
pool.query(`
  CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) DEFAULT 'incident_report',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'other',
    severity VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(30) DEFAULT 'reported',
    location JSONB DEFAULT '{"type":"Point","coordinates":[0,0]}'::jsonb,
    reported_by INTEGER,
    image_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`).then(() => console.log('[db] incidents ready')).catch(e => console.log('[db] incidents init skipped:', e.message));

const Incident = {
    async create(data) {
        const r = await pool.query(
            `INSERT INTO incidents (type, title, description, category, severity, status, location, reported_by, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [data.type || 'incident_report', data.title, data.description, data.category || 'other', data.severity || 'medium', data.status || 'reported', JSON.stringify(data.location || { type: 'Point', coordinates: [0, 0] }), data.reportedBy || null, data.imageUrl || '']
        );
        return r.rows[0];
    },
    async find() {
        const r = await pool.query(`SELECT * FROM incidents ORDER BY created_at DESC`);
        return r.rows;
    },
    async findById(id) {
        const r = await pool.query(`SELECT * FROM incidents WHERE id=$1`, [id]);
        return r.rows[0];
    }
};

module.exports = Incident;