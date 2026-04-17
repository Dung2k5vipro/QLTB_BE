const AppError = require('../utils/appError');

const PHIEU_TRANG_THAI = [
  'CHO_XU_LY',
  'DA_TIEP_NHAN',
  'DANG_XU_LY',
  'CHO_LINH_KIEN',
  'HOAN_THANH',
  'TU_CHOI',
  'HUY',
];

const CAP_NHAT_XU_LY_TRANG_THAI = ['DANG_XU_LY', 'CHO_LINH_KIEN'];

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

const toRequiredString = (value, fieldName, maxLength = 5000) => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phải là chuỗi`, 400);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new AppError(`${fieldName} lđ bđt buđc`, 400);
  }
  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vđđt quđ đ dđi tđi a ${maxLength}`, 400);
  }
  return normalized;
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
    Number(date.getUTCFullYear()) !== year
    || Number(date.getUTCMonth()) + 1 !== month
    || Number(date.getUTCDate()) !== day
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
  if (value === null) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phải là chuỗi`, 400);
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }
  if (!allowedValues.includes(normalized)) {
    throw new AppError(`${fieldName} khđng hđp lđ`, 400);
  }

  return normalized;
};

const toFlexibleJsonValue = (value, fieldName, { maxItems = 100 } = {}) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (Array.isArray(value)) {
    if (value.length > maxItems) {
      throw new AppError(`${fieldName} vđđt quđ sđ lđđng phđn tđ tđi a ${maxItems}`, 400);
    }
    return value;
  }

  if (isObject(value)) {
    return value;
  }

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

const phieuBaoHongIdParam = {
  params: (params) => {
    requireObject(params, 'Dđ liđu params khđng hđp lđ');
    return {
      id: toPositiveInt(params.id, 'id', { required: true }),
    };
  },
};

const createPhieuBaoHong = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, [
      'thiet_bi_id',
      'don_vi_id',
      'muc_do_uu_tien_id',
      'mo_ta_su_co',
      'hinh_anh_dinh_kem',
      'thoi_gian_phat_hien',
    ]);

    return {
      thiet_bi_id: toPositiveInt(body.thiet_bi_id, 'thiet_bi_id', { required: true }),
      don_vi_id: toPositiveInt(body.don_vi_id, 'don_vi_id', { allowNull: true }),
      muc_do_uu_tien_id: toPositiveInt(body.muc_do_uu_tien_id, 'muc_do_uu_tien_id', { required: true }),
      mo_ta_su_co: toRequiredString(body.mo_ta_su_co, 'mo_ta_su_co', 10000),
      hinh_anh_dinh_kem: toFlexibleJsonValue(body.hinh_anh_dinh_kem, 'hinh_anh_dinh_kem', { maxItems: 30 }),
      thoi_gian_phat_hien: toDateTime(body.thoi_gian_phat_hien, 'thoi_gian_phat_hien', { required: true }),
    };
  },
};

const getPhieuBaoHongList = {
  query: (query) => {
    requireObject(query, 'Dđ liđu query khđng hđp lđ');
    assertOnlyAllowedKeys(query, [
      'thiet_bi_id',
      'nguoi_tao_id',
      'nguoi_tiep_nhan_id',
      'don_vi_id',
      'muc_do_uu_tien_id',
      'trang_thai',
      'tu_ngay',
      'den_ngay',
      'page',
      'limit',
    ]);

    const pagination = normalizePagination(query);
    const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
    const denNgay = toDateOnly(query.den_ngay, 'den_ngay');

    if (tuNgay && denNgay && denNgay < tuNgay) {
      throw new AppError('den_ngay khđng đđc nhđ hđn tu_ngay', 400);
    }

    return {
      thiet_bi_id: toPositiveInt(query.thiet_bi_id, 'thiet_bi_id'),
      nguoi_tao_id: toPositiveInt(query.nguoi_tao_id, 'nguoi_tao_id'),
      nguoi_tiep_nhan_id: toPositiveInt(query.nguoi_tiep_nhan_id, 'nguoi_tiep_nhan_id'),
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      muc_do_uu_tien_id: toPositiveInt(query.muc_do_uu_tien_id, 'muc_do_uu_tien_id'),
      trang_thai: toUpperEnum(query.trang_thai, 'trang_thai', PHIEU_TRANG_THAI),
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      ...pagination,
    };
  },
};

const tiepNhanPhieuBaoHong = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, []);
    return {};
  },
};

const capNhatXuLyPhieuBaoHong = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, [
      'loai_xu_ly',
      'noi_dung_xu_ly',
      'chi_phi',
      'phu_tung_thay_the',
      'don_vi_sua_chua_id',
      'ket_qua_xu_ly',
      'trang_thai',
    ]);

    const payload = {
      loai_xu_ly: toUpperEnum(body.loai_xu_ly, 'loai_xu_ly', LOAI_XU_LY_VALUES),
      noi_dung_xu_ly: toNullableString(body.noi_dung_xu_ly, 'noi_dung_xu_ly', 10000),
      chi_phi: toNonNegativeNumber(body.chi_phi, 'chi_phi'),
      phu_tung_thay_the: toFlexibleJsonValue(body.phu_tung_thay_the, 'phu_tung_thay_the', { maxItems: 200 }),
      don_vi_sua_chua_id: toPositiveInt(body.don_vi_sua_chua_id, 'don_vi_sua_chua_id', { allowNull: true }),
      ket_qua_xu_ly: toNullableString(body.ket_qua_xu_ly, 'ket_qua_xu_ly', 255),
      trang_thai: toUpperEnum(body.trang_thai, 'trang_thai', CAP_NHAT_XU_LY_TRANG_THAI),
    };

    const hasAtLeastOneField = Object.values(payload).some((value) => value !== undefined);
    if (!hasAtLeastOneField) {
      throw new AppError('Dđ liđu cập nhật xđ lđ khđng đđc rđng hođn tođn', 400);
    }

    return payload;
  },
};

const hoanThanhPhieuBaoHong = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, [
      'loai_xu_ly',
      'noi_dung_xu_ly',
      'chi_phi',
      'phu_tung_thay_the',
      'don_vi_sua_chua_id',
      'ket_qua_xu_ly',
      'trang_thai_thiet_bi_id',
    ]);

    return {
      loai_xu_ly: toUpperEnum(body.loai_xu_ly, 'loai_xu_ly', LOAI_XU_LY_VALUES),
      noi_dung_xu_ly: toNullableString(body.noi_dung_xu_ly, 'noi_dung_xu_ly', 10000),
      chi_phi: toNonNegativeNumber(body.chi_phi, 'chi_phi'),
      phu_tung_thay_the: toFlexibleJsonValue(body.phu_tung_thay_the, 'phu_tung_thay_the', { maxItems: 200 }),
      don_vi_sua_chua_id: toPositiveInt(body.don_vi_sua_chua_id, 'don_vi_sua_chua_id', { allowNull: true }),
      ket_qua_xu_ly: toNullableString(body.ket_qua_xu_ly, 'ket_qua_xu_ly', 255),
      trang_thai_thiet_bi_id: toPositiveInt(body.trang_thai_thiet_bi_id, 'trang_thai_thiet_bi_id'),
    };
  },
};

const tuChoiPhieuBaoHong = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, ['ly_do_tu_choi_hoac_huy']);
    return {
      ly_do_tu_choi_hoac_huy: toRequiredString(body.ly_do_tu_choi_hoac_huy, 'ly_do_tu_choi_hoac_huy', 5000),
    };
  },
};

const huyPhieuBaoHong = {
  body: (body) => {
    requireObject(body);
    assertOnlyAllowedKeys(body, ['ly_do_tu_choi_hoac_huy']);
    return {
      ly_do_tu_choi_hoac_huy: toRequiredString(body.ly_do_tu_choi_hoac_huy, 'ly_do_tu_choi_hoac_huy', 5000),
    };
  },
};

const getNhatKyBaoTriList = {
  query: (query) => {
    requireObject(query, 'Dđ liđu query khđng hđp lđ');
    assertOnlyAllowedKeys(query, [
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

    if (tuNgay && denNgay && denNgay < tuNgay) {
      throw new AppError('den_ngay khđng đđc nhđ hđn tu_ngay', 400);
    }

    return {
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

module.exports = {
  phieuBaoHongIdParam,
  createPhieuBaoHong,
  getPhieuBaoHongList,
  tiepNhanPhieuBaoHong,
  capNhatXuLyPhieuBaoHong,
  hoanThanhPhieuBaoHong,
  tuChoiPhieuBaoHong,
  huyPhieuBaoHong,
  getNhatKyBaoTriList,
};
