const AppError = require('../utils/appError');
const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  toPositiveInt,
  toIsActiveFlag,
  parseCommonListQuery,
  buildIdParamValidator,
  buildStatusBodyValidator,
} = require('./common.validation');

const LOAI_DON_VI_ENUMS = ['PHONG_HOC', 'PHONG_BAN', 'KHOI', 'KHOA', 'KHO', 'KHAC'];
const ALLOWED_SORT_FIELDS = ['created_at', 'updated_at', 'ma_don_vi', 'ten_don_vi', 'loai_don_vi'];
const ALLOWED_CREATE_FIELDS = ['ma_don_vi', 'ten_don_vi', 'loai_don_vi', 'parent_id', 'dia_diem', 'mo_ta'];
const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

const toLoaiDonVi = (value, fieldName = 'loai_don_vi') => {
  const normalized = toNonEmptyString(value, fieldName, 50, { toUpperCase: true });
  if (!LOAI_DON_VI_ENUMS.includes(normalized)) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }

  return normalized;
};

const toParentId = (value, fieldName = 'parent_id') => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (typeof value === 'string' && !value.trim()) {
    return null;
  }

  return toPositiveInt(value, fieldName, { allowNull: true });
};

const donViIdParam = buildIdParamValidator('id');

const getDonViQuery = {
  query: (query) => {
    const parsed = parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'created_at',
    });

    let loaiDonVi;
    if (query.loaiDonVi !== undefined) {
      loaiDonVi = toLoaiDonVi(query.loaiDonVi, 'loaiDonVi');
    }

    let parentId;
    if (query.parentId !== undefined) {
      parentId = toPositiveInt(query.parentId, 'parentId');
    }

    return {
      ...parsed,
      loaiDonVi,
      parentId,
    };
  },
};

const getDonViOptionsQuery = {
  query: (query) => {
    requireObject(query, 'Query không hợp lệ');

    const keyword = query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined;

    let isActive;
    if (query.isActive !== undefined) {
      isActive = toIsActiveFlag(query.isActive, 'isActive');
    }

    let loaiDonVi;
    if (query.loaiDonVi !== undefined) {
      loaiDonVi = toLoaiDonVi(query.loaiDonVi, 'loaiDonVi');
    }

    let parentId;
    if (query.parentId !== undefined) {
      parentId = toPositiveInt(query.parentId, 'parentId');
    }

    return {
      keyword,
      isActive,
      loaiDonVi,
      parentId,
    };
  },
};

const createDonVi = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_don_vi: toNonEmptyString(body.ma_don_vi, 'ma_don_vi', 50, { toUpperCase: true }),
      ten_don_vi: toNonEmptyString(body.ten_don_vi, 'ten_don_vi', 255),
      loai_don_vi: toLoaiDonVi(body.loai_don_vi),
      parent_id: toParentId(body.parent_id),
      dia_diem: toNullableString(body.dia_diem, 'dia_diem', 255),
      mo_ta: toNullableString(body.mo_ta, 'mo_ta', 255),
      is_active: 1,
    };
  },
};

const updateDonVi = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'Cần ít nhất 1 trường để cập nhật');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_don_vi')) {
      payload.ma_don_vi = toNonEmptyString(body.ma_don_vi, 'ma_don_vi', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_don_vi')) {
      payload.ten_don_vi = toNonEmptyString(body.ten_don_vi, 'ten_don_vi', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'loai_don_vi')) {
      payload.loai_don_vi = toLoaiDonVi(body.loai_don_vi);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'parent_id')) {
      payload.parent_id = toParentId(body.parent_id);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'dia_diem')) {
      payload.dia_diem = toNullableString(body.dia_diem, 'dia_diem', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'mo_ta')) {
      payload.mo_ta = toNullableString(body.mo_ta, 'mo_ta', 255);
    }

    return payload;
  },
};

const updateDonViStatus = buildStatusBodyValidator();

module.exports = {
  LOAI_DON_VI_ENUMS,
  donViIdParam,
  getDonViQuery,
  getDonViOptionsQuery,
  createDonVi,
  updateDonVi,
  updateDonViStatus,
};

