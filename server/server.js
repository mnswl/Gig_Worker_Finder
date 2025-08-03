require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();

// Allowed origins list (comma-separated env var)
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'https://gig-worker-finder-frontend.onrender.com,https://gigworkerfinder-production.up.railway.app,https://gigworkerfinder-production-07e4.up.railway.app')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// In development, also allow localhost front-end ports
if (process.env.NODE_ENV !== 'production') {
  ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'].forEach((devOrigin) => {
    if (!ALLOWED_ORIGINS.includes(devOrigin)) ALLOWED_ORIGINS.push(devOrigin);
  });
}

// Create HTTP server & Socket.IO
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  },
});
const path = require('path');
app.set('io', io);

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next();
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = user.id;
    return next();
  } catch (err) {
    console.log('Socket auth failed');
    return next();
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  if (socket.userId) {
    socket.join(socket.userId);
  }
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  // relay typing indicator
  socket.on('typing', ({ to }) => {
    if (to) {
      socket.to(to).emit('typing', { from: socket.userId || null });
    }
  });
  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

// Middleware – CORS first so every route gets the headers
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return cb(null, true);
      return cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Gig Worker Finder API is running');
});

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const statsRoutes = require('./routes/stats');
const aiRoutes = require('./routes/ai');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  // Start server after DB connection
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => console.log(`Server started on port ${PORT}`));
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

module.exports = app;
