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

const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'ma_loai', 'ma_viet_tat', 'ten_loai'];
const ALLOWED_CREATE_FIELDS = ['ma_loai', 'ma_viet_tat', 'ten_loai', 'mo_ta'];
const ALLOWED_UPDATE_FIELDS = ['ma_loai', 'ma_viet_tat', 'ten_loai', 'mo_ta'];

const loaiThietBiIdParam = buildIdParamValidator('id');

const getLoaiThietBiQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'created_at',
    });
  },
};

const createLoaiThietBi = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_loai: toNonEmptyString(body.ma_loai, 'ma_loai', 50, { toUpperCase: true }),
      ma_viet_tat: toNonEmptyString(body.ma_viet_tat, 'ma_viet_tat', 10, { toUpperCase: true }),
      ten_loai: toNonEmptyString(body.ten_loai, 'ten_loai', 150),
      mo_ta: toNullableString(body.mo_ta, 'mo_ta', 255),
      is_active: 1,
    };
  },
};

const updateLoaiThietBi = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'Cần ít nhất 1 trường để cập nhật');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_loai')) {
      payload.ma_loai = toNonEmptyString(body.ma_loai, 'ma_loai', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ma_viet_tat')) {
      payload.ma_viet_tat = toNonEmptyString(body.ma_viet_tat, 'ma_viet_tat', 10, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_loai')) {
      payload.ten_loai = toNonEmptyString(body.ten_loai, 'ten_loai', 150);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'mo_ta')) {
      payload.mo_ta = toNullableString(body.mo_ta, 'mo_ta', 255);
    }

    return payload;
  },
};

const updateLoaiThietBiStatus = buildStatusBodyValidator();

module.exports = {
  loaiThietBiIdParam,
  getLoaiThietBiQuery,
  createLoaiThietBi,
  updateLoaiThietBi,
  updateLoaiThietBiStatus,
};


