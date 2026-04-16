const AppError = require('../utils/appError');

const ACCOUNT_STATUSES = ['ACTIVE', 'LOCKED', 'INACTIVE'];
const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'ho_ten', 'ten_dang_nhap', 'email'];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
const MIN_PASSWORD_LENGTH = 8;

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const requireObject = (value, message = 'Du lieu khong hop le') => {
  if (!isObject(value)) {
    throw new AppError(message, 400);
  }
};

const toNonEmptyString = (value, fieldName, maxLength = 255) => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phai la chuoi`, 400);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new AppError(`${fieldName} khong duoc de trong`, 400);
  }

  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vuot qua do dai toi da ${maxLength}`, 400);
  }

  return normalized;
};

const toNullableString = (value, fieldName, maxLength = 255) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phai la chuoi`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;

  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vuot qua do dai toi da ${maxLength}`, 400);
  }

  return normalized;
};

const toPositiveInt = (value, fieldName, { allowNull = false } = {}) => {
  if (value === undefined) return undefined;
  if (value === null && allowNull) return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} phai la so nguyen duong`, 400);
  }

  return parsed;
};

const toEmail = (value, fieldName = 'email') => {
  const normalized = toNullableString(value, fieldName, 255);

  if (normalized === undefined || normalized === null) return normalized;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new AppError(`${fieldName} khong dung dinh dang`, 400);
  }

  return normalized.toLowerCase();
};

const toPhone = (value, fieldName = 'so_dien_thoai') => {
  const normalized = toNullableString(value, fieldName, 20);

  if (normalized === undefined || normalized === null) return normalized;

  const phoneRegex = /^(0|\+84)\d{9,10}$/;
  if (!phoneRegex.test(normalized)) {
    throw new AppError(`${fieldName} khong dung dinh dang`, 400);
  }

  return normalized;
};

const ensureAtLeastOneField = (payload, fields, message) => {
  const hasAnyField = fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (!hasAnyField) {
    throw new AppError(message, 400);
  }
};

const assertOnlyAllowedKeys = (payload, allowedFields) => {
  const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));

  if (invalidFields.length) {
    throw new AppError(`Khong ho tro truong: ${invalidFields.join(', ')}`, 400);
  }
};

const userIdParam = {
  params: (params) => {
    requireObject(params, 'Params khong hop le');

    return {
      id: toPositiveInt(params.id, 'id'),
    };
  },
};

const createUser = {
  body: (body) => {
    requireObject(body, 'Body khong hop le');
    const allowedFields = ['ten_dang_nhap', 'mat_khau', 'ho_ten', 'email', 'so_dien_thoai', 'vai_tro_id', 'don_vi_id', 'ghi_chu'];
    assertOnlyAllowedKeys(body, allowedFields);

    const mat_khau = toNonEmptyString(body.mat_khau, 'mat_khau');
    if (mat_khau.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(`mat_khau phai co toi thieu ${MIN_PASSWORD_LENGTH} ky tu`, 400);
    }

    return {
      ten_dang_nhap: toNonEmptyString(body.ten_dang_nhap, 'ten_dang_nhap', 100),
      mat_khau,
      ho_ten: toNonEmptyString(body.ho_ten, 'ho_ten', 255),
      email: toEmail(body.email),
      so_dien_thoai: toPhone(body.so_dien_thoai),
      vai_tro_id: toPositiveInt(body.vai_tro_id, 'vai_tro_id'),
      don_vi_id: toPositiveInt(body.don_vi_id, 'don_vi_id', { allowNull: true }),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 1000),
    };
  },
};

const updateUser = {
  body: (body) => {
    requireObject(body, 'Body khong hop le');

    const allowedFields = ['ten_dang_nhap', 'ho_ten', 'email', 'so_dien_thoai', 'vai_tro_id', 'don_vi_id', 'ghi_chu'];
    assertOnlyAllowedKeys(body, allowedFields);
    ensureAtLeastOneField(body, allowedFields, 'Can it nhat 1 truong de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ten_dang_nhap')) {
      payload.ten_dang_nhap = toNonEmptyString(body.ten_dang_nhap, 'ten_dang_nhap', 100);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ho_ten')) {
      payload.ho_ten = toNonEmptyString(body.ho_ten, 'ho_ten', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      payload.email = toEmail(body.email);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'so_dien_thoai')) {
      payload.so_dien_thoai = toPhone(body.so_dien_thoai);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'vai_tro_id')) {
      payload.vai_tro_id = toPositiveInt(body.vai_tro_id, 'vai_tro_id');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'don_vi_id')) {
      payload.don_vi_id = toPositiveInt(body.don_vi_id, 'don_vi_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 1000);
    }

    return payload;
  },
};

const updateMyProfile = {
  body: (body) => {
    requireObject(body, 'Body khong hop le');

    const allowedFields = ['ho_ten', 'email', 'so_dien_thoai', 'ghi_chu'];
    assertOnlyAllowedKeys(body, allowedFields);
    ensureAtLeastOneField(body, allowedFields, 'Can it nhat 1 truong de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ho_ten')) {
      payload.ho_ten = toNonEmptyString(body.ho_ten, 'ho_ten', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      payload.email = toEmail(body.email);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'so_dien_thoai')) {
      payload.so_dien_thoai = toPhone(body.so_dien_thoai);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 1000);
    }

    return payload;
  },
};

const updateUserStatus = {
  body: (body) => {
    requireObject(body, 'Body khong hop le');
    assertOnlyAllowedKeys(body, ['trang_thai_tai_khoan', 'ly_do']);

    const trang_thai_tai_khoan = toNonEmptyString(body.trang_thai_tai_khoan, 'trang_thai_tai_khoan', 20).toUpperCase();

    if (!ACCOUNT_STATUSES.includes(trang_thai_tai_khoan)) {
      throw new AppError('trang_thai_tai_khoan khong hop le', 400);
    }

    return {
      trang_thai_tai_khoan,
      ly_do: toNullableString(body.ly_do, 'ly_do', 500),
    };
  },
};

const resetUserPassword = {
  body: (body) => {
    requireObject(body, 'Body khong hop le');
    assertOnlyAllowedKeys(body, ['mat_khau_moi']);

    const mat_khau_moi = toNonEmptyString(body.mat_khau_moi, 'mat_khau_moi');

    if (mat_khau_moi.length < MIN_PASSWORD_LENGTH) {
      throw new AppError(`mat_khau_moi phai co toi thieu ${MIN_PASSWORD_LENGTH} ky tu`, 400);
    }

    return {
      mat_khau_moi,
    };
  },
};

const getUsersQuery = {
  query: (query) => {
    requireObject(query, 'Query khong hop le');

    const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
    const limit = query.limit === undefined ? 20 : toPositiveInt(query.limit, 'limit');

    if (limit > 100) {
      throw new AppError('limit toi da la 100', 400);
    }

    const sortBy = query.sortBy ? toNonEmptyString(query.sortBy, 'sortBy', 50) : 'created_at';
    const normalizedSortOrder = query.sortOrder ? toNonEmptyString(query.sortOrder, 'sortOrder', 4).toUpperCase() : 'DESC';

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
      throw new AppError(`sortBy chi ho tro: ${ALLOWED_SORT_FIELDS.join(', ')}`, 400);
    }

    if (!ALLOWED_SORT_ORDERS.includes(normalizedSortOrder)) {
      throw new AppError('sortOrder chi ho tro ASC hoac DESC', 400);
    }

    const keyword = query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined;
    const vaiTroId = query.vaiTroId === undefined ? undefined : toPositiveInt(query.vaiTroId, 'vaiTroId');
    const donViId = query.donViId === undefined ? undefined : toPositiveInt(query.donViId, 'donViId');

    let trangThaiTaiKhoan;
    if (query.trangThaiTaiKhoan !== undefined) {
      trangThaiTaiKhoan = toNonEmptyString(query.trangThaiTaiKhoan, 'trangThaiTaiKhoan', 20).toUpperCase();
      if (!ACCOUNT_STATUSES.includes(trangThaiTaiKhoan)) {
        throw new AppError('trangThaiTaiKhoan khong hop le', 400);
      }
    }

    return {
      page,
      limit,
      keyword,
      vaiTroId,
      donViId,
      trangThaiTaiKhoan,
      sortBy,
      sortOrder: normalizedSortOrder,
    };
  },
};

module.exports = {
  userIdParam,
  createUser,
  updateUser,
  updateMyProfile,
  updateUserStatus,
  resetUserPassword,
  getUsersQuery,
};
