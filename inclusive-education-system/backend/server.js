const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { testConnection } = require('./database/db');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const messageRoutes = require('./routes/messages');
const studyGroupRoutes = require('./routes/study-groups');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const profileRoutes = require('./routes/profile');
const mentorRoutes = require('./routes/mentor');
const matchRoutes = require('./routes/match');

const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Inclusive Education Backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/study-groups', studyGroupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/match', matchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('⚠️  Starting server without database connection');
      console.error('⚠️  Please check your database configuration in .env file');
    }

    server.listen(PORT, () => {
      console.log('=================================');
      console.log('🚀 Inclusive Education Backend');
      console.log('=================================');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🤖 AI Service URL: ${process.env.AI_SERVICE_URL}`);
      console.log('=================================');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;

// Simple Socket.IO chat (local demo)
const rooms = {};
io.on('connection', (socket) => {
  socket.on('join', ({ room, name }) => {
    socket.join(room);
    rooms[room] = rooms[room] || [];
    io.to(room).emit('system', `${name || 'User'} joined`);
  });
  socket.on('message', ({ room, from, text }) => {
    if (!room || !text) return;
    io.to(room).emit('message', { from, text, ts: Date.now() });
  });
  socket.on('leave', ({ room, name }) => {
    socket.leave(room);
    io.to(room).emit('system', `${name || 'User'} left`);
  });
  socket.on('disconnect', () => {});
});
