// src/middleware/validate.middleware.js
// Middleware untuk cek hasil express-validator

const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(
      res,
      'Validasi gagal',
      422,
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

// Export sebagai default DAN named untuk kompatibilitas
module.exports = validate;
module.exports.validate = validate;
