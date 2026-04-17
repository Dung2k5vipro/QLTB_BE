const AppError = require('../utils/appError');

const SORT_FIELDS = ['created_at', 'updated_at', 'ma_vai_tro', 'ten_vai_tro', 'is_active'];
const SORT_ORDERS = ['ASC', 'DESC'];
const CREATE_FIELDS = ['ma_vai_tro', 'ten_vai_tro', 'mo_ta'];
const UPDATE_FIELDS = ['ma_vai_tro', 'ten_vai_tro', 'mo_ta'];

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const requireObject = (value, message = 'Dđ liđu khđng hđp lđ') => {
  if (!isObject(value)) {
    throw new AppError(message, 400);
  }
};

const assertOnlyAllowedKeys = (payload, allowedFields) => {
  const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (invalidFields.length) {
    throw new AppError(`Không hỗ trợ trường: ${invalidFields.join(', ')}`, 400);
  }
};

const ensureAtLeastOneField = (payload, fields, message) => {
  const hasAnyField = fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (!hasAnyField) {
    throw new AppError(message, 400);
  }
};

const toPositiveInt = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} phải là số nguyên dương`, 400);
  }

  return parsed;
};

const toNonEmptyString = (value, fieldName, maxLength = 255, { toUpperCase = false } = {}) => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phải là chuỗi`, 400);
  }

  let normalized = value.trim();
  if (!normalized) {
    throw new AppError(`${fieldName} khđng đđc đ trđng`, 400);
  }
  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vđđt quđ đ dđi tđi a ${maxLength}`, 400);
  }

  if (toUpperCase) normalized = normalized.toUpperCase();
  return normalized;
};

const toNullableString = (value, fieldName, maxLength = 500) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phải là chuỗi`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vđđt quđ đ dđi tđi a ${maxLength}`, 400);
  }

  return normalized;
};

const toIsActiveFlag = (value, fieldName = 'is_active') => {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') {
    if (value === 1) return 1;
    if (value === 0) return 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') return 1;
    if (normalized === '0' || normalized === 'false') return 0;
  }

  throw new AppError(`${fieldName} phđi lđ boolean`, 400);
};

const roleIdParam = {
  params: (params) => {
    requireObject(params, 'Dđ liđu params khđng hđp lđ');
    return {
      id: toPositiveInt(params.id, 'id'),
    };
  },
};

const getRoleQuery = {
  query: (query) => {
    requireObject(query, 'Dđ liđu query khđng hđp lđ');
    assertOnlyAllowedKeys(query, ['page', 'limit', 'keyword', 'isActive', 'sortBy', 'sortOrder']);

    const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
    const limit = query.limit === undefined ? 20 : toPositiveInt(query.limit, 'limit');
    if (limit > 100) {
      throw new AppError('limit tđi a lđ 100', 400);
    }

    const sortBy = query.sortBy ? toNonEmptyString(query.sortBy, 'sortBy', 64) : 'created_at';
    const sortOrder = query.sortOrder ? toNonEmptyString(query.sortOrder, 'sortOrder', 4, { toUpperCase: true }) : 'DESC';

    if (!SORT_FIELDS.includes(sortBy)) {
      throw new AppError(`sortBy chđ hđ trđ: ${SORT_FIELDS.join(', ')}`, 400);
    }
    if (!SORT_ORDERS.includes(sortOrder)) {
      throw new AppError('sortOrder chđ hđ trđ ASC hođc DESC', 400);
    }

    let isActive;
    if (query.isActive !== undefined) {
      isActive = toIsActiveFlag(query.isActive, 'isActive');
    }

    return {
      page,
      limit,
      keyword: query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined,
      isActive,
      sortBy,
      sortOrder,
    };
  },
};

const createRole = {
  body: (body) => {
    requireObject(body, 'Body khđng hđp lđ');
    assertOnlyAllowedKeys(body, CREATE_FIELDS);

    return {
      ma_vai_tro: toNonEmptyString(body.ma_vai_tro, 'ma_vai_tro', 50, { toUpperCase: true }),
      ten_vai_tro: toNonEmptyString(body.ten_vai_tro, 'ten_vai_tro', 255),
      mo_ta: toNullableString(body.mo_ta, 'mo_ta', 500),
      is_active: 1,
    };
  },
};

const updateRole = {
  body: (body) => {
    requireObject(body, 'Body khđng hđp lđ');
    assertOnlyAllowedKeys(body, UPDATE_FIELDS);
    ensureAtLeastOneField(body, UPDATE_FIELDS, 'Cđn đt nhđt 1 trđđng đ cập nhật');

    const payload = {};
    if (Object.prototype.hasOwnProperty.call(body, 'ma_vai_tro')) {
      payload.ma_vai_tro = toNonEmptyString(body.ma_vai_tro, 'ma_vai_tro', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_vai_tro')) {
      payload.ten_vai_tro = toNonEmptyString(body.ten_vai_tro, 'ten_vai_tro', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'mo_ta')) {
      payload.mo_ta = toNullableString(body.mo_ta, 'mo_ta', 500);
    }

    return payload;
  },
};

const updateRoleStatus = {
  body: (body) => {
    requireObject(body, 'Body khđng hđp lđ');
    assertOnlyAllowedKeys(body, ['is_active', 'isActive']);

    if (!Object.prototype.hasOwnProperty.call(body, 'is_active') && !Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      throw new AppError('is_active lđ bđt buđc', 400);
    }

    return {
      is_active: toIsActiveFlag(
        Object.prototype.hasOwnProperty.call(body, 'is_active') ? body.is_active : body.isActive,
        'is_active',
      ),
    };
  },
};

module.exports = {
  roleIdParam,
  getRoleQuery,
  createRole,
  updateRole,
  updateRoleStatus,
};

