const AppError = require('../utils/appError');
const {
  requireObject,
  assertOnlyAllowedKeys,
  toPositiveInt,
} = require('./common.validation');

const ALLOWED_TRANSFER_TYPES = ['CAP_PHAT', 'BAN_GIAO', 'DIEU_CHUYEN', 'THU_HOI'];
const ALLOWED_KIEM_KE_STATUS = ['NHAP', 'DANG_KIEM_KE', 'CHO_XAC_NHAN', 'HOAN_TAT', 'HUY'];
const ALLOWED_THANH_LY_STATUS = ['NHAP', 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'HOAN_TAT', 'HUY'];
const ALLOWED_HONG_BAO_TRI_STATUS = ['HONG_NANG', 'DANG_BAO_TRI'];

const toDateOnly = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} phải theo định dạng YYYY-MM-DD`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(`${fieldName} phải theo định dạng YYYY-MM-DD`, 400);
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number(date.getUTCFullYear()) !== year
    || Number(date.getUTCMonth()) + 1 !== month
    || Number(date.getUTCDate()) !== day
  ) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }
  return normalized;
};

const toYear = (value, fieldName) => {
  if (value === undefined) return undefined;
  const year = toPositiveInt(value, fieldName);
  if (year < 2000 || year > 2100) {
    throw new AppError(`${fieldName} phải nằm trong khoảng 2000 - 2100`, 400);
  }
  return year;
};

const toMonth = (value, fieldName) => {
  if (value === undefined) return undefined;
  const month = toPositiveInt(value, fieldName);
  if (month < 1 || month > 12) {
    throw new AppError(`${fieldName} phải nằm trong khoảng 1 - 12`, 400);
  }
  return month;
};

const toQuarter = (value, fieldName) => {
  if (value === undefined) return undefined;
  const quarter = toPositiveInt(value, fieldName);
  if (quarter < 1 || quarter > 4) {
    throw new AppError(`${fieldName} phải nằm trong khoảng 1 - 4`, 400);
  }
  return quarter;
};

const toEnumUpper = (value, fieldName, allowedValues) => {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'string') {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }
  const normalized = value.trim().toUpperCase();
  if (!normalized || !allowedValues.includes(normalized)) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }
  return normalized;
};

const parsePagination = (query, { defaultLimit = 20, maxLimit = 200 } = {}) => {
  const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
  const limit = query.limit === undefined ? defaultLimit : toPositiveInt(query.limit, 'limit');

  if (limit > maxLimit) {
    throw new AppError(`limit tối đa là ${maxLimit}`, 400);
  }

  return { page, limit };
};

const parseDateRange = (query) => {
  const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
  const denNgay = toDateOnly(query.den_ngay, 'den_ngay');

  if (tuNgay && denNgay && denNgay < tuNgay) {
    throw new AppError('den_ngay không được nhỏ hơn tu_ngay', 400);
  }

  return {
    tu_ngay: tuNgay,
    den_ngay: denNgay,
  };
};

const getThietBiTheoLoaiQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['don_vi_id', 'trang_thai_thiet_bi_id', 'keyword', 'page', 'limit']);

    return {
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      trang_thai_thiet_bi_id: toPositiveInt(query.trang_thai_thiet_bi_id, 'trang_thai_thiet_bi_id'),
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      ...parsePagination(query),
    };
  },
};

const getThietBiTheoDonViQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['loai_thiet_bi_id', 'trang_thai_thiet_bi_id', 'keyword', 'page', 'limit']);

    return {
      loai_thiet_bi_id: toPositiveInt(query.loai_thiet_bi_id, 'loai_thiet_bi_id'),
      trang_thai_thiet_bi_id: toPositiveInt(query.trang_thai_thiet_bi_id, 'trang_thai_thiet_bi_id'),
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      ...parsePagination(query),
    };
  },
};

const getThietBiTheoTrangThaiQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['don_vi_id', 'loai_thiet_bi_id']);

    return {
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      loai_thiet_bi_id: toPositiveInt(query.loai_thiet_bi_id, 'loai_thiet_bi_id'),
    };
  },
};

const getThietBiSapHetBaoHanhQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['tu_ngay', 'den_ngay', 'so_ngay', 'don_vi_id', 'loai_thiet_bi_id', 'page', 'limit']);

    const range = parseDateRange(query);
    const soNgay = query.so_ngay === undefined ? undefined : toPositiveInt(query.so_ngay, 'so_ngay');
    if (soNgay !== undefined && soNgay > 3650) {
      throw new AppError('so_ngay tối đa là 3650', 400);
    }

    return {
      ...range,
      so_ngay: soNgay,
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      loai_thiet_bi_id: toPositiveInt(query.loai_thiet_bi_id, 'loai_thiet_bi_id'),
      ...parsePagination(query),
    };
  },
};

const getThietBiHongBaoTriQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['don_vi_id', 'loai_thiet_bi_id', 'trang_thai', 'keyword', 'page', 'limit']);

    return {
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      loai_thiet_bi_id: toPositiveInt(query.loai_thiet_bi_id, 'loai_thiet_bi_id'),
      trang_thai: toEnumUpper(query.trang_thai, 'trang_thai', ALLOWED_HONG_BAO_TRI_STATUS),
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      ...parsePagination(query),
    };
  },
};

const getChiPhiTheoThangQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['nam', 'tu_thang', 'den_thang']);

    const nam = toYear(query.nam, 'nam');
    const tuThang = toMonth(query.tu_thang, 'tu_thang');
    const denThang = toMonth(query.den_thang, 'den_thang');

    if (tuThang && denThang && denThang < tuThang) {
      throw new AppError('den_thang không được nhỏ hơn tu_thang', 400);
    }

    return {
      nam,
      tu_thang: tuThang,
      den_thang: denThang,
    };
  },
};

const getChiPhiTheoQuyQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['nam', 'quy']);

    return {
      nam: toYear(query.nam, 'nam'),
      quy: toQuarter(query.quy, 'quy'),
    };
  },
};

const getChiPhiTheoNamQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['tu_nam', 'den_nam']);

    const tuNam = toYear(query.tu_nam, 'tu_nam');
    const denNam = toYear(query.den_nam, 'den_nam');

    if (tuNam && denNam && denNam < tuNam) {
      throw new AppError('den_nam không được nhỏ hơn tu_nam', 400);
    }

    return {
      tu_nam: tuNam,
      den_nam: denNam,
    };
  },
};

const getLichSuDieuChuyenQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, [
      'thiet_bi_id',
      'loai_nghiep_vu',
      'tu_don_vi_id',
      'den_don_vi_id',
      'tu_ngay',
      'den_ngay',
      'page',
      'limit',
    ]);

    return {
      thiet_bi_id: toPositiveInt(query.thiet_bi_id, 'thiet_bi_id'),
      loai_nghiep_vu: toEnumUpper(query.loai_nghiep_vu, 'loai_nghiep_vu', ALLOWED_TRANSFER_TYPES),
      tu_don_vi_id: toPositiveInt(query.tu_don_vi_id, 'tu_don_vi_id'),
      den_don_vi_id: toPositiveInt(query.den_don_vi_id, 'den_don_vi_id'),
      ...parseDateRange(query),
      ...parsePagination(query),
    };
  },
};

const getKetQuaKiemKeTheoKyQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['tu_ngay', 'den_ngay', 'don_vi_id', 'trang_thai', 'page', 'limit']);

    return {
      ...parseDateRange(query),
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      trang_thai: toEnumUpper(query.trang_thai, 'trang_thai', ALLOWED_KIEM_KE_STATUS),
      ...parsePagination(query),
    };
  },
};

const getDeXuatThanhLyQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, [
      'trang_thai',
      'tu_ngay',
      'den_ngay',
      'don_vi_id',
      'loai_thiet_bi_id',
      'keyword',
      'page',
      'limit',
    ]);

    return {
      trang_thai: toEnumUpper(query.trang_thai, 'trang_thai', ALLOWED_THANH_LY_STATUS),
      ...parseDateRange(query),
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      loai_thiet_bi_id: toPositiveInt(query.loai_thiet_bi_id, 'loai_thiet_bi_id'),
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      ...parsePagination(query),
    };
  },
};

const getDaThanhLyQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, [
      'tu_ngay',
      'den_ngay',
      'don_vi_id',
      'loai_thiet_bi_id',
      'keyword',
      'page',
      'limit',
    ]);

    return {
      ...parseDateRange(query),
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      loai_thiet_bi_id: toPositiveInt(query.loai_thiet_bi_id, 'loai_thiet_bi_id'),
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      ...parsePagination(query),
    };
  },
};

module.exports = {
  getThietBiTheoLoaiQuery,
  getThietBiTheoDonViQuery,
  getThietBiTheoTrangThaiQuery,
  getThietBiSapHetBaoHanhQuery,
  getThietBiHongBaoTriQuery,
  getChiPhiTheoThangQuery,
  getChiPhiTheoQuyQuery,
  getChiPhiTheoNamQuery,
  getLichSuDieuChuyenQuery,
  getKetQuaKiemKeTheoKyQuery,
  getDeXuatThanhLyQuery,
  getDaThanhLyQuery,
};
