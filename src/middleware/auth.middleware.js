// src/middleware/auth.middleware.js
// Verifikasi JWT Access Token

const { verifyAccessToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const prisma = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Token autentikasi tidak ditemukan', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verifikasi user masih aktif di database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true, employee: true },
    });

    if (!user) return error(res, 'User tidak ditemukan', 401);
    if (!user.isActive) return error(res, 'Akun Anda telah dinonaktifkan', 403);

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      employee: user.employee,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return error(res, 'Token telah kadaluarsa, silakan login ulang', 401);
    if (err.name === 'JsonWebTokenError') return error(res, 'Token tidak valid', 401);
    return error(res, 'Autentikasi gagal', 401);
  }
};

module.exports = { authenticate };
