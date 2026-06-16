// src/validations/attendance.validation.js
const { body } = require('express-validator');

const checkInValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude tidak valid'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude tidak valid'),
  body('notes').optional().isString().trim(),
];

const checkOutValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude tidak valid'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude tidak valid'),
  body('notes').optional().isString().trim(),
];

module.exports = { checkInValidation, checkOutValidation };
