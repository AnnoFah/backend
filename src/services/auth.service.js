// src/services/auth.service.js

const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');

const login = async (email, password) => {
  // Cari user dengan email
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true, employee: true },
  });

  if (!user) throw { statusCode: 401, message: 'Email atau password salah' };
  if (!user.isActive) throw { statusCode: 403, message: 'Akun Anda telah dinonaktifkan' };

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) throw { statusCode: 401, message: 'Email atau password salah' };

  const payload = { userId: user.id, email: user.email, role: user.role.name };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Log aktivitas login
  await prisma.log.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      description: `User ${user.email} berhasil login`,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role.name,
      employee: user.employee,
    },
  };
};

const refresh = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true },
    });
    if (!user || !user.isActive) throw { statusCode: 401, message: 'User tidak valid' };

    const payload = { userId: user.id, email: user.email, role: user.role.name };
    const newAccessToken = generateAccessToken(payload);
    return { accessToken: newAccessToken };
  } catch (err) {
    if (err.statusCode) throw err;
    throw { statusCode: 401, message: 'Refresh token tidak valid atau kadaluarsa' };
  }
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
      employee: true,
    },
  });
  if (!user) throw { statusCode: 404, message: 'User tidak ditemukan' };
  return user;
};

module.exports = { login, refresh, getMe };
