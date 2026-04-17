const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  toBoolean,
  toNonNegativeInt,
  parseCommonListQuery,
  buildIdParamValidator,
  buildStatusBodyValidator,
} = require('./common.validation');

const ALLOWED_SORT_FIELDS = ['trang_thai_thiet_bi_id', 'ma_trang_thai', 'ten_trang_thai', 'thu_tu_hien_thi'];
const ALLOWED_CREATE_FIELDS = ['ma_trang_thai', 'ten_trang_thai', 'is_terminal', 'mo_ta', 'thu_tu_hien_thi'];
const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

const trangThaiThietBiIdParam = buildIdParamValidator('id');

const getTrangThaiThietBiQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'thu_tu_hien_thi',
    });
  },
};

const createTrangThaiThietBi = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_trang_thai: toNonEmptyString(body.ma_trang_thai, 'ma_trang_thai', 50, { toUpperCase: true }),
      ten_trang_thai: toNonEmptyString(body.ten_trang_thai, 'ten_trang_thai', 100),
      is_terminal: Object.prototype.hasOwnProperty.call(body, 'is_terminal')
        ? toBoolean(body.is_terminal, 'is_terminal')
        : false,
      mo_ta: toNullableString(body.mo_ta, 'mo_ta', 255),
      thu_tu_hien_thi: Object.prototype.hasOwnProperty.call(body, 'thu_tu_hien_thi')
        ? toNonNegativeInt(body.thu_tu_hien_thi, 'thu_tu_hien_thi')
        : 0,
      is_active: 1,
    };
  },
};

const updateTrangThaiThietBi = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'C?n ?t nh?t 1 tr??ng de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_trang_thai')) {
      payload.ma_trang_thai = toNonEmptyString(body.ma_trang_thai, 'ma_trang_thai', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_trang_thai')) {
      payload.ten_trang_thai = toNonEmptyString(body.ten_trang_thai, 'ten_trang_thai', 100);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'is_terminal')) {
      payload.is_terminal = toBoolean(body.is_terminal, 'is_terminal');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'mo_ta')) {
      payload.mo_ta = toNullableString(body.mo_ta, 'mo_ta', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'thu_tu_hien_thi')) {
      payload.thu_tu_hien_thi = toNonNegativeInt(body.thu_tu_hien_thi, 'thu_tu_hien_thi');
    }

    return payload;
  },
};

const updateTrangThaiThietBiStatus = buildStatusBodyValidator();

module.exports = {
  trangThaiThietBiIdParam,
  getTrangThaiThietBiQuery,
  createTrangThaiThietBi,
  updateTrangThaiThietBi,
  updateTrangThaiThietBiStatus,
};

