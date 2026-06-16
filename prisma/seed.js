// prisma/seed.js
// Seeder lengkap: roles + admin + 10 karyawan + data absensi Feb-Apr 2026

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ── HELPER FUNCTIONS ─────────────────────────────────────────────

/**
 * Buat tanggal dengan jam WIB tertentu (simpan sebagai UTC)
 */
const makeTime = (dateStr, hourWIB, minuteWIB = 0) => {
  // dateStr: 'YYYY-MM-DD', hourWIB: jam dalam WIB
  // UTC = WIB - 7 jam
  const utcHour = hourWIB - 7;
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCHours(utcHour < 0 ? utcHour + 24 : utcHour, minuteWIB, 0, 0);
  if (utcHour < 0) d.setUTCDate(d.getUTCDate() - 1);
  return d;
};

/**
 * Dapatkan semua hari kerja (Senin-Jumat) dalam rentang tanggal
 */
const getWorkdays = (startDate, endDate) => {
  const days = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0=Minggu, 6=Sabtu
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
};

/**
 * Random integer antara min dan max (inclusive)
 */
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Random boolean dengan probabilitas true
 */
const randBool = (probability = 0.5) => Math.random() < probability;

/**
 * Koordinat GPS MCC Malang (dengan sedikit variasi)
 */
const mccCoords = () => ({
  lat: -7.983908 + (Math.random() - 0.5) * 0.0002,
  lng: 112.621391 + (Math.random() - 0.5) * 0.0002,
});

/**
 * Generate status absensi berdasarkan profil karyawan
 * profile: 'rajin' | 'biasa' | 'sering_telat' | 'sering_izin'
 */
const generateAttendanceStatus = (profile) => {
  const r = Math.random();
  switch (profile) {
    case 'rajin':
      if (r < 0.85) return 'HADIR';
      if (r < 0.93) return 'TERLAMBAT';
      if (r < 0.97) return 'IZIN';
      return 'SAKIT';
    case 'sering_telat':
      if (r < 0.50) return 'HADIR';
      if (r < 0.80) return 'TERLAMBAT';
      if (r < 0.90) return 'IZIN';
      if (r < 0.95) return 'SAKIT';
      return 'ALPHA';
    case 'sering_izin':
      if (r < 0.55) return 'HADIR';
      if (r < 0.65) return 'TERLAMBAT';
      if (r < 0.85) return 'IZIN';
      if (r < 0.93) return 'SAKIT';
      return 'ALPHA';
    case 'biasa':
    default:
      if (r < 0.70) return 'HADIR';
      if (r < 0.82) return 'TERLAMBAT';
      if (r < 0.90) return 'IZIN';
      if (r < 0.96) return 'SAKIT';
      return 'ALPHA';
  }
};

/**
 * Generate jam check-in berdasarkan status
 */
const generateCheckInTime = (dateStr, status) => {
  if (status === 'IZIN' || status === 'SAKIT' || status === 'ALPHA') return null;
  if (status === 'HADIR') {
    // 07:00 - 07:59
    return makeTime(dateStr, 7, rand(0, 59));
  }
  // TERLAMBAT: 08:01 - 09:45
  const hour = randBool(0.6) ? 8 : 9;
  const min = hour === 8 ? rand(1, 59) : rand(0, 45);
  return makeTime(dateStr, hour, min);
};

/**
 * Generate jam check-out berdasarkan status
 */
const generateCheckOutTime = (dateStr, status, checkInTime) => {
  if (!checkInTime) return null;
  // 80% karyawan checkout, 20% lupa checkout
  if (!randBool(0.8)) return null;
  // Checkout 17:00 - 18:00
  const hour = rand(17, 18);
  const min = rand(0, 59);
  return makeTime(dateStr, hour, min);
};

// ── CATATAN ABSENSI ───────────────────────────────────────────────
const izinNotes = [
  'Keperluan keluarga mendadak',
  'Urusan keluarga',
  'Acara pernikahan saudara',
  'Mengurus administrasi kependudukan',
  'Izin keperluan pribadi',
];
const sakitNotes = [
  'Demam dan flu',
  'Sakit kepala berat',
  'Masuk angin',
  'Radang tenggorokan',
  'Tidak enak badan',
  'Perlu istirahat total',
];
const alphaNote = 'Tidak ada keterangan';
const randomNote = (arr) => arr[rand(0, arr.length - 1)];

// ── LIBUR NASIONAL Feb-Apr 2026 (perkiraan) ───────────────────────
const holidays2026 = new Set([
  '2026-02-28', // Isra Miraj (perkiraan)
  '2026-03-17', // Hari Raya Nyepi
  '2026-03-20', // Wafat Isa Al-Masih
  '2026-04-01', // Idul Fitri 1447 H
  '2026-04-02', // Idul Fitri 1447 H
  '2026-04-03', // Cuti Bersama
]);

// ── DATA KARYAWAN ─────────────────────────────────────────────────
const karyawanData = [
  // ─── KREATIF ───────────────────────────────────────────────────
  {
    email: 'budi.santoso@mcc.id',
    fullName: 'Budi Santoso',
    employeeCode: 'MCC-KRY-001',
    phone: '081200000001',
    department: 'Kreatif',
    position: 'Desainer Grafis',
    joinDate: new Date('2023-03-15'),
    profile: 'rajin',
  },
  {
    email: 'ahmad.fauzi@mcc.id',
    fullName: 'Ahmad Fauzi',
    employeeCode: 'MCC-KRY-002',
    phone: '081200000002',
    department: 'Kreatif',
    position: 'Fotografer',
    joinDate: new Date('2024-01-10'),
    profile: 'sering_telat',
  },
  {
    email: 'rizky.anwar@mcc.id',
    fullName: 'Rizky Anwar Hidayat',
    employeeCode: 'MCC-KRY-003',
    phone: '081200000003',
    department: 'Kreatif',
    position: 'Videografer',
    joinDate: new Date('2023-12-01'),
    profile: 'sering_telat',
  },
  {
    email: 'nurul.aini@mcc.id',
    fullName: 'Nurul Aini Safitri',
    employeeCode: 'MCC-KRY-004',
    phone: '081200000004',
    department: 'Kreatif',
    position: 'Ilustrator',
    joinDate: new Date('2023-07-15'),
    profile: 'rajin',
  },
  {
    email: 'bagas.pratama@mcc.id',
    fullName: 'Bagas Pratama Putra',
    employeeCode: 'MCC-KRY-005',
    phone: '081200000005',
    department: 'Kreatif',
    position: 'Motion Graphic Designer',
    joinDate: new Date('2024-01-02'),
    profile: 'biasa',
  },
  {
    email: 'laila.nurfadila@mcc.id',
    fullName: 'Laila Nurfadila',
    employeeCode: 'MCC-KRY-006',
    phone: '081200000006',
    department: 'Kreatif',
    position: 'Art Director',
    joinDate: new Date('2022-08-01'),
    profile: 'rajin',
  },

  // ─── IT ────────────────────────────────────────────────────────
  {
    email: 'sari.dewi@mcc.id',
    fullName: 'Sari Dewi Lestari',
    employeeCode: 'MCC-KRY-007',
    phone: '081200000007',
    department: 'IT',
    position: 'Web Developer',
    joinDate: new Date('2023-06-01'),
    profile: 'biasa',
  },
  {
    email: 'dedi.prasetyo@mcc.id',
    fullName: 'Dedi Prasetyo',
    employeeCode: 'MCC-KRY-008',
    phone: '081200000008',
    department: 'IT',
    position: 'Backend Developer',
    joinDate: new Date('2024-02-01'),
    profile: 'biasa',
  },
  {
    email: 'hendra.wijaya@mcc.id',
    fullName: 'Hendra Wijaya',
    employeeCode: 'MCC-KRY-009',
    phone: '081200000009',
    department: 'IT',
    position: 'UI/UX Designer',
    joinDate: new Date('2023-09-10'),
    profile: 'biasa',
  },
  {
    email: 'teguh.santoso@mcc.id',
    fullName: 'Teguh Santoso',
    employeeCode: 'MCC-KRY-010',
    phone: '081200000010',
    department: 'IT',
    position: 'Mobile Developer',
    joinDate: new Date('2023-04-01'),
    profile: 'rajin',
  },
  {
    email: 'ayu.wulandari@mcc.id',
    fullName: 'Ayu Wulandari',
    employeeCode: 'MCC-KRY-011',
    phone: '081200000011',
    department: 'IT',
    position: 'QA Engineer',
    joinDate: new Date('2024-03-15'),
    profile: 'sering_izin',
  },
  {
    email: 'fajar.kurniawan@mcc.id',
    fullName: 'Fajar Kurniawan',
    employeeCode: 'MCC-KRY-012',
    phone: '081200000012',
    department: 'IT',
    position: 'DevOps Engineer',
    joinDate: new Date('2022-10-01'),
    profile: 'biasa',
  },

  // ─── MARKETING ─────────────────────────────────────────────────
  {
    email: 'rina.kusuma@mcc.id',
    fullName: 'Rina Kusuma Wardani',
    employeeCode: 'MCC-KRY-013',
    phone: '081200000013',
    department: 'Marketing',
    position: 'Digital Marketing',
    joinDate: new Date('2023-08-20'),
    profile: 'rajin',
  },
  {
    email: 'diana.permata@mcc.id',
    fullName: 'Diana Permata Sari',
    employeeCode: 'MCC-KRY-014',
    phone: '081200000014',
    department: 'Marketing',
    position: 'Content Creator',
    joinDate: new Date('2024-03-01'),
    profile: 'rajin',
  },
  {
    email: 'wahyu.sugiarto@mcc.id',
    fullName: 'Wahyu Sugiarto',
    employeeCode: 'MCC-KRY-015',
    phone: '081200000015',
    department: 'Marketing',
    position: 'Brand Strategist',
    joinDate: new Date('2023-01-15'),
    profile: 'sering_telat',
  },
  {
    email: 'putri.amalia@mcc.id',
    fullName: 'Putri Amalia Zahra',
    employeeCode: 'MCC-KRY-016',
    phone: '081200000016',
    department: 'Marketing',
    position: 'Social Media Specialist',
    joinDate: new Date('2023-11-01'),
    profile: 'biasa',
  },
  {
    email: 'galih.prakoso@mcc.id',
    fullName: 'Galih Prakoso',
    employeeCode: 'MCC-KRY-017',
    phone: '081200000017',
    department: 'Marketing',
    position: 'SEO Specialist',
    joinDate: new Date('2024-01-20'),
    profile: 'biasa',
  },

  // ─── HR ────────────────────────────────────────────────────────
  {
    email: 'maya.putri@mcc.id',
    fullName: 'Maya Putri Rahayu',
    employeeCode: 'MCC-KRY-018',
    phone: '081200000018',
    department: 'HR',
    position: 'HR Specialist',
    joinDate: new Date('2022-11-15'),
    profile: 'sering_izin',
  },
  {
    email: 'fitra.ramadan@mcc.id',
    fullName: 'Fitra Ramadan',
    employeeCode: 'MCC-KRY-019',
    phone: '081200000019',
    department: 'HR',
    position: 'Administrasi',
    joinDate: new Date('2022-05-20'),
    profile: 'biasa',
  },
  {
    email: 'suci.rahmawati@mcc.id',
    fullName: 'Suci Rahmawati',
    employeeCode: 'MCC-KRY-020',
    phone: '081200000020',
    department: 'HR',
    position: 'Rekrutmen & Pelatihan',
    joinDate: new Date('2023-05-10'),
    profile: 'rajin',
  },
  {
    email: 'eko.budi@mcc.id',
    fullName: 'Eko Budi Prasetya',
    employeeCode: 'MCC-KRY-021',
    phone: '081200000021',
    department: 'HR',
    position: 'Payroll Specialist',
    joinDate: new Date('2022-03-01'),
    profile: 'rajin',
  },

  // ─── KEUANGAN ──────────────────────────────────────────────────
  {
    email: 'indah.permata@mcc.id',
    fullName: 'Indah Permata Dewi',
    employeeCode: 'MCC-KRY-022',
    phone: '081200000022',
    department: 'Keuangan',
    position: 'Akuntan',
    joinDate: new Date('2022-07-01'),
    profile: 'rajin',
  },
  {
    email: 'arief.hidayat@mcc.id',
    fullName: 'Arief Hidayat',
    employeeCode: 'MCC-KRY-023',
    phone: '081200000023',
    department: 'Keuangan',
    position: 'Finance Officer',
    joinDate: new Date('2023-02-01'),
    profile: 'biasa',
  },
  {
    email: 'nadia.khoirunnisa@mcc.id',
    fullName: 'Nadia Khoirunnisa',
    employeeCode: 'MCC-KRY-024',
    phone: '081200000024',
    department: 'Keuangan',
    position: 'Budget Analyst',
    joinDate: new Date('2024-01-15'),
    profile: 'sering_izin',
  },

  // ─── OPERASIONAL ───────────────────────────────────────────────
  {
    email: 'randi.setiawan@mcc.id',
    fullName: 'Randi Setiawan',
    employeeCode: 'MCC-KRY-025',
    phone: '081200000025',
    department: 'Operasional',
    position: 'Koordinator Event',
    joinDate: new Date('2023-04-15'),
    profile: 'biasa',
  },
  {
    email: 'fitri.handayani@mcc.id',
    fullName: 'Fitri Handayani',
    employeeCode: 'MCC-KRY-026',
    phone: '081200000026',
    department: 'Operasional',
    position: 'Office Manager',
    joinDate: new Date('2022-01-15'),
    profile: 'rajin',
  },
  {
    email: 'irwan.maulana@mcc.id',
    fullName: 'Irwan Maulana',
    employeeCode: 'MCC-KRY-027',
    phone: '081200000027',
    department: 'Operasional',
    position: 'Teknisi',
    joinDate: new Date('2022-09-01'),
    profile: 'sering_telat',
  },
  {
    email: 'dewi.anggraini@mcc.id',
    fullName: 'Dewi Anggraini',
    employeeCode: 'MCC-KRY-028',
    phone: '081200000028',
    department: 'Operasional',
    position: 'Resepsionis',
    joinDate: new Date('2023-10-01'),
    profile: 'rajin',
  },
  {
    email: 'yusuf.habibi@mcc.id',
    fullName: 'Yusuf Al-Habibi',
    employeeCode: 'MCC-KRY-029',
    phone: '081200000029',
    department: 'Operasional',
    position: 'Keamanan & Fasilitas',
    joinDate: new Date('2021-12-01'),
    profile: 'biasa',
  },
  {
    email: 'mega.silviana@mcc.id',
    fullName: 'Mega Silviana',
    employeeCode: 'MCC-KRY-030',
    phone: '081200000030',
    department: 'Operasional',
    position: 'Logistik',
    joinDate: new Date('2023-06-15'),
    profile: 'sering_izin',
  },
];

// ── MAIN SEED FUNCTION ────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('🌱 Memulai seeding database MCC Absensi...');
  console.log('━'.repeat(50));

  // ── 1. ROLES ──────────────────────────────────────────
  console.log('\n📝 [1/4] Membuat roles...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', description: 'Administrator & Supervisor MCC' },
  });

  const karyawanRole = await prisma.role.upsert({
    where: { name: 'karyawan' },
    update: {},
    create: { name: 'karyawan', description: 'Karyawan MCC' },
  });

  console.log('   ✅ Role admin & karyawan berhasil dibuat');

  // ── 2. ADMIN USER ─────────────────────────────────────
  console.log('\n👤 [2/4] Membuat akun admin...');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@mcc.id' },
    update: {},
    create: {
      email: 'admin@mcc.id',
      password: adminPassword,
      roleId: adminRole.id,
      isActive: true,
      employee: {
        create: {
          employeeCode: 'MCC-ADM-001',
          fullName: 'Administrator MCC',
          phone: '081234567890',
          department: 'Management',
          position: 'Supervisor',
          joinDate: new Date('2022-01-01'),
        },
      },
    },
  });

  console.log('   ✅ Admin: admin@mcc.id | Admin@123');

  // ── 3. KARYAWAN ───────────────────────────────────────
  console.log('\n👥 [3/4] Membuat 30 akun karyawan...');

  const defaultPass = await bcrypt.hash('Karyawan@123', 12);
  const createdEmployees = [];

  for (const emp of karyawanData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        password: defaultPass,
        roleId: karyawanRole.id,
        isActive: true,
        employee: {
          create: {
            employeeCode: emp.employeeCode,
            fullName: emp.fullName,
            phone: emp.phone,
            department: emp.department,
            position: emp.position,
            joinDate: emp.joinDate,
          },
        },
      },
      include: { employee: true },
    });

    createdEmployees.push({ ...user, profile: emp.profile });
    console.log(`   ✅ ${emp.fullName.padEnd(25)} | ${emp.department} - ${emp.position}`);
  }

  // ── 4. DATA ABSENSI (FEB - APR 2026) ─────────────────
  console.log('\n📅 [4/4] Mengisi data absensi Februari - April 2026...');

  const workdays = getWorkdays('2026-02-01', '2026-04-30');
  const activeWorkdays = workdays.filter((d) => !holidays2026.has(d));

  console.log(`   📆 Total hari kerja: ${activeWorkdays.length} hari`);
  console.log(`   🏖️  Libur nasional dilewati: ${workdays.length - activeWorkdays.length} hari`);

  let totalAttendance = 0;
  let totalHadir = 0;
  let totalTerlambat = 0;
  let totalIzin = 0;
  let totalSakit = 0;
  let totalAlpha = 0;

  for (const emp of createdEmployees) {
    const employee = emp.employee;
    if (!employee) continue;

    const employeeAttendance = [];

    for (const dateStr of activeWorkdays) {
      // Lewati jika karyawan belum join
      if (new Date(dateStr) < employee.joinDate) continue;

      const status = generateAttendanceStatus(emp.profile);
      const coords = mccCoords();

      const checkInTime = generateCheckInTime(dateStr, status);
      const checkOutTime = generateCheckOutTime(dateStr, status, checkInTime);

      let notes = null;
      if (status === 'IZIN') notes = randomNote(izinNotes);
      else if (status === 'SAKIT') notes = randomNote(sakitNotes);
      else if (status === 'ALPHA') notes = alphaNote;

      employeeAttendance.push({
        employeeId: employee.id,
        date: new Date(dateStr),
        checkInTime,
        checkOutTime,
        checkInLat: checkInTime ? coords.lat : null,
        checkInLng: checkInTime ? coords.lng : null,
        checkOutLat: checkOutTime ? mccCoords().lat : null,
        checkOutLng: checkOutTime ? mccCoords().lng : null,
        status,
        notes,
      });

      // Hitung statistik
      totalAttendance++;
      if (status === 'HADIR') totalHadir++;
      else if (status === 'TERLAMBAT') totalTerlambat++;
      else if (status === 'IZIN') totalIzin++;
      else if (status === 'SAKIT') totalSakit++;
      else if (status === 'ALPHA') totalAlpha++;
    }

    // Bulk insert per karyawan (skip duplikat yang sudah ada)
    let inserted = 0;
    for (const att of employeeAttendance) {
      try {
        await prisma.attendance.upsert({
          where: {
            employeeId_date: { employeeId: att.employeeId, date: att.date },
          },
          update: {},
          create: att,
        });
        inserted++;
      } catch (e) {
        // Skip jika sudah ada
      }
    }

    console.log(
      `   📊 ${employee.fullName.padEnd(25)} | ${inserted} records | profil: ${emp.profile}`
    );
  }

  // ── SUMMARY ───────────────────────────────────────────
  console.log('\n' + '━'.repeat(50));
  console.log('🎉 SEEDING SELESAI!');
  console.log('━'.repeat(50));
  console.log(`\n📈 Statistik Data Absensi:`);
  console.log(`   Total records : ${totalAttendance}`);
  console.log(`   ✅ Hadir      : ${totalHadir} (${Math.round(totalHadir/totalAttendance*100)}%)`);
  console.log(`   ⏰ Terlambat  : ${totalTerlambat} (${Math.round(totalTerlambat/totalAttendance*100)}%)`);
  console.log(`   📝 Izin       : ${totalIzin} (${Math.round(totalIzin/totalAttendance*100)}%)`);
  console.log(`   🤒 Sakit      : ${totalSakit} (${Math.round(totalSakit/totalAttendance*100)}%)`);
  console.log(`   ❌ Alpha      : ${totalAlpha} (${Math.round(totalAlpha/totalAttendance*100)}%)`);
  console.log('\n📋 Akun Login:');
  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │  Role     │ Email              │ Password    │');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log('   │  Admin    │ admin@mcc.id       │ Admin@123   │');
  console.log('   │  Karyawan │ budi.santoso@mcc.id│ Karyawan@123│');
  console.log('   │  Karyawan │ sari.dewi@mcc.id   │ Karyawan@123│');
  console.log('   │  + 8 karyawan lainnya          │ Karyawan@123│');
  console.log('   └─────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('\n❌ Seeding gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
