// src/middleware/rbac.middleware.js
// Role-Based Access Control

const { error } = require('../utils/response');

/**
 * Middleware untuk membatasi akses berdasarkan role
 * Contoh: authorize('admin') atau authorize('admin', 'karyawan')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Tidak terautentikasi', 401);
    if (!roles.includes(req.user.role)) {
      return error(res, 'Anda tidak memiliki akses ke halaman ini', 403);
    }
    next();
  };
};

// Shortcut: hanya admin
const requireAdmin = authorize('admin');

// Shortcut: karyawan atau admin
const requireKaryawan = authorize('karyawan', 'admin');

module.exports = { authorize, requireAdmin, requireKaryawan };
