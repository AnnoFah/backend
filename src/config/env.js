// src/config/env.js
// Centralized environment configuration

require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // GPS MCC Malang
  MCC_LAT: parseFloat(process.env.MCC_LAT) || -7.983908,
  MCC_LNG: parseFloat(process.env.MCC_LNG) || 112.621391,
  MCC_RADIUS: parseInt(process.env.MCC_RADIUS) || 200,

  // Jam kerja (WIB)
  CHECKIN_START: '07:00',    // Buka absensi masuk jam 07:00
  CHECKIN_END: '10:00',      // Tutup absensi masuk jam 10:00
  CHECKOUT_START: '12:00',   // Buka absensi pulang jam 12:00
  CHECKOUT_END: '18:00',     // Tutup absensi pulang jam 18:00
  LATE_THRESHOLD: '08:00',   // Batas terlambat jam 08:00

  // Supabase Storage
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || 'mcc-avatars',
};

// Validasi env kritis di production
// Validasi env kritis di production
if (env.NODE_ENV === 'production') {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`[CRITICAL] Environment variable berikut belum diisi di Vercel: ${missing.join(', ')}`);
  }
}

module.exports = env;
