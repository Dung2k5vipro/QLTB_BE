const AppError = require('../utils/appError');

const SORT_FIELDS = ['created_at', 'module', 'hanh_dong', 'nguoi_dung_id'];
const SORT_ORDERS = ['ASC', 'DESC'];

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const requireObject = (value, message = 'D� li�u kh�ng h�p l�') => {
  if (!isObject(value)) {
    throw new AppError(message, 400);
  }
};

const assertOnlyAllowedKeys = (payload, allowedFields) => {
  const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (invalidFields.length) {
    throw new AppError(`Kh�ng h� tr� tr��ng: ${invalidFields.join(', ')}`, 400);
  }
};

const toPositiveInt = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} ph�i l� s� nguy�n d��ng`, 400);
  }

  return parsed;
};

const toNonEmptyString = (value, fieldName, maxLength = 255, { toUpperCase = false } = {}) => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} ph�i l� chu�i`, 400);
  }

  let normalized = value.trim();
  if (!normalized) {
    throw new AppError(`${fieldName} kh�ng ��c � tr�ng`, 400);
  }
  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} v��t qu� � d�i t�i a ${maxLength}`, 400);
  }

  if (toUpperCase) normalized = normalized.toUpperCase();
  return normalized;
};

const toDateOnly = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} ph�i theo �nh d�ng YYYY-MM-DD`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(`${fieldName} ph�i theo �nh d�ng YYYY-MM-DD`, 400);
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() + 1 !== month
    || parsed.getUTCDate() !== day
  ) {
    throw new AppError(`${fieldName} kh�ng h�p l�`, 400);
  }

  return normalized;
};

const nhatKyHeThongIdParam = {
  params: (params) => {
    requireObject(params, 'D� li�u params kh�ng h�p l�');
    return {
      id: toPositiveInt(params.id, 'id'),
    };
  },
};

const getNhatKyHeThongListQuery = {
  query: (query) => {
    requireObject(query, 'D� li�u query kh�ng h�p l�');
    assertOnlyAllowedKeys(query, [
      'page',
      'limit',
      'keyword',
      'module',
      'hanh_dong',
      'nguoi_dung_id',
      'tu_ngay',
      'den_ngay',
      'sortBy',
      'sortOrder',
    ]);

    const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
    const limit = query.limit === undefined ? 20 : toPositiveInt(query.limit, 'limit');
    if (limit > 100) {
      throw new AppError('limit t�i a l� 100', 400);
    }

    const sortBy = query.sortBy ? toNonEmptyString(query.sortBy, 'sortBy', 64) : 'created_at';
    const sortOrder = query.sortOrder ? toNonEmptyString(query.sortOrder, 'sortOrder', 4, { toUpperCase: true }) : 'DESC';
    if (!SORT_FIELDS.includes(sortBy)) {
      throw new AppError(`sortBy ch� h� tr�: ${SORT_FIELDS.join(', ')}`, 400);
    }
    if (!SORT_ORDERS.includes(sortOrder)) {
      throw new AppError('sortOrder ch� h� tr� ASC ho�c DESC', 400);
    }

    const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
    const denNgay = toDateOnly(query.den_ngay, 'den_ngay');
    if (tuNgay && denNgay && denNgay < tuNgay) {
      throw new AppError('den_ngay kh�ng ��c nh� h�n tu_ngay', 400);
    }

    return {
      page,
      limit,
      keyword: query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined,
      module: query.module ? toNonEmptyString(query.module, 'module', 100, { toUpperCase: true }) : undefined,
      hanh_dong: query.hanh_dong ? toNonEmptyString(query.hanh_dong, 'hanh_dong', 100, { toUpperCase: true }) : undefined,
      nguoi_dung_id: query.nguoi_dung_id !== undefined ? toPositiveInt(query.nguoi_dung_id, 'nguoi_dung_id') : undefined,
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      sortBy,
      sortOrder,
    };
  },
};

module.exports = {
  nhatKyHeThongIdParam,
  getNhatKyHeThongListQuery,
};
