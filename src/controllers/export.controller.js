// src/controllers/export.controller.js

const exportService = require('../services/export.service');
const { error } = require('../utils/response');

const exportExcel = async (req, res, next) => {
  try {
    const { startDate, endDate, search } = req.query;
    const buffer = await exportService.exportToExcel(startDate, endDate, search);

    const filename = `absensi-mcc-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, search } = req.query;
    await exportService.exportToPDF(res, startDate, endDate, search);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportExcel, exportPDF };
