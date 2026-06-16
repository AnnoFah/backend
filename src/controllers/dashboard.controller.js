// src/controllers/dashboard.controller.js

const dashboardService = require('../services/dashboard.service');
const { success, error } = require('../utils/response');

const getTodaySummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getTodaySummary();
    return success(res, summary, 'Ringkasan absensi hari ini');
  } catch (err) {
    next(err);
  }
};

const getMonthlyStats = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    if (month < 1 || month > 12) {
      return error(res, 'Bulan harus antara 1-12', 400);
    }

    const stats = await dashboardService.getMonthlyStats(year, month);
    return success(res, stats, `Statistik absensi bulan ${month}/${year}`);
  } catch (err) {
    next(err);
  }
};

const getLateEmployees = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const employees = await dashboardService.getLateEmployees(limit);
    return success(res, employees, 'Data karyawan paling sering terlambat');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTodaySummary, getMonthlyStats, getLateEmployees };
