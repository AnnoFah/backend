// src/controllers/attendance.controller.js

const attendanceService = require('../services/attendance.service');
const prisma = require('../config/database');
const { success, error, paginated } = require('../utils/response');

const checkIn = async (req, res, next) => {
  try {
    const { latitude, longitude, notes } = req.body;
    const attendance = await attendanceService.checkIn(req.user.id, latitude, longitude, notes);
    return success(res, attendance, 'Absensi masuk berhasil dicatat', 201);
  } catch (err) {
    next(err);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const { latitude, longitude, notes } = req.body;
    const attendance = await attendanceService.checkOut(req.user.id, latitude, longitude, notes);
    return success(res, attendance, 'Absensi pulang berhasil dicatat');
  } catch (err) {
    next(err);
  }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getTodayStatus(req.user.id);
    return success(res, attendance, attendance ? 'Status absensi hari ini' : 'Belum absen hari ini');
  } catch (err) {
    next(err);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const result = await attendanceService.getMyAttendance(req.user.id, {
      page: +page,
      limit: +limit,
      startDate,
      endDate,
    });
    return paginated(res, result.data, result.pagination, 'Riwayat absensi berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getAllAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, startDate, endDate, status } = req.query;
    const result = await attendanceService.getAllAttendance({
      page: +page,
      limit: +limit,
      search,
      startDate,
      endDate,
      status,
    });
    return paginated(res, result.data, result.pagination, 'Data absensi berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getAttendanceById = async (req, res, next) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: req.params.id },
      include: {
        employee: {
          select: { fullName: true, employeeCode: true, department: true, position: true },
        },
      },
    });
    if (!attendance) return error(res, 'Data absensi tidak ditemukan', 404);
    return success(res, attendance, 'Data absensi berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const adminUpdateAttendance = async (req, res, next) => {
  try {
    const { status, notes, checkInTime, checkOutTime } = req.body;

    const existing = await prisma.attendance.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Data absensi tidak ditemukan', 404);

    const updated = await prisma.attendance.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(checkInTime && { checkInTime: new Date(checkInTime) }),
        ...(checkOutTime && { checkOutTime: new Date(checkOutTime) }),
      },
      include: {
        employee: {
          select: { fullName: true, employeeCode: true },
        },
      },
    });

    // Log perubahan admin
    await prisma.log.create({
      data: {
        userId: req.user.id,
        action: 'ADMIN_UPDATE_ATTENDANCE',
        description: `Admin memperbarui absensi ID ${req.params.id}`,
      },
    });

    return success(res, updated, 'Data absensi berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const submitLeave = async (req, res, next) => {
  try {
    const { type, notes } = req.body;
    if (!['izin', 'sakit'].includes(type?.toLowerCase())) {
      return error(res, 'Tipe absen harus izin atau sakit', 400);
    }
    const attendance = await attendanceService.createLeave(req.user.id, type, notes);
    return success(res, attendance, `Pengajuan ${type} berhasil dicatat`, 201);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkIn,
  checkOut,
  submitLeave,
  getTodayStatus,
  getMyAttendance,
  getAllAttendance,
  getAttendanceById,
  adminUpdateAttendance,
};
