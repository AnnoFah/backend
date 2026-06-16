// src/controllers/auth.controller.js

const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, result, 'Login berhasil');
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'Refresh token diperlukan', 400);
    const result = await authService.refresh(refreshToken);
    return success(res, result, 'Token berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return success(res, user, 'Data user berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    // Untuk stateless JWT, cukup kembalikan response sukses
    // Client harus menghapus token dari storage-nya
    return success(res, null, 'Logout berhasil');
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, getMe, logout };
