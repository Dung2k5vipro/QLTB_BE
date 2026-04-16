const AppError = require('../utils/appError');

const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const requireObject = (value, message = 'Du lieu khong hop le') => {
  if (!isObject(value)) {
    throw new AppError(message, 400);
  }
};

const assertOnlyAllowedKeys = (payload, allowedFields) => {
  const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (invalidFields.length) {
    throw new AppError(`Khong ho tro truong: ${invalidFields.join(', ')}`, 400);
  }
};

const ensureAtLeastOneField = (payload, fields, message) => {
  const hasAnyField = fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (!hasAnyField) {
    throw new AppError(message, 400);
  }
};

const normalizeStringValue = (
  value,
  fieldName,
  {
    maxLength = 255,
    allowNull = false,
    allowEmpty = false,
    toUpperCase = false,
    toLowerCase = false,
  } = {},
) => {
  if (value === undefined) return undefined;
  if (value === null) {
    if (allowNull) return null;
    throw new AppError(`${fieldName} khong duoc de trong`, 400);
  }
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phai la chuoi`, 400);
  }

  let normalized = value.trim();
  if (!normalized) {
    if (allowEmpty) return '';
    if (allowNull) return null;
    throw new AppError(`${fieldName} khong duoc de trong`, 400);
  }

  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vuot qua do dai toi da ${maxLength}`, 400);
  }

  if (toUpperCase) normalized = normalized.toUpperCase();
  if (toLowerCase) normalized = normalized.toLowerCase();

  return normalized;
};

const toNonEmptyString = (value, fieldName, maxLength = 255, options = {}) => {
  return normalizeStringValue(value, fieldName, {
    ...options,
    maxLength,
    allowNull: false,
    allowEmpty: false,
  });
};

const toNullableString = (value, fieldName, maxLength = 255, options = {}) => {
  if (value === undefined) return undefined;
  return normalizeStringValue(value, fieldName, {
    ...options,
    maxLength,
    allowNull: true,
    allowEmpty: false,
  });
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

const toNonNegativeInt = (value, fieldName, { allowNull = false } = {}) => {
  if (value === undefined) return undefined;
  if (value === null && allowNull) return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} phai la so nguyen khong am`, 400);
  }

  return parsed;
};

const toBoolean = (value, fieldName) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true') return true;
    if (normalized === '0' || normalized === 'false') return false;
  }

  throw new AppError(`${fieldName} phai la boolean`, 400);
};

const toIsActiveFlag = (value, fieldName = 'is_active') => {
  return toBoolean(value, fieldName) ? 1 : 0;
};

const toEmail = (value, fieldName = 'email') => {
  const normalized = toNullableString(value, fieldName, 255, { toLowerCase: true });
  if (normalized === undefined || normalized === null) return normalized;
  if (!EMAIL_REGEX.test(normalized)) {
    throw new AppError(`${fieldName} khong dung dinh dang`, 400);
  }

  return normalized;
};

const toPhone = (value, fieldName = 'so_dien_thoai') => {
  const normalized = toNullableString(value, fieldName, 20);
  if (normalized === undefined || normalized === null) return normalized;
  if (!PHONE_REGEX.test(normalized)) {
    throw new AppError(`${fieldName} khong dung dinh dang`, 400);
  }

  return normalized;
};

const buildIdParamValidator = (key = 'id') => {
  return {
    params: (params) => {
      requireObject(params, 'Params khong hop le');

      return {
        [key]: toPositiveInt(params[key], key),
      };
    },
  };
};

const parseCommonListQuery = (
  query,
  {
    allowedSortFields,
    defaultSortBy,
    defaultLimit = 20,
    maxLimit = 100,
  },
) => {
  requireObject(query, 'Query khong hop le');

  const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
  const limit = query.limit === undefined ? defaultLimit : toPositiveInt(query.limit, 'limit');

  if (limit > maxLimit) {
    throw new AppError(`limit toi da la ${maxLimit}`, 400);
  }

  const sortBy = query.sortBy ? toNonEmptyString(query.sortBy, 'sortBy', 64) : defaultSortBy;
  const sortOrder = query.sortOrder
    ? toNonEmptyString(query.sortOrder, 'sortOrder', 4).toUpperCase()
    : 'DESC';

  if (!allowedSortFields.includes(sortBy)) {
    throw new AppError(`sortBy chi ho tro: ${allowedSortFields.join(', ')}`, 400);
  }

  if (!ALLOWED_SORT_ORDERS.includes(sortOrder)) {
    throw new AppError('sortOrder chi ho tro ASC hoac DESC', 400);
  }

  const keyword = query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined;

  let isActive;
  if (query.isActive !== undefined) {
    isActive = toIsActiveFlag(query.isActive, 'isActive');
  }

  return {
    page,
    limit,
    keyword,
    isActive,
    sortBy,
    sortOrder,
  };
};

const buildStatusBodyValidator = () => {
  return {
    body: (body) => {
      requireObject(body, 'Body khong hop le');
      assertOnlyAllowedKeys(body, ['is_active', 'isActive']);

      const hasSnakeCase = Object.prototype.hasOwnProperty.call(body, 'is_active');
      const hasCamelCase = Object.prototype.hasOwnProperty.call(body, 'isActive');

      if (!hasSnakeCase && !hasCamelCase) {
        throw new AppError('is_active la bat buoc', 400);
      }

      return {
        is_active: toIsActiveFlag(hasSnakeCase ? body.is_active : body.isActive, 'is_active'),
      };
    },
  };
};

module.exports = {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  toPositiveInt,
  toNonNegativeInt,
  toBoolean,
  toIsActiveFlag,
  toEmail,
  toPhone,
  buildIdParamValidator,
  parseCommonListQuery,
  buildStatusBodyValidator,
};
