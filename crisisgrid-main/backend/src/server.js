// -----------------------------------------------------------------------------
// server.js — application entry point. Wires together Express (REST API),
// Socket.IO (real-time events) on one shared HTTP server, and MongoDB.
// -----------------------------------------------------------------------------

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const aiRoutes = require('./routes/aiRoutes');
const userRoutes = require('./routes/userRoutes');
const alertRoutes = require('./routes/alertRoutes');

connectDB();

const app = express();
app.set('trust proxy', 1);

// --- Core middleware ---------------------------------------------------
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:3000',
        process.env.CLIENT_URL,
        'https://crisisgrid-main.onrender.com'
    ].filter(Boolean),
    credentials: true
}))
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'CrisisGrid API is running', demoMode: process.env.DEMO_MODE === 'true' });
});

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`[server] CrisisGrid API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

module.exports = { app, httpServer };