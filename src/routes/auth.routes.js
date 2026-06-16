// src/routes/auth.routes.js

const { Router } = require('express');
const { login, refresh, getMe, logout } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { loginValidation } = require('../validations/auth.validation');
const validate = require('../middleware/validate.middleware');

const router = Router();

// POST /api/v1/auth/login
router.post('/login', loginValidation, validate, login);

// POST /api/v1/auth/refresh
router.post('/refresh', refresh);

// GET /api/v1/auth/me  (protected)
router.get('/me', authenticate, getMe);

// POST /api/v1/auth/logout  (protected)
router.post('/logout', authenticate, logout);

module.exports = router;
