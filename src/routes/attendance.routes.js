// src/routes/attendance.routes.js

const { Router } = require('express');
const {
  checkIn,
  checkOut,
  submitLeave,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  getAttendanceById,
  adminUpdateAttendance,
} = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const { checkInValidation, checkOutValidation } = require('../validations/attendance.validation');
const validate = require('../middleware/validate.middleware');

const router = Router();

// Semua route membutuhkan autentikasi
router.use(authenticate);

// ── Karyawan ────────────────────────────────────────────────────
// POST /api/v1/attendance/check-in
router.post('/check-in', checkInValidation, validate, checkIn);

// POST /api/v1/attendance/check-out
router.post('/check-out', checkOutValidation, validate, checkOut);

// POST /api/v1/attendance/leave
router.post('/leave', submitLeave);

// GET  /api/v1/attendance/today
router.get('/today', getTodayStatus);

// GET  /api/v1/attendance/my
router.get('/my', getMyAttendance);

// ── Admin ───────────────────────────────────────────────────────
// GET  /api/v1/attendance
router.get('/', requireAdmin, getAllAttendance);

// GET  /api/v1/attendance/:id
router.get('/:id', requireAdmin, getAttendanceById);

// PATCH /api/v1/attendance/:id
router.patch('/:id', requireAdmin, adminUpdateAttendance);

module.exports = router;
