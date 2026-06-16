// src/routes/export.routes.js

const { Router } = require('express');
const { exportExcel, exportPDF } = require('../controllers/export.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

const router = Router();

// Semua route hanya untuk admin
router.use(authenticate, requireAdmin);

// GET /api/v1/export/excel?startDate=2026-02-01&endDate=2026-04-30
router.get('/excel', exportExcel);

// GET /api/v1/export/pdf?startDate=2026-02-01&endDate=2026-04-30
router.get('/pdf', exportPDF);

module.exports = router;
