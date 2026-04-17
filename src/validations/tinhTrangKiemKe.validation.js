const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  parseCommonListQuery,
  buildIdParamValidator,
  buildStatusBodyValidator,
} = require('./common.validation');

const ALLOWED_SORT_FIELDS = ['tinh_trang_kiem_ke_id', 'ma_tinh_trang', 'ten_tinh_trang'];
const ALLOWED_CREATE_FIELDS = ['ma_tinh_trang', 'ten_tinh_trang', 'mo_ta'];
const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

const tinhTrangKiemKeIdParam = buildIdParamValidator('id');

const getTinhTrangKiemKeQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'tinh_trang_kiem_ke_id',
    });
  },
};

const createTinhTrangKiemKe = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_tinh_trang: toNonEmptyString(body.ma_tinh_trang, 'ma_tinh_trang', 50, { toUpperCase: true }),
      ten_tinh_trang: toNonEmptyString(body.ten_tinh_trang, 'ten_tinh_trang', 100),
      mo_ta: toNullableString(body.mo_ta, 'mo_ta', 255),
      is_active: 1,
    };
  },
};

const updateTinhTrangKiemKe = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'C?n ?t nh?t 1 tr??ng de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_tinh_trang')) {
      payload.ma_tinh_trang = toNonEmptyString(body.ma_tinh_trang, 'ma_tinh_trang', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_tinh_trang')) {
      payload.ten_tinh_trang = toNonEmptyString(body.ten_tinh_trang, 'ten_tinh_trang', 100);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'mo_ta')) {
      payload.mo_ta = toNullableString(body.mo_ta, 'mo_ta', 255);
    }

    return payload;
  },
};

const updateTinhTrangKiemKeStatus = buildStatusBodyValidator();

module.exports = {
  tinhTrangKiemKeIdParam,
  getTinhTrangKiemKeQuery,
  createTinhTrangKiemKe,
  updateTinhTrangKiemKe,
  updateTinhTrangKiemKeStatus,
};

