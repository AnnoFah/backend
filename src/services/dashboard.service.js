// src/services/dashboard.service.js

const prisma = require('../config/database');

const getTodaySummary = async () => {
  const todayWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  const dateOnly = new Date(todayWIB.toISOString().split('T')[0]);

  const [totalKaryawan, hadir, terlambat, izin, sakit] = await Promise.all([
    prisma.employee.count({ where: { user: { isActive: true } } }),
    prisma.attendance.count({ where: { date: dateOnly, status: 'HADIR' } }),
    prisma.attendance.count({ where: { date: dateOnly, status: 'TERLAMBAT' } }),
    prisma.attendance.count({ where: { date: dateOnly, status: 'IZIN' } }),
    prisma.attendance.count({ where: { date: dateOnly, status: 'SAKIT' } }),
  ]);

  const totalHadir = hadir + terlambat;
  const alpha = totalKaryawan - totalHadir - izin - sakit;

  return {
    date: dateOnly,
    totalKaryawan,
    hadir,
    terlambat,
    izin,
    sakit,
    alpha: alpha < 0 ? 0 : alpha,
    totalHadir,
  };
};

const getMonthlyStats = async (year, month) => {
  const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const records = await prisma.attendance.groupBy({
    by: ['date', 'status'],
    where: { date: { gte: startDate, lt: endDate } },
    _count: { status: true },
    orderBy: { date: 'asc' },
  });

  // Transform ke format Chart.js friendly
  const grouped = {};
  records.forEach(({ date, status, _count }) => {
    const key = date.toISOString().split('T')[0];
    if (!grouped[key]) grouped[key] = { date: key, HADIR: 0, TERLAMBAT: 0, IZIN: 0, SAKIT: 0, ALPHA: 0 };
    grouped[key][status] = _count.status;
  });

  return Object.values(grouped);
};

const getLateEmployees = async (limit = 10) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const records = await prisma.attendance.groupBy({
    by: ['employeeId'],
    where: { status: 'TERLAMBAT', date: { gte: thirtyDaysAgo } },
    _count: { status: true },
    orderBy: { _count: { status: 'desc' } },
    take: limit,
  });

  const employeeIds = records.map((r) => r.employeeId);
  const employees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    select: { id: true, fullName: true, employeeCode: true, department: true, position: true },
  });

  return records.map((r) => {
    const emp = employees.find((e) => e.id === r.employeeId);
    return { ...emp, lateCount: r._count.status };
  });
};

module.exports = { getTodaySummary, getMonthlyStats, getLateEmployees };
