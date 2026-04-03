require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const supplierRoutes = require('./routes/suppliers');
const alertRoutes = require('./routes/alerts');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', process.env.FRONTEND_URL].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// Security & performance middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(morgan('dev'));

// CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Stock API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes); // NEW

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Socket.IO events
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`📡 Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Periodic low-stock check every 5 minutes
const checkLowStock = async () => {
  try {
    const Product = require('./models/Product');
    const Alert = require('./models/Alert');
    const lowStockProducts = await Product.find({
      $expr: { $and: [{ $lte: ['$stock', '$threshold'] }, { $gt: ['$stock', 0] }] },
      status: 'active',
    });

    for (const product of lowStockProducts) {
      // Check if alert already exists (avoid spam)
      const existingAlert = await Alert.findOne({
        product: product._id,
        type: 'warning',
        read: false,
        createdAt: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }, // within 6h
      });

      if (!existingAlert) {
        const alert = await Alert.create({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${product.name} is running low: ${product.stock}/${product.threshold} units`,
          product: product._id,
        });
        io.emit('new_alert', alert);
      }
    }
  } catch (err) {
    console.error('Low stock check error:', err.message);
  }
};

setInterval(checkLowStock, 5 * 60 * 1000); // every 5 minutes

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Smart Stock Server running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS allowed from: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

module.exports = { app, server, io };
