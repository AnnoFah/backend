// src/routes/employee.routes.js

const { Router } = require('express');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeActive,
  deleteEmployee,
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
} = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const {
  createEmployeeValidation,
  updateEmployeeValidation,
} = require('../validations/employee.validation');
const validate = require('../middleware/validate.middleware');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Hanya file gambar yang diizinkan'), false);
    }
    cb(null, true);
  },
});

const router = Router();

// Semua route membutuhkan autentikasi
router.use(authenticate);

// ── Karyawan: Profile Sendiri ────────────────────────────────────
// GET  /api/v1/employees/me
router.get('/me', getMyProfile);

// PUT  /api/v1/employees/me
router.put('/me', updateEmployeeValidation, validate, updateMyProfile);

// POST /api/v1/employees/me/avatar
router.post('/me/avatar', upload.single('avatar'), uploadMyAvatar);

// ── Admin: Manage Karyawan ──────────────────────────────────────
// GET  /api/v1/employees
router.get('/', requireAdmin, getAllEmployees);

// POST /api/v1/employees
router.post('/', requireAdmin, createEmployeeValidation, validate, createEmployee);

// GET  /api/v1/employees/:id
router.get('/:id', requireAdmin, getEmployeeById);

// PUT  /api/v1/employees/:id
router.put('/:id', requireAdmin, updateEmployeeValidation, validate, updateEmployee);

// PATCH /api/v1/employees/:id/toggle-active
router.patch('/:id/toggle-active', requireAdmin, toggleEmployeeActive);

// DELETE /api/v1/employees/:id
router.delete('/:id', requireAdmin, deleteEmployee);

module.exports = router;
