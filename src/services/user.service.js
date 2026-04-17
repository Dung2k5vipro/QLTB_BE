const bcrypt = require('bcryptjs');

const AppError = require('../utils/appError');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const donViRepository = require('../repositories/donVi.repository');
const { writeAuditLog } = require('./auditLog.service');

const ACTIVE_STATUS = 'ACTIVE';
const SALT_ROUNDS = 10;

const normalizeRoleName = (roleName) => String(roleName || '').trim().toUpperCase();
const isAdminRole = ({ maVaiTro, tenVaiTro }) => {
  return normalizeRoleName(maVaiTro) === 'ADMIN' || normalizeRoleName(tenVaiTro) === 'ADMIN';
};

const toPublicUser = (user) => ({
  nguoi_dung_id: user.nguoi_dung_id,
  ten_dang_nhap: user.ten_dang_nhap,
  ho_ten: user.ho_ten,
  email: user.email,
  so_dien_thoai: user.so_dien_thoai,
  vai_tro_id: user.vai_tro_id,
  ma_vai_tro: user.ma_vai_tro,
  ten_vai_tro: user.ten_vai_tro,
  don_vi_id: user.don_vi_id,
  ten_don_vi: user.ten_don_vi,
  trang_thai_tai_khoan: user.trang_thai_tai_khoan,
  ghi_chu: user.ghi_chu,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const ensureUserExists = async (nguoiDungId) => {
  const user = await userRepository.findById(nguoiDungId);
  if (!user) {
    throw new AppError('Kh?ng t?m th?y ng??i d?ng', 404);
  }

  return user;
};

const ensureRoleExists = async (vaiTroId) => {
  const role = await roleRepository.findById(vaiTroId);
  if (!role) {
    throw new AppError('vai_tro_id kh?ng t?n t?i', 400);
  }

  return role;
};

const ensureDonViExists = async (donViId) => {
  if (donViId === null || donViId === undefined) return null;

  const donVi = await donViRepository.findById(donViId);
  if (!donVi) {
    throw new AppError('don_vi_id kh?ng t?n t?i', 400);
  }

  return donVi;
};

const ensureUniqueUserFields = async (payload, excludeUserId = null) => {
  if (payload.ten_dang_nhap) {
    const usernameExists = await userRepository.existsByUsername(payload.ten_dang_nhap, excludeUserId);
    if (usernameExists) {
      throw new AppError('ten_dang_nhap ?? t?n t?i', 409);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'email') && payload.email) {
    const emailExists = await userRepository.existsByEmail(payload.email, excludeUserId);
    if (emailExists) {
      throw new AppError('email ?? t?n t?i', 409);
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'so_dien_thoai') && payload.so_dien_thoai) {
    const phoneExists = await userRepository.existsByPhone(payload.so_dien_thoai, excludeUserId);
    if (phoneExists) {
      throw new AppError('so_dien_thoai ?? t?n t?i', 409);
    }
  }
};

const ensureNotDisableLastActiveAdmin = async ({ targetUser, nextRoleName, nextStatus }) => {
  const currentRoleName = targetUser.ten_vai_tro;
  const currentRoleCode = targetUser.ma_vai_tro;
  const currentStatus = String(targetUser.trang_thai_tai_khoan || '').toUpperCase();
  const normalizedNextStatus = String(nextStatus || currentStatus).toUpperCase();
  const normalizedNextRole = nextRoleName || { ma_vai_tro: currentRoleCode, ten_vai_tro: currentRoleName };

  const isCurrentAdmin = isAdminRole({
    maVaiTro: currentRoleCode,
    tenVaiTro: currentRoleName,
  });
  const isNextAdmin = isAdminRole({
    maVaiTro: normalizedNextRole.ma_vai_tro,
    tenVaiTro: normalizedNextRole.ten_vai_tro,
  });

  const adminRemoved = isCurrentAdmin && !isNextAdmin;
  const adminDisabled = isCurrentAdmin && currentStatus === ACTIVE_STATUS && normalizedNextStatus !== ACTIVE_STATUS;

  if (!adminRemoved && !adminDisabled) return;

  const otherActiveAdmins = await userRepository.countActiveAdminsExcludingUser(targetUser.nguoi_dung_id);
  if (otherActiveAdmins <= 0) {
    throw new AppError('Kh?ng th? v? hi?u h?a admin active cu?i c?ng', 400);
  }
};

const getMyProfile = async (nguoiDungId) => {
  const user = await ensureUserExists(nguoiDungId);
  return toPublicUser(user);
};

const updateMyProfile = async (nguoiDungId, payload, context = {}) => {
  const currentUser = await ensureUserExists(nguoiDungId);

  await ensureUniqueUserFields(payload, nguoiDungId);
  await userRepository.updateUserById(nguoiDungId, payload);

  const updatedUser = await ensureUserExists(nguoiDungId);

  await writeAuditLog({
    nguoi_dung_id: nguoiDungId,
    module: 'USER',
    hanh_dong: 'UPDATE_MY_PROFILE',
    entity_name: 'nguoi_dung',
    entity_id: nguoiDungId,
    du_lieu_cu: toPublicUser(currentUser),
    du_lieu_moi: toPublicUser(updatedUser),
    ghi_chu: 'C?p nh?t h? s? c? nh?n',
    ip_address: context.ipAddress,
  });

  return toPublicUser(updatedUser);
};

const getUsers = async (query) => {
  const [items, total] = await Promise.all([
    userRepository.findUsers(query),
    userRepository.countUsers(query),
  ]);

  return {
    items: items.map(toPublicUser),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
};

const createUser = async (actor, payload, context = {}) => {
  await ensureUniqueUserFields(payload);
  await ensureRoleExists(payload.vai_tro_id);
  await ensureDonViExists(payload.don_vi_id);

  const mat_khau_hash = await bcrypt.hash(payload.mat_khau, SALT_ROUNDS);
  const insertedId = await userRepository.createUser({
    ...payload,
    mat_khau_hash,
    trang_thai_tai_khoan: ACTIVE_STATUS,
  });

  const createdUser = await ensureUserExists(insertedId);

  await writeAuditLog({
    nguoi_dung_id: actor.nguoi_dung_id,
    module: 'USER',
    hanh_dong: 'CREATE_USER',
    entity_name: 'nguoi_dung',
    entity_id: insertedId,
    du_lieu_moi: toPublicUser(createdUser),
    ghi_chu: `Admin tao t?i kho?n ${createdUser.ten_dang_nhap}`,
    ip_address: context.ipAddress,
  });

  return toPublicUser(createdUser);
};

const getUserById = async (nguoiDungId) => {
  const user = await ensureUserExists(nguoiDungId);
  return toPublicUser(user);
};

const updateUser = async (actor, nguoiDungId, payload, context = {}) => {
  const currentUser = await ensureUserExists(nguoiDungId);

  await ensureUniqueUserFields(payload, nguoiDungId);

  let nextRoleName = {
    ma_vai_tro: currentUser.ma_vai_tro,
    ten_vai_tro: currentUser.ten_vai_tro,
  };
  if (Object.prototype.hasOwnProperty.call(payload, 'vai_tro_id')) {
    const role = await ensureRoleExists(payload.vai_tro_id);
    nextRoleName = {
      ma_vai_tro: role.ma_vai_tro,
      ten_vai_tro: role.ten_vai_tro,
    };
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'don_vi_id')) {
    await ensureDonViExists(payload.don_vi_id);
  }

  await ensureNotDisableLastActiveAdmin({
    targetUser: currentUser,
    nextRoleName,
  });

  await userRepository.updateUserById(nguoiDungId, payload);
  const updatedUser = await ensureUserExists(nguoiDungId);

  await writeAuditLog({
    nguoi_dung_id: actor.nguoi_dung_id,
    module: 'USER',
    hanh_dong: 'UPDATE_USER',
    entity_name: 'nguoi_dung',
    entity_id: nguoiDungId,
    du_lieu_cu: toPublicUser(currentUser),
    du_lieu_moi: toPublicUser(updatedUser),
    ghi_chu: `Admin cap nhat t?i kho?n ${updatedUser.ten_dang_nhap}`,
    ip_address: context.ipAddress,
  });

  return toPublicUser(updatedUser);
};

const updateUserStatus = async (actor, nguoiDungId, payload, context = {}) => {
  const currentUser = await ensureUserExists(nguoiDungId);

  await ensureNotDisableLastActiveAdmin({
    targetUser: currentUser,
    nextStatus: payload.trang_thai_tai_khoan,
  });

  await userRepository.updateAccountStatus(nguoiDungId, payload.trang_thai_tai_khoan);
  const updatedUser = await ensureUserExists(nguoiDungId);

  await writeAuditLog({
    nguoi_dung_id: actor.nguoi_dung_id,
    module: 'USER',
    hanh_dong: 'UPDATE_USER_STATUS',
    entity_name: 'nguoi_dung',
    entity_id: nguoiDungId,
    du_lieu_cu: {
      trang_thai_tai_khoan: currentUser.trang_thai_tai_khoan,
    },
    du_lieu_moi: {
      trang_thai_tai_khoan: updatedUser.trang_thai_tai_khoan,
      ly_do: payload.ly_do || null,
    },
    ghi_chu: payload.ly_do || 'C?p nh?t tr?ng th?i t?i kho?n',
    ip_address: context.ipAddress,
  });

  return toPublicUser(updatedUser);
};

const resetUserPassword = async (actor, nguoiDungId, payload, context = {}) => {
  const targetUser = await userRepository.findAuthById(nguoiDungId);
  if (!targetUser) {
    throw new AppError('Kh?ng t?m th?y ng??i d?ng', 404);
  }

  const isSamePassword = await bcrypt.compare(payload.mat_khau_moi, targetUser.mat_khau_hash || '');
  if (isSamePassword) {
    throw new AppError('mat_khau_moi kh?ng ???c tr?ng v?i mat_khau hi?n t?i', 400);
  }

  const passwordHash = await bcrypt.hash(payload.mat_khau_moi, SALT_ROUNDS);
  await userRepository.updatePasswordHash(nguoiDungId, passwordHash);

  await writeAuditLog({
    nguoi_dung_id: actor.nguoi_dung_id,
    module: 'USER',
    hanh_dong: 'RESET_PASSWORD',
    entity_name: 'nguoi_dung',
    entity_id: nguoiDungId,
    ghi_chu: `Admin reset m?t kh?u cho t?i kho?n ${targetUser.ten_dang_nhap}`,
    ip_address: context.ipAddress,
  });

  return {
    message: 'Reset m?t kh?u th?nh c?ng',
  };
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  resetUserPassword,
};


