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

const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'ma_hang', 'ten_hang'];
const ALLOWED_CREATE_FIELDS = ['ma_hang', 'ten_hang', 'quoc_gia', 'website', 'ghi_chu'];
const ALLOWED_UPDATE_FIELDS = ['ma_hang', 'ten_hang', 'quoc_gia', 'website', 'ghi_chu'];

const hangSanXuatIdParam = buildIdParamValidator('id');

const getHangSanXuatQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'created_at',
    });
  },
};

const createHangSanXuat = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_hang: toNonEmptyString(body.ma_hang, 'ma_hang', 50, { toUpperCase: true }),
      ten_hang: toNonEmptyString(body.ten_hang, 'ten_hang', 150),
      quoc_gia: toNullableString(body.quoc_gia, 'quoc_gia', 100),
      website: toNullableString(body.website, 'website', 255),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 255),
      is_active: 1,
    };
  },
};

const updateHangSanXuat = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'C?n ?t nh?t 1 tr??ng de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_hang')) {
      payload.ma_hang = toNonEmptyString(body.ma_hang, 'ma_hang', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_hang')) {
      payload.ten_hang = toNonEmptyString(body.ten_hang, 'ten_hang', 150);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'quoc_gia')) {
      payload.quoc_gia = toNullableString(body.quoc_gia, 'quoc_gia', 100);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'website')) {
      payload.website = toNullableString(body.website, 'website', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 255);
    }

    return payload;
  },
};

const updateHangSanXuatStatus = buildStatusBodyValidator();

module.exports = {
  hangSanXuatIdParam,
  getHangSanXuatQuery,
  createHangSanXuat,
  updateHangSanXuat,
  updateHangSanXuatStatus,
};

