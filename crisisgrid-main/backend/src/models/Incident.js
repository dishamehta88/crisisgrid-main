const pool = require('../config/db');

// Auto-create table in Neon (first time only)
(async() => {
    try {
        await pool.query(`
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
        assigned_team INTEGER,
        ai_analysis JSONB DEFAULT '{}'::jsonb,
        crowd_votes JSONB DEFAULT '[]'::jsonb,
        verification JSONB DEFAULT '{"trustScore":45,"trustState":"pending"}'::jsonb,
        escalated BOOLEAN DEFAULT false,
        duplicate_of INTEGER,
        image_url TEXT DEFAULT '',
        timeline JSONB DEFAULT '[]'::jsonb,
        is_demo_data BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents USING GIN (location);
      console.log('[db] incidents table ready');
    `);
    } catch (e) {
        console.error('[db] incidents table error:', e.message);
    }
})();

// Wrapper to keep same API as mongoose model so your controllers don't break
const Incident = {
    async create(data) {
        const result = await pool.query(
            `INSERT INTO incidents (type, title, description, category, severity, status, location, reported_by, image_url, ai_analysis, verification)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`, [
                data.type || 'incident_report',
                data.title,
                data.description,
                data.category || 'other',
                data.severity || 'medium',
                data.status || 'reported',
                JSON.stringify(data.location || { type: 'Point', coordinates: [0, 0] }),
                data.reportedBy || null,
                data.imageUrl || '',
                JSON.stringify(data.aiAnalysis || {}),
                JSON.stringify(data.verification || { trustScore: 45, trustState: 'pending' })
            ]
        );
        return result.rows[0];
    },

    async find(query = {}) {
        const result = await pool.query(`SELECT * FROM incidents ORDER BY created_at DESC`);
        return result.rows;
    },

    async findById(id) {
        const result = await pool.query(`SELECT * FROM incidents WHERE id = $1`, [id]);
        return result.rows[0];
    },

    async findByIdAndUpdate(id, update, options) {
        // simple merge update - you can improve later
        const fields = [];
        const values = [];
        let idx = 1;
        for (const [k, v] of Object.entries(update)) {
            const col = k === 'reportedBy' ? 'reported_by' : k.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
            fields.push(`${col} = $${idx++}`);
            values.push(typeof v === 'object' ? JSON.stringify(v) : v);
        }
        values.push(id);
        const result = await pool.query(
            `UPDATE incidents SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }
};

module.exports = Incident;