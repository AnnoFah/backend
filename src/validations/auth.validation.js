// src/validations/auth.validation.js
const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').notEmpty().withMessage('Password tidak boleh kosong'),
];

const refreshValidation = [
  body('refreshToken').notEmpty().withMessage('Refresh token tidak boleh kosong'),
];

module.exports = { loginValidation, refreshValidation };
