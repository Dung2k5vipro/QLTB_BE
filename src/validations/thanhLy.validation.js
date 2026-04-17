const AppError = require('../utils/appError');
const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNullableString,
  toPositiveInt,
} = require('./common.validation');

const ALLOWED_TRANG_THAI = ['NHAP', 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'HOAN_TAT', 'HUY'];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
const ALLOWED_PHIEU_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'ngay_de_xuat',
  'ma_phieu',
  'trang_thai',
];
const ALLOWED_CHI_TIET_SORT_FIELDS = [
  'chi_tiet_thanh_ly_id',
  'created_at',
  'ma_tai_san',
  'ten_thiet_bi',
  'chi_phi_sua_chua_da_phat_sinh',
  'gia_tri_thu_hoi_du_kien',
];

const toUpperEnum = (value, fieldName, allowedValues, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} l� b�t bu�c`, 400);
    }
    return undefined;
  }

  if (value === null || typeof value !== 'string') {
    throw new AppError(`${fieldName} kh�ng h�p l�`, 400);
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized || !allowedValues.includes(normalized)) {
    throw new AppError(`${fieldName} kh�ng h�p l�`, 400);
  }

  return normalized;
};

const toDateOnly = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} ph�i theo �nh d�ng YYYY-MM-DD`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(`${fieldName} ph�i theo �nh d�ng YYYY-MM-DD`, 400);
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number(date.getUTCFullYear()) !== year
    || Number(date.getUTCMonth()) + 1 !== month
    || Number(date.getUTCDate()) !== day
  ) {
    throw new AppError(`${fieldName} kh�ng h�p l�`, 400);
  }

  return normalized;
};

const toDateTime = (value, fieldName, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} l� b�t bu�c`, 400);
    }
    return undefined;
  }
  if (value === null || value === '') {
    throw new AppError(`${fieldName} kh�ng h�p l�`, 400);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} kh�ng h�p l�`, 400);
  }

  return date;
};

const toNonNegativeNumber = (value, fieldName, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} l� b�t bu�c`, 400);
    }
    return undefined;
  }
  if (value === null) {
    throw new AppError(`${fieldName} ph�i l� s� kh�ng �m`, 400);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} ph�i l� s� kh�ng �m`, 400);
  }

  return parsed;
};

const parsePagination = (query) => {
  const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
  const limit = query.limit === undefined ? 20 : toPositiveInt(query.limit, 'limit');

  if (limit > 100) {
    throw new AppError('limit t�i a l� 100', 400);
  }

  return { page, limit };
};

const parseSort = (query, allowedFields, defaultSortBy) => {
  const sortBy = query.sortBy ? String(query.sortBy).trim() : defaultSortBy;
  const sortOrder = query.sortOrder ? String(query.sortOrder).trim().toUpperCase() : 'DESC';

  if (!allowedFields.includes(sortBy)) {
    throw new AppError(`sortBy ch� h� tr�: ${allowedFields.join(', ')}`, 400);
  }
  if (!ALLOWED_SORT_ORDERS.includes(sortOrder)) {
    throw new AppError('sortOrder ch� h� tr� ASC ho�c DESC', 400);
  }

  return { sortBy, sortOrder };
};

const assertUniqueDeviceIds = (items, fieldNamePrefix = 'items') => {
  const seen = new Set();
  for (let i = 0; i < items.length; i += 1) {
    const value = Number(items[i].thiet_bi_id);
    if (seen.has(value)) {
      throw new AppError(`${fieldNamePrefix}[${i}].thiet_bi_id b� tr�ng trong c�ng y�u c�u`, 400);
    }
    seen.add(value);
  }
};

const normalizeChiTietItem = (item, index, { requireAllFields = true } = {}) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new AppError(`items[${index}] kh�ng h�p l�`, 400);
  }

  const allowedFields = [
    'thiet_bi_id',
    'ly_do_thanh_ly_id',
    'tinh_trang_hien_tai',
    'chi_phi_sua_chua_da_phat_sinh',
    'gia_tri_thu_hoi_du_kien',
    'ghi_chu',
  ];
  assertOnlyAllowedKeys(item, allowedFields);

  if (requireAllFields) {
    if (!Object.prototype.hasOwnProperty.call(item, 'thiet_bi_id')) {
      throw new AppError(`items[${index}].thiet_bi_id l� b�t bu�c`, 400);
    }
    if (!Object.prototype.hasOwnProperty.call(item, 'ly_do_thanh_ly_id')) {
      throw new AppError(`items[${index}].ly_do_thanh_ly_id l� b�t bu�c`, 400);
    }
  }

  const normalized = {};

  if (Object.prototype.hasOwnProperty.call(item, 'thiet_bi_id')) {
    normalized.thiet_bi_id = toPositiveInt(item.thiet_bi_id, `items[${index}].thiet_bi_id`);
  }
  if (Object.prototype.hasOwnProperty.call(item, 'ly_do_thanh_ly_id')) {
    normalized.ly_do_thanh_ly_id = toPositiveInt(item.ly_do_thanh_ly_id, `items[${index}].ly_do_thanh_ly_id`);
  }
  if (Object.prototype.hasOwnProperty.call(item, 'tinh_trang_hien_tai')) {
    normalized.tinh_trang_hien_tai = toNullableString(item.tinh_trang_hien_tai, `items[${index}].tinh_trang_hien_tai`, 255);
  }
  if (Object.prototype.hasOwnProperty.call(item, 'chi_phi_sua_chua_da_phat_sinh')) {
    normalized.chi_phi_sua_chua_da_phat_sinh = toNonNegativeNumber(
      item.chi_phi_sua_chua_da_phat_sinh,
      `items[${index}].chi_phi_sua_chua_da_phat_sinh`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(item, 'gia_tri_thu_hoi_du_kien')) {
    normalized.gia_tri_thu_hoi_du_kien = toNonNegativeNumber(
      item.gia_tri_thu_hoi_du_kien,
      `items[${index}].gia_tri_thu_hoi_du_kien`,
    );
  }
  if (Object.prototype.hasOwnProperty.call(item, 'ghi_chu')) {
    normalized.ghi_chu = toNullableString(item.ghi_chu, `items[${index}].ghi_chu`, 2000);
  }

  if (requireAllFields) {
    if (!Object.prototype.hasOwnProperty.call(normalized, 'chi_phi_sua_chua_da_phat_sinh')) {
      normalized.chi_phi_sua_chua_da_phat_sinh = 0;
    }
    if (!Object.prototype.hasOwnProperty.call(normalized, 'gia_tri_thu_hoi_du_kien')) {
      normalized.gia_tri_thu_hoi_du_kien = 0;
    }
  }

  return normalized;
};

const phieuThanhLyIdParam = {
  params: (params) => {
    requireObject(params, 'D� li�u params kh�ng h�p l�');
    return {
      id: toPositiveInt(params.id, 'id'),
    };
  },
};

const phieuAndChiTietIdParam = {
  params: (params) => {
    requireObject(params, 'D� li�u params kh�ng h�p l�');
    return {
      id: toPositiveInt(params.id, 'id'),
      chi_tiet_id: toPositiveInt(params.chi_tiet_id, 'chi_tiet_id'),
    };
  },
};

const createPhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['ngay_de_xuat', 'ghi_chu', 'chi_tiet']);

    let chiTiet = undefined;
    if (Object.prototype.hasOwnProperty.call(body, 'chi_tiet')) {
      if (!Array.isArray(body.chi_tiet)) {
        throw new AppError('chi_tiet ph�i l� m�ng', 400);
      }
      if (!body.chi_tiet.length) {
        throw new AppError('chi_tiet kh�ng ��c r�ng khi c� g�i l�n', 400);
      }
      if (body.chi_tiet.length > 500) {
        throw new AppError('S� l��ng chi_tiet t�i a l� 500', 400);
      }

      chiTiet = body.chi_tiet.map((item, index) => normalizeChiTietItem(item, index, { requireAllFields: true }));
      assertUniqueDeviceIds(chiTiet, 'chi_tiet');
    }

    return {
      ngay_de_xuat: toDateTime(body.ngay_de_xuat, 'ngay_de_xuat'),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
      chi_tiet: chiTiet,
    };
  },
};

const updatePhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    const allowedFields = ['ngay_de_xuat', 'ghi_chu'];
    assertOnlyAllowedKeys(body, allowedFields);
    ensureAtLeastOneField(body, allowedFields, 'C�n �t nh�t 1 tr��ng � c�p nh�t');

    const payload = {};
    if (Object.prototype.hasOwnProperty.call(body, 'ngay_de_xuat')) {
      payload.ngay_de_xuat = toDateTime(body.ngay_de_xuat, 'ngay_de_xuat');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 2000);
    }
    return payload;
  },
};

const getPhieuThanhLyListQuery = {
  query: (query) => {
    requireObject(query, 'D� li�u query kh�ng h�p l�');
    assertOnlyAllowedKeys(query, [
      'page',
      'limit',
      'keyword',
      'trang_thai',
      'nguoi_tao_id',
      'nguoi_duyet_id',
      'tu_ngay',
      'den_ngay',
      'sortBy',
      'sortOrder',
    ]);

    const { page, limit } = parsePagination(query);
    const { sortBy, sortOrder } = parseSort(query, ALLOWED_PHIEU_SORT_FIELDS, 'created_at');
    const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
    const denNgay = toDateOnly(query.den_ngay, 'den_ngay');

    if (tuNgay && denNgay && denNgay < tuNgay) {
      throw new AppError('den_ngay kh�ng ��c nh� h�n tu_ngay', 400);
    }

    return {
      page,
      limit,
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      trang_thai: toUpperEnum(query.trang_thai, 'trang_thai', ALLOWED_TRANG_THAI),
      nguoi_tao_id: toPositiveInt(query.nguoi_tao_id, 'nguoi_tao_id'),
      nguoi_duyet_id: toPositiveInt(query.nguoi_duyet_id, 'nguoi_duyet_id'),
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      sortBy,
      sortOrder,
    };
  },
};

const getChiTietThanhLyListQuery = {
  query: (query) => {
    requireObject(query, 'D� li�u query kh�ng h�p l�');
    assertOnlyAllowedKeys(query, [
      'page',
      'limit',
      'keyword',
      'ly_do_thanh_ly_id',
      'thiet_bi_id',
      'sortBy',
      'sortOrder',
    ]);

    const { page, limit } = parsePagination(query);
    const { sortBy, sortOrder } = parseSort(query, ALLOWED_CHI_TIET_SORT_FIELDS, 'chi_tiet_thanh_ly_id');

    return {
      page,
      limit,
      keyword: query.keyword ? String(query.keyword).trim() : undefined,
      ly_do_thanh_ly_id: toPositiveInt(query.ly_do_thanh_ly_id, 'ly_do_thanh_ly_id'),
      thiet_bi_id: toPositiveInt(query.thiet_bi_id, 'thiet_bi_id'),
      sortBy,
      sortOrder,
    };
  },
};

const addChiTietThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['items']);

    if (!Array.isArray(body.items)) {
      throw new AppError('items ph�i l� m�ng', 400);
    }
    if (!body.items.length) {
      throw new AppError('items kh�ng ��c r�ng', 400);
    }
    if (body.items.length > 500) {
      throw new AppError('S� l��ng items t�i a l� 500', 400);
    }

    const items = body.items.map((item, index) => normalizeChiTietItem(item, index, { requireAllFields: true }));
    assertUniqueDeviceIds(items);

    return {
      items,
    };
  },
};

const updateChiTietThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    const allowedFields = [
      'thiet_bi_id',
      'ly_do_thanh_ly_id',
      'tinh_trang_hien_tai',
      'chi_phi_sua_chua_da_phat_sinh',
      'gia_tri_thu_hoi_du_kien',
      'ghi_chu',
    ];
    assertOnlyAllowedKeys(body, allowedFields);
    ensureAtLeastOneField(body, allowedFields, 'C�n �t nh�t 1 tr��ng � c�p nh�t');

    const payload = {};
    if (Object.prototype.hasOwnProperty.call(body, 'thiet_bi_id')) {
      payload.thiet_bi_id = toPositiveInt(body.thiet_bi_id, 'thiet_bi_id');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ly_do_thanh_ly_id')) {
      payload.ly_do_thanh_ly_id = toPositiveInt(body.ly_do_thanh_ly_id, 'ly_do_thanh_ly_id');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'tinh_trang_hien_tai')) {
      payload.tinh_trang_hien_tai = toNullableString(body.tinh_trang_hien_tai, 'tinh_trang_hien_tai', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'chi_phi_sua_chua_da_phat_sinh')) {
      payload.chi_phi_sua_chua_da_phat_sinh = toNonNegativeNumber(
        body.chi_phi_sua_chua_da_phat_sinh,
        'chi_phi_sua_chua_da_phat_sinh',
      );
    }
    if (Object.prototype.hasOwnProperty.call(body, 'gia_tri_thu_hoi_du_kien')) {
      payload.gia_tri_thu_hoi_du_kien = toNonNegativeNumber(
        body.gia_tri_thu_hoi_du_kien,
        'gia_tri_thu_hoi_du_kien',
      );
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 2000);
    }

    return payload;
  },
};

const guiDuyetPhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['ghi_chu']);
    return {
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const duyetPhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['ghi_chu']);
    return {
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const tuChoiPhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['ly_do_tu_choi', 'ghi_chu']);

    const lyDoTuChoi = String(body.ly_do_tu_choi || '').trim();
    if (!lyDoTuChoi) {
      throw new AppError('ly_do_tu_choi l� b�t bu�c', 400);
    }
    if (lyDoTuChoi.length > 2000) {
      throw new AppError('ly_do_tu_choi v��t qu� � d�i t�i a 2000', 400);
    }

    return {
      ly_do_tu_choi: lyDoTuChoi,
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const hoanTatPhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['ghi_chu']);
    return {
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const huyPhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['ly_do_huy', 'ghi_chu']);
    const lyDoHuy = String(body.ly_do_huy || '').trim();
    if (!lyDoHuy) {
      throw new AppError('ly_do_huy l� b�t bu�c', 400);
    }
    if (lyDoHuy.length > 2000) {
      throw new AppError('ly_do_huy v��t qu� � d�i t�i a 2000', 400);
    }

    return {
      ly_do_huy: lyDoHuy,
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const chuyenTrangThaiPhieuThanhLy = {
  body: (body) => {
    requireObject(body, 'Body kh�ng h�p l�');
    assertOnlyAllowedKeys(body, ['trang_thai', 'ly_do_tu_choi', 'ly_do_huy', 'ghi_chu']);

    const trangThai = toUpperEnum(body.trang_thai, 'trang_thai', ALLOWED_TRANG_THAI, { required: true });
    const lyDoTuChoi = toNullableString(body.ly_do_tu_choi, 'ly_do_tu_choi', 2000);
    const lyDoHuy = toNullableString(body.ly_do_huy, 'ly_do_huy', 2000);

    if (trangThai === 'TU_CHOI' && !lyDoTuChoi) {
      throw new AppError('ly_do_tu_choi l� b�t bu�c khi chuy�n tr�ng th�i TU_CHOI', 400);
    }
    if (trangThai === 'HUY' && !lyDoHuy) {
      throw new AppError('ly_do_huy l� b�t bu�c khi chuy�n tr�ng th�i HUY', 400);
    }

    return {
      trang_thai: trangThai,
      ly_do_tu_choi: lyDoTuChoi,
      ly_do_huy: lyDoHuy,
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const getPhieuThanhLyHistoryQuery = {
  query: (query) => {
    requireObject(query, 'D� li�u query kh�ng h�p l�');
    assertOnlyAllowedKeys(query, ['page', 'limit']);
    return parsePagination(query);
  },
};

module.exports = {
  phieuThanhLyIdParam,
  phieuAndChiTietIdParam,
  createPhieuThanhLy,
  updatePhieuThanhLy,
  getPhieuThanhLyListQuery,
  getChiTietThanhLyListQuery,
  addChiTietThanhLy,
  updateChiTietThanhLy,
  guiDuyetPhieuThanhLy,
  duyetPhieuThanhLy,
  tuChoiPhieuThanhLy,
  hoanTatPhieuThanhLy,
  huyPhieuThanhLy,
  chuyenTrangThaiPhieuThanhLy,
  getPhieuThanhLyHistoryQuery,
};
