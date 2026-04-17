const AppError = require('../utils/appError');

const LOAI_XU_LY_VALUES = [
  'SUA_CHUA',
  'BAO_TRI_DINH_KY',
  'BAO_TRI_DOT_XUAT',
  'KHAC',
];

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const requireObject = (value, message = 'Dđ liđu gửi lđn khđng hđp lđ') => {
  if (!isObject(value)) {
    throw new AppError(message, 400);
  }
};

const assertOnlyAllowedKeys = (payload, allowedFields) => {
  const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (invalidFields.length) {
    throw new AppError(`Không hỗ trợ trường: ${invalidFields.join(', ')}`, 400);
  }
};

const toPositiveInt = (value, fieldName, { required = false, allowNull = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} lđ bđt buđc`, 400);
    }
    return undefined;
  }

  if (value === null) {
    if (allowNull) return null;
    throw new AppError(`${fieldName} phải là số nguyên dương`, 400);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} phải là số nguyên dương`, 400);
  }

  return parsed;
};

const toNonNegativeNumber = (value, fieldName, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} lđ bđt buđc`, 400);
    }
    return undefined;
  }

  if (value === null) {
    throw new AppError(`${fieldName} phải là số không âm`, 400);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} phải là số không âm`, 400);
  }

  return parsed;
};

const toNullableString = (value, fieldName, maxLength = 5000) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phải là chuỗi`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vđđt quđ đ dđi tđi a ${maxLength}`, 400);
  }

  return normalized;
};

const toDateTime = (value, fieldName, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} lđ bđt buđc`, 400);
    }
    return undefined;
  }
  if (value === null) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }

  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }

  return date;
};

const toDateOnly = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phđi theo đnh dđng YYYY-MM-DD`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(`${fieldName} phđi theo đnh dđng YYYY-MM-DD`, 400);
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() + 1 !== month
    || date.getUTCDate() !== day
  ) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }

  return normalized;
};

const toUpperEnum = (value, fieldName, allowedValues, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} lđ bđt buđc`, 400);
    }
    return undefined;
  }
  if (value === null || typeof value !== 'string') {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized || !allowedValues.includes(normalized)) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }

  return normalized;
};

const toKeyword = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError('keyword phải là chuỗi', 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 255) {
    throw new AppError('keyword vđđt quđ đ dđi tđi a 255', 400);
  }

  return normalized;
};

const toFlexibleJsonValue = (value, fieldName, { maxItems = 200 } = {}) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    if (value.length > maxItems) {
      throw new AppError(`${fieldName} vđđt quđ sđ lđđng phđn tđ tđi a ${maxItems}`, 400);
    }
    return value;
  }

  if (isObject(value)) return value;

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) return null;

    if (normalized.startsWith('[') || normalized.startsWith('{')) {
      try {
        const parsed = JSON.parse(normalized);
        if (Array.isArray(parsed) && parsed.length > maxItems) {
          throw new AppError(`${fieldName} vđđt quđ sđ lđđng phđn tđ tđi a ${maxItems}`, 400);
        }
        return parsed;
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError(`${fieldName} khđng hđp lđ`, 400);
      }
    }

    return [normalized];
  }

  throw new AppError(`${fieldName} khđng hđp lđ`, 400);
};

const normalizePagination = (query) => {
  const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
  const limit = query.limit === undefined ? 20 : toPositiveInt(query.limit, 'limit');

  if (limit > 100) {
    throw new AppError('limit tđi a lđ 100', 400);
  }

  return { page, limit };
};

const ensureDateRange = (tuNgay, denNgay) => {
  if (tuNgay && denNgay && denNgay < tuNgay) {
    throw new AppError('den_ngay khđng đđc nhđ hđn tu_ngay', 400);
  }
};

const nhatKyBaoTriIdParam = {
  params: (params) => {
    requireObject(params, 'Dđ liđu params khđng hđp lđ');
    return {
      id: toPositiveInt(params.id, 'id', { required: true }),
    };
  },
};

const thietBiIdParam = {
  params: (params) => {
    requireObject(params, 'Dđ liđu params khđng hđp lđ');
    return {
      thietBiId: toPositiveInt(params.thietBiId, 'thietBiId', { required: true }),
    };
  },
};

const phieuBaoHongIdParam = {
  params: (params) => {
    requireObject(params, 'Dđ liđu params khđng hđp lđ');
    return {
      phieuBaoHongId: toPositiveInt(params.phieuBaoHongId, 'phieuBaoHongId', { required: true }),
    };
  },
};

const parseCreatePayload = (body, { allowPhieuBaoHongId }) => {
  requireObject(body);
  assertOnlyAllowedKeys(body, [
    'thiet_bi_id',
    'phieu_bao_hong_id',
    'loai_xu_ly',
    'ngay_tiep_nhan',
    'noi_dung_xu_ly',
    'chi_phi',
    'phu_tung_thay_the',
    'don_vi_sua_chua_id',
    'ket_qua_xu_ly',
    'thuc_hien_boi_id',
  ]);

  const payload = {
    thiet_bi_id: toPositiveInt(body.thiet_bi_id, 'thiet_bi_id', { required: true }),
    phieu_bao_hong_id: toPositiveInt(body.phieu_bao_hong_id, 'phieu_bao_hong_id', { allowNull: true }),
    loai_xu_ly: toUpperEnum(body.loai_xu_ly, 'loai_xu_ly', LOAI_XU_LY_VALUES, { required: true }),
    ngay_tiep_nhan: toDateTime(body.ngay_tiep_nhan, 'ngay_tiep_nhan'),
    noi_dung_xu_ly: toNullableString(body.noi_dung_xu_ly, 'noi_dung_xu_ly', 10000),
    chi_phi: toNonNegativeNumber(body.chi_phi, 'chi_phi'),
    phu_tung_thay_the: toFlexibleJsonValue(body.phu_tung_thay_the, 'phu_tung_thay_the', { maxItems: 300 }),
    don_vi_sua_chua_id: toPositiveInt(body.don_vi_sua_chua_id, 'don_vi_sua_chua_id', { allowNull: true }),
    ket_qua_xu_ly: toNullableString(body.ket_qua_xu_ly, 'ket_qua_xu_ly', 5000),
    thuc_hien_boi_id: toPositiveInt(body.thuc_hien_boi_id, 'thuc_hien_boi_id', { allowNull: true }),
  };

  if (!allowPhieuBaoHongId && payload.phieu_bao_hong_id) {
    throw new AppError('API tiđp nhđn thđ cđng khđng nhđn phieu_bao_hong_id', 400);
  }

  return payload;
};

const createNhatKyBaoTri = {
  body: (body) => parseCreatePayload(body, { allowPhieuBaoHongId: true }),
};

const tiepNhanBaoTriThuCong = {
  body: (body) => parseCreatePayload(body, { allowPhieuBaoHongId: false }),
};

const getNhatKyBaoTriListQuery = {
  query: (query) => {
    requireObject(query, 'Dđ liđu query khđng hđp lđ');
    assertOnlyAllowedKeys(query, [
      'keyword',
      'thiet_bi_id',
      'phieu_bao_hong_id',
      'loai_xu_ly',
      'don_vi_sua_chua_id',
      'thuc_hien_boi_id',
      'tu_ngay',
      'den_ngay',
      'page',
      'limit',
    ]);

    const pagination = normalizePagination(query);
    const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
    const denNgay = toDateOnly(query.den_ngay, 'den_ngay');
    ensureDateRange(tuNgay, denNgay);

    return {
      keyword: toKeyword(query.keyword),
      thiet_bi_id: toPositiveInt(query.thiet_bi_id, 'thiet_bi_id'),
      phieu_bao_hong_id: toPositiveInt(query.phieu_bao_hong_id, 'phieu_bao_hong_id'),
      loai_xu_ly: toUpperEnum(query.loai_xu_ly, 'loai_xu_ly', LOAI_XU_LY_VALUES),
      don_vi_sua_chua_id: toPositiveInt(query.don_vi_sua_chua_id, 'don_vi_sua_chua_id'),
      thuc_hien_boi_id: toPositiveInt(query.thuc_hien_boi_id, 'thuc_hien_boi_id'),
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      ...pagination,
    };
  },
};

const getLichSuTheoThietBiQuery = {
  query: (query) => {
    requireObject(query, 'Dđ liđu query khđng hđp lđ');
    assertOnlyAllowedKeys(query, [
      'keyword',
      'loai_xu_ly',
      'don_vi_sua_chua_id',
      'thuc_hien_boi_id',
      'tu_ngay',
      'den_ngay',
      'page',
      'limit',
    ]);

    const pagination = normalizePagination(query);
    const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
    const denNgay = toDateOnly(query.den_ngay, 'den_ngay');
    ensureDateRange(tuNgay, denNgay);

    return {
      keyword: toKeyword(query.keyword),
      loai_xu_ly: toUpperEnum(query.loai_xu_ly, 'loai_xu_ly', LOAI_XU_LY_VALUES),
      don_vi_sua_chua_id: toPositiveInt(query.don_vi_sua_chua_id, 'don_vi_sua_chua_id'),
      thuc_hien_boi_id: toPositiveInt(query.thuc_hien_boi_id, 'thuc_hien_boi_id'),
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      ...pagination,
    };
  },
};

const getDanhSachTheoPhieuBaoHongQuery = {
  query: (query) => {
    requireObject(query, 'Dđ liđu query khđng hđp lđ');
    assertOnlyAllowedKeys(query, [
      'keyword',
      'loai_xu_ly',
      'don_vi_sua_chua_id',
      'thuc_hien_boi_id',
      'tu_ngay',
      'den_ngay',
      'page',
      'limit',
    ]);

    const pagination = normalizePagination(query);
    const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
    const denNgay = toDateOnly(query.den_ngay, 'den_ngay');
    ensureDateRange(tuNgay, denNgay);

    return {
      keyword: toKeyword(query.keyword),
      loai_xu_ly: toUpperEnum(query.loai_xu_ly, 'loai_xu_ly', LOAI_XU_LY_VALUES),
      don_vi_sua_chua_id: toPositiveInt(query.don_vi_sua_chua_id, 'don_vi_sua_chua_id'),
      thuc_hien_boi_id: toPositiveInt(query.thuc_hien_boi_id, 'thuc_hien_boi_id'),
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      ...pagination,
    };
  },
};

const updateNhatKyBaoTri = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, [
      'noi_dung_xu_ly',
      'chi_phi',
      'phu_tung_thay_the',
      'don_vi_sua_chua_id',
      'ket_qua_xu_ly',
      'ngay_hoan_thanh',
      'thuc_hien_boi_id',
    ]);

    const payload = {
      noi_dung_xu_ly: toNullableString(body.noi_dung_xu_ly, 'noi_dung_xu_ly', 10000),
      chi_phi: toNonNegativeNumber(body.chi_phi, 'chi_phi'),
      phu_tung_thay_the: toFlexibleJsonValue(body.phu_tung_thay_the, 'phu_tung_thay_the', { maxItems: 300 }),
      don_vi_sua_chua_id: toPositiveInt(body.don_vi_sua_chua_id, 'don_vi_sua_chua_id', { allowNull: true }),
      ket_qua_xu_ly: toNullableString(body.ket_qua_xu_ly, 'ket_qua_xu_ly', 5000),
      ngay_hoan_thanh: toDateTime(body.ngay_hoan_thanh, 'ngay_hoan_thanh'),
      thuc_hien_boi_id: toPositiveInt(body.thuc_hien_boi_id, 'thuc_hien_boi_id', { allowNull: true }),
    };

    const hasAnyField = Object.values(payload).some((value) => value !== undefined);
    if (!hasAnyField) {
      throw new AppError('Dđ liđu cập nhật khđng đđc rđng hođn tođn', 400);
    }

    return payload;
  },
};

const completeNhatKyBaoTri = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, [
      'noi_dung_xu_ly',
      'chi_phi',
      'phu_tung_thay_the',
      'don_vi_sua_chua_id',
      'ket_qua_xu_ly',
      'ngay_hoan_thanh',
      'thuc_hien_boi_id',
      'trang_thai_thiet_bi_id',
    ]);

    return {
      noi_dung_xu_ly: toNullableString(body.noi_dung_xu_ly, 'noi_dung_xu_ly', 10000),
      chi_phi: toNonNegativeNumber(body.chi_phi, 'chi_phi'),
      phu_tung_thay_the: toFlexibleJsonValue(body.phu_tung_thay_the, 'phu_tung_thay_the', { maxItems: 300 }),
      don_vi_sua_chua_id: toPositiveInt(body.don_vi_sua_chua_id, 'don_vi_sua_chua_id', { allowNull: true }),
      ket_qua_xu_ly: toNullableString(body.ket_qua_xu_ly, 'ket_qua_xu_ly', 5000),
      ngay_hoan_thanh: toDateTime(body.ngay_hoan_thanh, 'ngay_hoan_thanh'),
      thuc_hien_boi_id: toPositiveInt(body.thuc_hien_boi_id, 'thuc_hien_boi_id', { allowNull: true }),
      trang_thai_thiet_bi_id: toPositiveInt(body.trang_thai_thiet_bi_id, 'trang_thai_thiet_bi_id'),
    };
  },
};

module.exports = {
  nhatKyBaoTriIdParam,
  thietBiIdParam,
  phieuBaoHongIdParam,
  createNhatKyBaoTri,
  tiepNhanBaoTriThuCong,
  getNhatKyBaoTriListQuery,
  getLichSuTheoThietBiQuery,
  getDanhSachTheoPhieuBaoHongQuery,
  updateNhatKyBaoTri,
  completeNhatKyBaoTri,
};
