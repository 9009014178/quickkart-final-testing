const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // 👈 NEW: to read cookies
const rateLimit = require('express-rate-limit'); // For security
const app = express();

// --- Import all your route files ---
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

// --- Import Error Handling Middleware ---
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

// --- Middleware setup ---

// ✅ CORS with credentials support
app.use(
  cors({
    origin: 'http://localhost:8080', // your frontend URL
    credentials: true,               // allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser()); // 👈 NEW: parse cookies into req.cookies

app.use(express.json()); // To parse JSON bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded bodies

// --- Rate Limiter Definitions ---
// Stricter limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// General limiter for all other API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Allow slightly more requests for general use
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
// --- End Rate Limiter ---

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('QuickKart API is running...');
});

// Apply the specific, stricter limiter to auth routes
app.use('/api/auth', authLimiter, authRoutes);

// Apply the general, more relaxed limiter to all other API routes
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

// --- Error Handling Middleware ---
// This must be AFTER all the API routes
app.use(notFound); // Catches requests to non-existent routes (404)
app.use(errorHandler); // Catches all other errors

module.exports = app;
