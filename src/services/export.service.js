// src/services/export.service.js
// Export data absensi ke Excel dan PDF

const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const prisma = require('../config/database');

const getAttendanceData = async (startDate, endDate, search) => {
  const where = {
    ...(startDate && endDate && {
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    }),
    ...(search && {
      employee: { fullName: { contains: search, mode: 'insensitive' } },
    }),
  };

  return prisma.attendance.findMany({
    where,
    include: {
      employee: {
        select: { fullName: true, employeeCode: true, department: true, position: true },
      },
    },
    orderBy: { date: 'desc' },
  });
};

const formatWIB = (date) => {
  if (!date) return '-';
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().replace('T', ' ').substring(0, 19);
};

const exportToExcel = async (startDate, endDate, search) => {
  const data = await getAttendanceData(startDate, endDate, search);

  const rows = data.map((a, i) => ({
    No: i + 1,
    'Kode Karyawan': a.employee.employeeCode,
    'Nama Lengkap': a.employee.fullName,
    Department: a.employee.department || '-',
    Jabatan: a.employee.position || '-',
    Tanggal: a.date.toISOString().split('T')[0],
    'Jam Masuk': formatWIB(a.checkInTime),
    'Jam Pulang': formatWIB(a.checkOutTime),
    Status: a.status,
    Catatan: a.notes || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Absensi');

  // Style header
  ws['!cols'] = [
    { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
    { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 20 },
  ];

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
};

const exportToPDF = async (res, startDate, endDate, search) => {
  const data = await getAttendanceData(startDate, endDate, search);

  const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=absensi-mcc-${Date.now()}.pdf`
  );
  doc.pipe(res);

  // Header
  doc.fontSize(18).font('Helvetica-Bold').text('Laporan Absensi Karyawan', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Malang Creative Center (MCC)', { align: 'center' });
  if (startDate && endDate)
    doc.text(`Periode: ${startDate} s/d ${endDate}`, { align: 'center' });
  doc.moveDown();

  // Table headers
  const headers = ['No', 'Kode', 'Nama', 'Dept', 'Tanggal', 'Jam Masuk', 'Jam Pulang', 'Status'];
  const colWidths = [25, 60, 120, 70, 70, 80, 80, 70];
  const startX = 40;
  let y = doc.y;

  doc.font('Helvetica-Bold').fontSize(9);
  let x = startX;
  headers.forEach((h, i) => {
    doc.rect(x, y, colWidths[i], 20).stroke().text(h, x + 3, y + 5, { width: colWidths[i] - 6 });
    x += colWidths[i];
  });

  // Table rows
  doc.font('Helvetica').fontSize(8);
  data.forEach((a, idx) => {
    y += 20;
    if (y > 520) { doc.addPage(); y = 40; }
    x = startX;
    const row = [
      String(idx + 1),
      a.employee.employeeCode,
      a.employee.fullName,
      a.employee.department || '-',
      a.date.toISOString().split('T')[0],
      formatWIB(a.checkInTime),
      formatWIB(a.checkOutTime),
      a.status,
    ];
    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], 18).stroke().text(cell, x + 3, y + 4, { width: colWidths[i] - 6 });
      x += colWidths[i];
    });
  });

  doc.moveDown().font('Helvetica').fontSize(8)
    .text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, startX);
  doc.end();
};

module.exports = { exportToExcel, exportToPDF };
