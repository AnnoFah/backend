// src/services/employee.service.js

const prisma = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');
const { createClient } = require('@supabase/supabase-js');
const env = require('../config/env');

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const getAll = async ({ page = 1, limit = 10, search, department }) => {
  const where = {
    ...(search && {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ],
    }),
    ...(department && { department: { equals: department, mode: 'insensitive' } }),
  };

  const [total, data] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      include: { user: { select: { email: true, isActive: true, role: { select: { name: true } } } } },
      orderBy: { fullName: 'asc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    }),
  ]);

  return { data, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } };
};

const getById = async (id) => {
  const emp = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { email: true, isActive: true, role: true } } },
  });
  if (!emp) throw { statusCode: 404, message: 'Karyawan tidak ditemukan' };
  return emp;
};

const create = async ({ email, password, fullName, employeeCode, phone, department, position, joinDate }) => {
  // Cek email & kode sudah ada
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw { statusCode: 409, message: 'Email sudah digunakan' };

  const existingCode = await prisma.employee.findUnique({ where: { employeeCode } });
  if (existingCode) throw { statusCode: 409, message: 'Kode karyawan sudah digunakan' };

  const karyawanRole = await prisma.role.findUnique({ where: { name: 'karyawan' } });
  const hashed = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      roleId: karyawanRole.id,
      employee: {
        create: { employeeCode, fullName, phone, department, position, joinDate: new Date(joinDate) },
      },
    },
    include: { employee: true },
  });

  return user;
};

const update = async (id, data) => {
  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp) throw { statusCode: 404, message: 'Karyawan tidak ditemukan' };

  const updated = await prisma.employee.update({ where: { id }, data });
  return updated;
};

const toggleActive = async (id) => {
  const emp = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
  if (!emp) throw { statusCode: 404, message: 'Karyawan tidak ditemukan' };

  const updated = await prisma.user.update({
    where: { id: emp.userId },
    data: { isActive: !emp.user.isActive },
    include: { employee: true },
  });
  return updated;
};

const remove = async (id) => {
  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp) throw { statusCode: 404, message: 'Karyawan tidak ditemukan' };
  // Cascade delete via Prisma schema (onDelete: Cascade)
  await prisma.user.delete({ where: { id: emp.userId } });
};

const updateProfile = async (userId, data) => {
  const emp = await prisma.employee.findUnique({ where: { userId } });
  if (!emp) throw { statusCode: 404, message: 'Profile tidak ditemukan' };
  return prisma.employee.update({ where: { userId }, data });
};

const uploadAvatar = async (userId, file) => {
  const emp = await prisma.employee.findUnique({ where: { userId } });
  if (!emp) throw { statusCode: 404, message: 'Karyawan tidak ditemukan' };

  const fileName = `${emp.id}-${Date.now()}.${file.originalname.split('.').pop()}`;
  const { error } = await supabase.storage
    .from(env.SUPABASE_BUCKET)
    .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

  if (error) throw { statusCode: 500, message: 'Gagal upload foto: ' + error.message };

  const { data: urlData } = supabase.storage.from(env.SUPABASE_BUCKET).getPublicUrl(fileName);

  await prisma.employee.update({ where: { userId }, data: { avatarUrl: urlData.publicUrl } });
  return urlData.publicUrl;
};

module.exports = { getAll, getById, create, update, toggleActive, remove, updateProfile, uploadAvatar };
