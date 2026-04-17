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

const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'ma_ncc', 'ten_ncc'];
const ALLOWED_CREATE_FIELDS = [
  'ma_ncc',
  'ten_ncc',
  'nguoi_lien_he',
  'so_dien_thoai',
  'email',
  'dia_chi',
  'ma_so_thue',
  'ghi_chu',
];
const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

const nhaCungCapIdParam = buildIdParamValidator('id');

const getNhaCungCapQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'created_at',
    });
  },
};

const createNhaCungCap = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_ncc: toNonEmptyString(body.ma_ncc, 'ma_ncc', 50, { toUpperCase: true }),
      ten_ncc: toNonEmptyString(body.ten_ncc, 'ten_ncc', 200),
      nguoi_lien_he: toNullableString(body.nguoi_lien_he, 'nguoi_lien_he', 150),
      so_dien_thoai: toPhone(body.so_dien_thoai, 'so_dien_thoai'),
      email: toEmail(body.email, 'email'),
      dia_chi: toNullableString(body.dia_chi, 'dia_chi', 255),
      ma_so_thue: toNullableString(body.ma_so_thue, 'ma_so_thue', 50),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 255),
      is_active: 1,
    };
  },
};

const updateNhaCungCap = {
  body: (body) => {
    requireObject(body, 'Body kh?ng h?p l?');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'C?n ?t nh?t 1 tr??ng de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_ncc')) {
      payload.ma_ncc = toNonEmptyString(body.ma_ncc, 'ma_ncc', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_ncc')) {
      payload.ten_ncc = toNonEmptyString(body.ten_ncc, 'ten_ncc', 200);
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
    if (Object.prototype.hasOwnProperty.call(body, 'ma_so_thue')) {
      payload.ma_so_thue = toNullableString(body.ma_so_thue, 'ma_so_thue', 50);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 255);
    }

    return payload;
  },
};

const updateNhaCungCapStatus = buildStatusBodyValidator();

module.exports = {
  nhaCungCapIdParam,
  getNhaCungCapQuery,
  createNhaCungCap,
  updateNhaCungCap,
  updateNhaCungCapStatus,
};

