// src/services/attendance.service.js

const prisma = require('../config/database');
const { isWithinRadius } = require('../utils/gps');
const env = require('../config/env');

// Helper: parse jam dari string "HH:MM"
const parseTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return { h, m };
};

// Helper: cek apakah jam sekarang dalam range waktu
const isInTimeRange = (start, end) => {
  const now = new Date();
  // WIB = UTC+7
  const wibHour = (now.getUTCHours() + 7) % 24;
  const wibMin = now.getUTCMinutes();

  const s = parseTime(start);
  const e = parseTime(end);

  const nowMin = wibHour * 60 + wibMin;
  const startMin = s.h * 60 + s.m;
  const endMin = e.h * 60 + e.m;

  return nowMin >= startMin && nowMin <= endMin;
};

// Helper: tentukan status kehadiran
const determineStatus = (checkInTime) => {
  const wibHour = (checkInTime.getUTCHours() + 7) % 24;
  const wibMin = checkInTime.getUTCMinutes();
  const lateTime = parseTime(env.LATE_THRESHOLD); // 08:00
  const totalMin = wibHour * 60 + wibMin;
  const lateMin = lateTime.h * 60 + lateTime.m;
  return totalMin > lateMin ? 'TERLAMBAT' : 'HADIR';
};

const checkIn = async (userId, latitude, longitude, notes = null) => {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw { statusCode: 404, message: 'Data karyawan tidak ditemukan' };

  // Validasi GPS
  const gps = isWithinRadius(parseFloat(latitude), parseFloat(longitude));
  if (!gps.isValid) {
    throw {
      statusCode: 400,
      message: `Anda berada ${gps.distance}m dari kantor MCC. Maksimal radius: ${gps.radius}m`,
    };
  }

  // Validasi jam check-in
  if (!isInTimeRange(env.CHECKIN_START, env.CHECKIN_END)) {
    throw {
      statusCode: 400,
      message: `Absensi masuk hanya dibuka pukul ${env.CHECKIN_START} - ${env.CHECKIN_END} WIB`,
    };
  }

  // Tanggal hari ini (WIB)
  const today = new Date();
  const todayWIB = new Date(today.getTime() + 7 * 60 * 60 * 1000);
  const dateOnly = new Date(todayWIB.toISOString().split('T')[0]);

  // Cek sudah check-in hari ini
  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
  });
  if (existing) throw { statusCode: 409, message: 'Anda sudah melakukan absensi masuk hari ini' };

  const now = new Date();
  const status = determineStatus(now);

  const attendance = await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date: dateOnly,
      checkInTime: now,
      checkInLat: latitude,
      checkInLng: longitude,
      status,
      notes,
    },
    include: { employee: true },
  });

  // Log aktivitas
  await prisma.log.create({
    data: {
      userId,
      action: 'CHECK_IN',
      description: `${employee.fullName} check-in pada ${now.toISOString()} (${status})`,
    },
  });

  return attendance;
};

const checkOut = async (userId, latitude, longitude, notes = null) => {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw { statusCode: 404, message: 'Data karyawan tidak ditemukan' };

  // Validasi GPS
  const gps = isWithinRadius(parseFloat(latitude), parseFloat(longitude));
  if (!gps.isValid) {
    throw {
      statusCode: 400,
      message: `Anda berada ${gps.distance}m dari kantor MCC. Maksimal radius: ${gps.radius}m`,
    };
  }

  // Validasi jam check-out
  if (!isInTimeRange(env.CHECKOUT_START, env.CHECKOUT_END)) {
    throw {
      statusCode: 400,
      message: `Absensi pulang hanya dibuka pukul ${env.CHECKOUT_START} - ${env.CHECKOUT_END} WIB`,
    };
  }

  // Cari absensi hari ini
  const todayWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  const dateOnly = new Date(todayWIB.toISOString().split('T')[0]);

  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
  });

  if (!attendance) throw { statusCode: 404, message: 'Belum melakukan absensi masuk hari ini' };
  if (attendance.checkOutTime) throw { statusCode: 409, message: 'Anda sudah melakukan absensi pulang hari ini' };

  const now = new Date();
  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutTime: now,
      checkOutLat: latitude,
      checkOutLng: longitude,
      ...(notes && { notes }),
    },
    include: { employee: true },
  });

  await prisma.log.create({
    data: {
      userId,
      action: 'CHECK_OUT',
      description: `${employee.fullName} check-out pada ${now.toISOString()}`,
    },
  });

  return updated;
};

const getTodayStatus = async (userId) => {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw { statusCode: 404, message: 'Data karyawan tidak ditemukan' };

  const todayWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  const dateOnly = new Date(todayWIB.toISOString().split('T')[0]);

  const attendance = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
  });

  return attendance;
};

const getMyAttendance = async (userId, { page = 1, limit = 10, startDate, endDate }) => {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw { statusCode: 404, message: 'Data karyawan tidak ditemukan' };

  const where = {
    employeeId: employee.id,
    ...(startDate && endDate && {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    }),
  };

  const [total, data] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getAllAttendance = async ({ page = 1, limit = 10, search, startDate, endDate, status }) => {
  const where = {
    ...(status && { status }),
    ...(startDate && endDate && {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    }),
    ...(search && {
      employee: {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { employeeCode: { contains: search, mode: 'insensitive' } },
        ],
      },
    }),
  };

  const [total, data] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
  ]);

  return {
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const createLeave = async (userId, type, notes) => {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw { statusCode: 404, message: 'Data karyawan tidak ditemukan' };

  const todayWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  const dateOnly = new Date(todayWIB.toISOString().split('T')[0]);

  const existing = await prisma.attendance.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date: dateOnly } },
  });
  if (existing) throw { statusCode: 409, message: 'Anda sudah memiliki catatan absensi hari ini' };

  const status = type.toUpperCase(); // 'IZIN' atau 'SAKIT'
  const attendance = await prisma.attendance.create({
    data: {
      employeeId: employee.id,
      date: dateOnly,
      status,
      notes,
    },
    include: { employee: true },
  });

  await prisma.log.create({
    data: {
      userId,
      action: 'LEAVE',
      description: `${employee.fullName} mengajukan ${type} hari ini`,
    },
  });

  return attendance;
};

module.exports = { checkIn, checkOut, getTodayStatus, getMyAttendance, getAllAttendance, createLeave };
