// src/middleware/errorHandler.middleware.js
// Global error handler

const { error } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Custom errors dari services (throw { statusCode, message })
  if (err.statusCode) {
    return error(res, err.message, err.statusCode);
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return error(res, 'Data sudah ada (duplikat)', 409);
  }
  if (err.code === 'P2025') {
    return error(res, 'Data tidak ditemukan', 404);
  }
  if (err.code === 'P2003') {
    return error(res, 'Referensi data tidak valid', 400);
  }

  // Default 500
  return error(res, err.message || 'Terjadi kesalahan pada server', 500);
};

module.exports = errorHandler;
