// src/routes/dashboard.routes.js

const { Router } = require('express');
const { getTodaySummary, getMonthlyStats, getLateEmployees } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

const router = Router();

// Semua route hanya untuk admin
router.use(authenticate, requireAdmin);

// GET /api/v1/dashboard/today
router.get('/today', getTodaySummary);

// GET /api/v1/dashboard/monthly?year=2026&month=4
router.get('/monthly', getMonthlyStats);

// GET /api/v1/dashboard/late-employees?limit=10
router.get('/late-employees', getLateEmployees);

module.exports = router;
