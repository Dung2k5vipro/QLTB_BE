const AppError = require('../utils/appError');
const {
  requireObject,
  assertOnlyAllowedKeys,
  toPositiveInt,
} = require('./common.validation');

const toDateOnly = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phải theo định dạng YYYY-MM-DD`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(`${fieldName} phải theo định dạng YYYY-MM-DD`, 400);
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number(date.getUTCFullYear()) !== year
    || Number(date.getUTCMonth()) + 1 !== month
    || Number(date.getUTCDate()) !== day
  ) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }

  return normalized;
};

const getTongQuanQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['from_date', 'to_date', 'warranty_days', 'top_limit', 'months']);

    const fromDate = toDateOnly(query.from_date, 'from_date');
    const toDate = toDateOnly(query.to_date, 'to_date');

    if (fromDate && toDate && toDate < fromDate) {
      throw new AppError('to_date không được nhỏ hơn from_date', 400);
    }

    const warrantyDays = query.warranty_days === undefined
      ? undefined
      : toPositiveInt(query.warranty_days, 'warranty_days');
    const topLimit = query.top_limit === undefined
      ? undefined
      : toPositiveInt(query.top_limit, 'top_limit');
    const months = query.months === undefined
      ? undefined
      : toPositiveInt(query.months, 'months');

    if (warrantyDays !== undefined && warrantyDays > 3650) {
      throw new AppError('warranty_days tối đa là 3650', 400);
    }
    if (topLimit !== undefined && topLimit > 20) {
      throw new AppError('top_limit tối đa là 20', 400);
    }
    if (months !== undefined && months > 36) {
      throw new AppError('months tối đa là 36', 400);
    }

    return {
      from_date: fromDate,
      to_date: toDate,
      warranty_days: warrantyDays,
      top_limit: topLimit,
      months,
    };
  },
};

module.exports = {
  getTongQuanQuery,
};
