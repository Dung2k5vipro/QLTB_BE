const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');
const jwtConfig = require('../configs/jwt.config');
const userRepository = require('../repositories/user.repository');
const roleRepository = require('../repositories/role.repository');
const donViRepository = require('../repositories/donVi.repository');
const { writeAuditLog } = require('./auditLog.service');

const ACTIVE_STATUS = 'ACTIVE';
const SALT_ROUNDS = 10;

const toPublicUser = (user) => {
  if (!user) return null;

  return {
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
  };
};

const normalizeStatus = (status) => String(status || '').trim().toUpperCase();

const buildTokenPayload = (user) => ({
  nguoi_dung_id: user.nguoi_dung_id,
  ten_dang_nhap: user.ten_dang_nhap,
  vai_tro_id: user.vai_tro_id,
  vai_tro: String(user.ma_vai_tro || user.ten_vai_tro || '').trim().toUpperCase(),
  don_vi_id: user.don_vi_id,
});

const login = async (credentials, context = {}) => {
  const user = await userRepository.findAuthByUsername(credentials.ten_dang_nhap);

  if (!user) {
    await writeAuditLog({
      nguoi_dung_id: null,
      module: 'AUTH',
      hanh_dong: 'LOGIN_FAILED',
      entity_name: 'nguoi_dung',
      entity_id: null,
      du_lieu_moi: {
        ten_dang_nhap: credentials.ten_dang_nhap,
      },
      ghi_chu: 'Sai t?n ??ng nh?p ho?c m?t kh?u',
      ip_address: context.ipAddress,
    });

    throw new AppError('Ten dang nhap ho?c m?t kh?u khong dung', 401);
  }

  const matched = await bcrypt.compare(credentials.mat_khau, user.mat_khau_hash || '');
  if (!matched) {
    await writeAuditLog({
      nguoi_dung_id: user.nguoi_dung_id,
      module: 'AUTH',
      hanh_dong: 'LOGIN_FAILED',
      entity_name: 'nguoi_dung',
      entity_id: user.nguoi_dung_id,
      ghi_chu: 'Sai t?n ??ng nh?p ho?c m?t kh?u',
      ip_address: context.ipAddress,
    });

    throw new AppError('Ten dang nhap ho?c m?t kh?u khong dung', 401);
  }

  const accountStatus = normalizeStatus(user.trang_thai_tai_khoan);
  if (accountStatus !== ACTIVE_STATUS) {
    await writeAuditLog({
      nguoi_dung_id: user.nguoi_dung_id,
      module: 'AUTH',
      hanh_dong: 'LOGIN_FAILED',
      entity_name: 'nguoi_dung',
      entity_id: user.nguoi_dung_id,
      ghi_chu: `T?i kho?n o tr?ng th?i ${accountStatus}`,
      ip_address: context.ipAddress,
    });

    throw new AppError('T?i kho?n ?ang b? kh?a ho?c ng?ng ho?t ??ng', 403);
  }

  const token = jwt.sign(buildTokenPayload(user), jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm,
  });

  await writeAuditLog({
    nguoi_dung_id: user.nguoi_dung_id,
    module: 'AUTH',
    hanh_dong: 'LOGIN_SUCCESS',
    entity_name: 'nguoi_dung',
    entity_id: user.nguoi_dung_id,
    ghi_chu: '??ng nh?p th?nh c?ng',
    ip_address: context.ipAddress,
  });

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: jwtConfig.expiresIn,
    user: toPublicUser(user),
  };
};

const getCurrentUser = async (nguoiDungId) => {
  const user = await userRepository.findById(nguoiDungId);

  if (!user) {
    throw new AppError('Kh?ng t?m th?y ng??i d?ng', 404);
  }

  return toPublicUser(user);
};

const logout = async (reqUser, context = {}) => {
  await writeAuditLog({
    nguoi_dung_id: reqUser.nguoi_dung_id,
    module: 'AUTH',
    hanh_dong: 'LOGOUT',
    entity_name: 'nguoi_dung',
    entity_id: reqUser.nguoi_dung_id,
    ghi_chu: '??ng xu?t',
    ip_address: context.ipAddress,
  });

  return {
    message: '??ng xu?t th?nh c?ng',
  };
};

const changePassword = async (nguoiDungId, payload, context = {}) => {
  const user = await userRepository.findAuthById(nguoiDungId);
  if (!user) {
    throw new AppError('Kh?ng t?m th?y ng??i d?ng', 404);
  }

  const matchedCurrentPassword = await bcrypt.compare(payload.mat_khau_hien_tai, user.mat_khau_hash || '');
  if (!matchedCurrentPassword) {
    throw new AppError('mat_khau_hien_tai khong dung', 400);
  }

  const matchedOldPassword = await bcrypt.compare(payload.mat_khau_moi, user.mat_khau_hash || '');
  if (matchedOldPassword) {
    throw new AppError('mat_khau_moi kh?ng ???c tr?ng v?i mat_khau_hien_tai', 400);
  }

  const newPasswordHash = await bcrypt.hash(payload.mat_khau_moi, SALT_ROUNDS);
  await userRepository.updatePasswordHash(nguoiDungId, newPasswordHash);

  await writeAuditLog({
    nguoi_dung_id: nguoiDungId,
    module: 'AUTH',
    hanh_dong: 'CHANGE_PASSWORD',
    entity_name: 'nguoi_dung',
    entity_id: nguoiDungId,
    ghi_chu: 'Ng??i d?ng doi m?t kh?u',
    ip_address: context.ipAddress,
  });

  return {
    message: '??i m?t kh?u th?nh c?ng',
  };
};

const bootstrapAdmin = async (payload, context = {}) => {
  const bootstrapKey = process.env.BOOTSTRAP_ADMIN_KEY;

  if (!bootstrapKey) {
    throw new AppError('Bootstrap admin ?ang t?t. C?n c?u h?nh BOOTSTRAP_ADMIN_KEY trong .env', 403);
  }

  if (payload.bootstrap_key !== bootstrapKey) {
    throw new AppError('bootstrap_key kh?ng h?p l?', 403);
  }

  const adminRole = await roleRepository.findAdminRole();
  if (!adminRole) {
    throw new AppError('Kh?ng t?m th?y role ADMIN trong b?ng vai_tro', 400);
  }

  const totalAdminUsers = await userRepository.countUsersByRoleId(adminRole.vai_tro_id);
  if (totalAdminUsers > 0) {
    throw new AppError('He thong da co t?i kho?n admin, kh?ng th? bootstrap lai', 409);
  }

  if (await userRepository.existsByUsername(payload.ten_dang_nhap)) {
    throw new AppError('ten_dang_nhap ?? t?n t?i', 409);
  }

  if (payload.email && await userRepository.existsByEmail(payload.email)) {
    throw new AppError('email ?? t?n t?i', 409);
  }

  if (payload.so_dien_thoai && await userRepository.existsByPhone(payload.so_dien_thoai)) {
    throw new AppError('so_dien_thoai ?? t?n t?i', 409);
  }

  if (payload.don_vi_id !== null && payload.don_vi_id !== undefined) {
    const donVi = await donViRepository.findById(payload.don_vi_id);
    if (!donVi) {
      throw new AppError('don_vi_id kh?ng t?n t?i', 400);
    }
  }

  const passwordHash = await bcrypt.hash(payload.mat_khau, SALT_ROUNDS);

  const createdUserId = await userRepository.createUser({
    vai_tro_id: adminRole.vai_tro_id,
    don_vi_id: payload.don_vi_id ?? null,
    ten_dang_nhap: payload.ten_dang_nhap,
    mat_khau_hash: passwordHash,
    ho_ten: payload.ho_ten,
    email: payload.email ?? null,
    so_dien_thoai: payload.so_dien_thoai ?? null,
    trang_thai_tai_khoan: ACTIVE_STATUS,
    ghi_chu: payload.ghi_chu ?? 'Kh?i t?o admin t? h? th?ng',
  });

  const user = await userRepository.findAuthById(createdUserId);
  if (!user) {
    throw new AppError('Kh?ng th? tao t?i kho?n admin', 500);
  }

  const token = jwt.sign(buildTokenPayload(user), jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    algorithm: jwtConfig.algorithm,
  });

  await writeAuditLog({
    nguoi_dung_id: createdUserId,
    module: 'AUTH',
    hanh_dong: 'BOOTSTRAP_ADMIN',
    entity_name: 'nguoi_dung',
    entity_id: createdUserId,
    du_lieu_moi: {
      nguoi_dung_id: createdUserId,
      ten_dang_nhap: user.ten_dang_nhap,
      vai_tro_id: user.vai_tro_id,
    },
    ghi_chu: 'T?o t?i kho?n admin ??u ti?n thong qua bootstrap API',
    ip_address: context.ipAddress,
  });

  return {
    access_token: token,
    token_type: 'Bearer',
    expires_in: jwtConfig.expiresIn,
    user: toPublicUser(user),
  };
};

module.exports = {
  login,
  getCurrentUser,
  logout,
  changePassword,
  bootstrapAdmin,
};


