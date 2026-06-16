// src/server.js
// Entry point aplikasi backend MCC Absensi

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const env = require('./config/env');
const { error } = require('./utils/response');
const errorHandler = require('./middleware/errorHandler.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const exportRoutes = require('./routes/export.routes');

const app = express();

// ── SECURITY MIDDLEWARE ─────────────────────────────────────────
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── RATE LIMITING ───────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
});
app.use(limiter);

// Rate limit khusus untuk auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit.' },
});

// ── BODY PARSER ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── LOGGER ──────────────────────────────────────────────────────
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ── HEALTH CHECK ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'MCC Absensi API berjalan dengan baik ✅',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── ROUTES ───────────────────────────────────────────────────────
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/export', exportRoutes);

// ── 404 HANDLER ──────────────────────────────────────────────────
app.use((req, res) => {
  error(res, `Route ${req.originalUrl} tidak ditemukan`, 404);
});

// ── GLOBAL ERROR HANDLER ─────────────────────────────────────────
app.use(errorHandler);

// ── START SERVER ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║     🏢  MCC Absensi Backend API  🏢               ║');
    console.log('╠═══════════════════════════════════════════════════╣');
    console.log(`║  🚀 Server berjalan di port ${PORT}                 ║`);
    console.log(`║  🌍 Environment: ${env.NODE_ENV.padEnd(31)} ║`);
    console.log(`║  📡 URL: http://localhost:${PORT}/api/v1            ║`);
    console.log('╚═══════════════════════════════════════════════════╝');
    console.log('');
  });
}

module.exports = app;
