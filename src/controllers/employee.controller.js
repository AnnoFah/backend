// src/controllers/employee.controller.js

const employeeService = require('../services/employee.service');
const { success, error, paginated } = require('../utils/response');

const getAllEmployees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department } = req.query;
    const result = await employeeService.getAll({ page: +page, limit: +limit, search, department });
    return paginated(res, result.data, result.pagination, 'Data karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const emp = await employeeService.getById(req.params.id);
    return success(res, emp, 'Data karyawan berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const emp = await employeeService.create(req.body);
    return success(res, emp, 'Karyawan berhasil ditambahkan', 201);
  } catch (err) {
    next(err);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const emp = await employeeService.update(req.params.id, req.body);
    return success(res, emp, 'Data karyawan berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const toggleEmployeeActive = async (req, res, next) => {
  try {
    const result = await employeeService.toggleActive(req.params.id);
    const status = result.isActive ? 'diaktifkan' : 'dinonaktifkan';
    return success(res, result, `Karyawan berhasil ${status}`);
  } catch (err) {
    next(err);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    await employeeService.remove(req.params.id);
    return success(res, null, 'Karyawan berhasil dihapus');
  } catch (err) {
    next(err);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const emp = await employeeService.getById(req.user.employee.id);
    return success(res, emp, 'Profil berhasil diambil');
  } catch (err) {
    next(err);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    // Karyawan hanya boleh update data tertentu
    const { fullName, phone } = req.body;
    const emp = await employeeService.updateProfile(req.user.id, { fullName, phone });
    return success(res, emp, 'Profil berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

const uploadMyAvatar = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'File gambar diperlukan', 400);
    const avatarUrl = await employeeService.uploadAvatar(req.user.id, req.file);
    return success(res, { avatarUrl }, 'Foto profil berhasil diperbarui');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  toggleEmployeeActive,
  deleteEmployee,
  getMyProfile,
  updateMyProfile,
  uploadMyAvatar,
};
