// ======================
// ✅ QuickKart App Setup
// ======================

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path'); // For static file serving

const app = express();

// --- Route files ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const couponRoutes = require('./routes/couponRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const darkStoreRoutes = require('./routes/darkStoreRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

// --- Error middleware ---
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// ==========================
// ✅ CORS setup
// ==========================

// Frontend origins allowed to talk to this API
const allowedOrigins = [
  'http://localhost:8080', // current frontend
  'http://localhost:5173', // vite default (keep for future)
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools like Postman / curl (no origin header)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Disallow other origins (no CORS headers sent)
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// IMPORTANT: don't add another app.use(cors(...)) anywhere else

// ==========================
// ✅ Core middleware
// ==========================

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================
// ✅ Static File Serving
// ==========================
// Example URL: http://localhost:3000/uploads/products/sprite-can-300ml.jpg
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ==========================
// ✅ Rate Limiter Setup
// ==========================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message:
    'Too many authentication attempts, please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================
// ✅ Routes
// ==========================

app.get('/', (req, res) => {
  res.send('🚀 QuickKart API is running...');
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/delivery', apiLimiter, deliveryRoutes);
app.use('/api/coupons', apiLimiter, couponRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/stores', apiLimiter, darkStoreRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/subscriptions', apiLimiter, subscriptionRoutes);

// ==========================
// ✅ Error Handling
// ==========================

app.use(notFound);     // 404 Handler
app.use(errorHandler); // Global Error Handler

// ==========================
// ✅ Export App
// ==========================
module.exports = app;
