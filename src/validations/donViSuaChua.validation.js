const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  toEmail,
  toPhone,
  parseCommonListQuery,
  buildIdParamValidator,
  buildStatusBodyValidator,
} = require('./common.validation');

const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'ma_dvsc', 'ten_dvsc'];
const ALLOWED_CREATE_FIELDS = [
  'ma_dvsc',
  'ten_dvsc',
  'nguoi_lien_he',
  'so_dien_thoai',
  'email',
  'dia_chi',
  'ghi_chu',
];
const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

const donViSuaChuaIdParam = buildIdParamValidator('id');

const getDonViSuaChuaQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'created_at',
    });
  },
};

const createDonViSuaChua = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_dvsc: toNonEmptyString(body.ma_dvsc, 'ma_dvsc', 50, { toUpperCase: true }),
      ten_dvsc: toNonEmptyString(body.ten_dvsc, 'ten_dvsc', 200),
      nguoi_lien_he: toNullableString(body.nguoi_lien_he, 'nguoi_lien_he', 150),
      so_dien_thoai: toPhone(body.so_dien_thoai, 'so_dien_thoai'),
      email: toEmail(body.email, 'email'),
      dia_chi: toNullableString(body.dia_chi, 'dia_chi', 255),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 255),
      is_active: 1,
    };
  },
};

const updateDonViSuaChua = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'C?n ?t nh?t 1 tr??ng de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_dvsc')) {
      payload.ma_dvsc = toNonEmptyString(body.ma_dvsc, 'ma_dvsc', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_dvsc')) {
      payload.ten_dvsc = toNonEmptyString(body.ten_dvsc, 'ten_dvsc', 200);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nguoi_lien_he')) {
      payload.nguoi_lien_he = toNullableString(body.nguoi_lien_he, 'nguoi_lien_he', 150);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'so_dien_thoai')) {
      payload.so_dien_thoai = toPhone(body.so_dien_thoai, 'so_dien_thoai');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'email')) {
      payload.email = toEmail(body.email, 'email');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dia_chi')) {
      payload.dia_chi = toNullableString(body.dia_chi, 'dia_chi', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 255);
    }

    return payload;
  },
};

const updateDonViSuaChuaStatus = buildStatusBodyValidator();

module.exports = {
  donViSuaChuaIdParam,
  getDonViSuaChuaQuery,
  createDonViSuaChua,
  updateDonViSuaChua,
  updateDonViSuaChuaStatus,
};

