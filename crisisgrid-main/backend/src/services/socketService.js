// -----------------------------------------------------------------------------
// socketService.js — thin wrapper around Socket.IO so controllers can emit
// real-time events without importing `io` everywhere directly.
// -----------------------------------------------------------------------------

const { Server } = require('socket.io');

let io = null;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: [
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:3000",
                process.env.CLIENT_URL,
                "https://crisisgrid-main.onrender.com"
            ].filter(Boolean),
            credentials: true,
            methods: ["GET", "POST"]
        },
    });

    io.on('connection', (socket) => {
        console.log(`[socket] client connected: ${socket.id}`);

        socket.on('join', (roomName) => {
            socket.join(roomName);
        });

        socket.on('disconnect', () => {
            console.log(`[socket] client disconnected: ${socket.id}`);
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO was requested before initSocket() was called');
    }
    return io;
}

module.exports = { initSocket, getIO };