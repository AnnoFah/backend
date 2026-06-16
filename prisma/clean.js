// prisma/clean.js — hapus semua data karyawan & absensi (kecuali admin)
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('🗑️  Menghapus data lama...');

  const deleted = await prisma.$transaction([
    prisma.log.deleteMany({}),
    prisma.attendance.deleteMany({}),
    prisma.employee.deleteMany({}),
    prisma.user.deleteMany({ where: { email: { not: 'admin@mcc.id' } } }),
  ]);

  console.log(`✅ Log        : ${deleted[0].count} dihapus`);
  console.log(`✅ Absensi    : ${deleted[1].count} dihapus`);
  console.log(`✅ Employee   : ${deleted[2].count} dihapus`);
  console.log(`✅ User       : ${deleted[3].count} dihapus`);
  console.log('🎉 Database bersih! Siap untuk seed ulang.');
}

clean()
  .catch((e) => { console.error('❌ Gagal:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
