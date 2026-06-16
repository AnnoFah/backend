// src/validations/employee.validation.js
const { body } = require('express-validator');

const createEmployeeValidation = [
  body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password harus mengandung huruf besar, kecil, dan angka'),
  body('fullName').trim().notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('employeeCode').trim().notEmpty().withMessage('Kode karyawan wajib diisi'),
  body('joinDate').isISO8601().withMessage('Format tanggal tidak valid'),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Nomor HP tidak valid'),
  body('department').optional().trim(),
  body('position').optional().trim(),
];

const updateEmployeeValidation = [
  body('fullName').optional().trim().notEmpty().withMessage('Nama tidak boleh kosong'),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Nomor HP tidak valid'),
  body('department').optional().trim(),
  body('position').optional().trim(),
];

const updateProfileValidation = [
  body('fullName').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Nomor HP tidak valid'),
];

module.exports = { createEmployeeValidation, updateEmployeeValidation, updateProfileValidation };
