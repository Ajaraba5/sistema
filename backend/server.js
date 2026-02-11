require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');
const app = require('./app');
const config = require('./config/env');
const db = require('./config/db');

const server = http.createServer(app);

// Socket.IO setup
const io = socketIO(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // Listen for vote updates
    socket.on('vote-update', (data) => {
        // Broadcast to all clients except sender
        socket.broadcast.emit('vote-updated', data);
    });

    // Listen for persona updates
    socket.on('persona-update', (data) => {
        socket.broadcast.emit('persona-updated', data);
    });

    // Listen for dashboard refresh
    socket.on('dashboard-refresh', () => {
        socket.broadcast.emit('dashboard-updated');
    });
});

// Make io available to routes
app.set('io', io);

// Start server
const PORT = config.port;

// Test database connection before starting server
db.query('SELECT NOW()')
    .then(() => {
        server.listen(PORT, () => {
            console.log('='.repeat(50));
            console.log('Sistema de Votación Enterprise v3.0.0');
            console.log('='.repeat(50));
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database: ${config.db.database}`);
            console.log('='.repeat(50));
        });
    })
    .catch((err) => {
        console.error('Failed to connect to database:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        db.pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
});
