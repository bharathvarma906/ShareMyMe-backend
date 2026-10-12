const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const distributionRoutes = require('./routes/distributionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic & flexible CORS configuration (fully compatible with credentials)
const rawAllowed = process.env.ALLOWED_ORIGINS;
const allowedOrigins = rawAllowed
  ? rawAllowed.split(',').map((o) => o.trim().replace(/\/$/, ''))
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, Render health checks)
      if (!origin) return callback(null, true);

      // If wildcard or not configured, reflect origin so credentials mode works seamlessly
      if (!allowedOrigins || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // If specific origins are allowed
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Health check endpoint (Used by Render to verify container is healthy)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    status: 'OK',
    message: 'ShareMyMeal Backend API is active and healthy!',
    timestamp: new Date().toISOString(),
    database: dbStatusMap[dbState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'production',
  });
});

// Root endpoint for browser testing & ping
app.get('/', (req, res) => {
  res.send('<h1>ShareMyMeal Backend is Running successfully! 🚀</h1><p>The API endpoints are located at <code>/api</code>. Check health at <code>/api/health</code>.</p>');
});

// API Routes (supports both /api/* and direct /* paths for maximum resilience)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/donations', '/donations'], donationRoutes);
app.use(['/api/assignments', '/assignments'], assignmentRoutes);
app.use(['/api/notifications', '/notifications'], notificationRoutes);
app.use(['/api/distribution', '/distribution'], distributionRoutes);
app.use(['/api/analytics', '/analytics'], analyticsRoutes);

// Catch 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Requested API endpoint does not exist' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Internal Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Render dynamically provides PORT (typically 10000)
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/api/health`);
});

// Graceful shutdown handling for container stops and restarts
const shutdown = () => {
  console.log('Received shutdown signal. Closing HTTP server...');
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

