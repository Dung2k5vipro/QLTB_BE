const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  toNonNegativeInt,
  parseCommonListQuery,
  buildIdParamValidator,
  buildStatusBodyValidator,
} = require('./common.validation');

const ALLOWED_SORT_FIELDS = ['muc_do_uu_tien_id', 'ma_muc_do', 'ten_muc_do', 'muc_do_so'];
const ALLOWED_CREATE_FIELDS = ['ma_muc_do', 'ten_muc_do', 'muc_do_so', 'mo_ta'];
const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

const mucDoUuTienIdParam = buildIdParamValidator('id');

const getMucDoUuTienQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'muc_do_so',
    });
  },
};

const createMucDoUuTien = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_muc_do: toNonEmptyString(body.ma_muc_do, 'ma_muc_do', 50, { toUpperCase: true }),
      ten_muc_do: toNonEmptyString(body.ten_muc_do, 'ten_muc_do', 100),
      muc_do_so: toNonNegativeInt(body.muc_do_so, 'muc_do_so'),
      mo_ta: toNullableString(body.mo_ta, 'mo_ta', 255),
      is_active: 1,
    };
  },
};

const updateMucDoUuTien = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'Cần ít nhất 1 trường để cập nhật');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_muc_do')) {
      payload.ma_muc_do = toNonEmptyString(body.ma_muc_do, 'ma_muc_do', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_muc_do')) {
      payload.ten_muc_do = toNonEmptyString(body.ten_muc_do, 'ten_muc_do', 100);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'muc_do_so')) {
      payload.muc_do_so = toNonNegativeInt(body.muc_do_so, 'muc_do_so');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'mo_ta')) {
      payload.mo_ta = toNullableString(body.mo_ta, 'mo_ta', 255);
    }

    return payload;
  },
};

const updateMucDoUuTienStatus = buildStatusBodyValidator();

module.exports = {
  mucDoUuTienIdParam,
  getMucDoUuTienQuery,
  createMucDoUuTien,
  updateMucDoUuTien,
  updateMucDoUuTienStatus,
};

