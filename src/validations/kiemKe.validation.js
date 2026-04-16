const AppError = require('../utils/appError');
const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  toPositiveInt,
} = require('./common.validation');

const ALLOWED_LOAI_PHAM_VI = ['TOAN_TRUONG', 'THEO_DON_VI'];
const ALLOWED_TRANG_THAI = ['NHAP', 'DANG_KIEM_KE', 'CHO_XAC_NHAN', 'HOAN_TAT', 'HUY'];
const ALLOWED_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'thoi_diem_bat_dau',
  'thoi_diem_ket_thuc',
  'ma_phieu',
  'ten_dot_kiem_ke',
  'trang_thai',
];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
const ALLOWED_CHI_TIET_SORT_FIELDS = [
  'chi_tiet_kiem_ke_id',
  'updated_at',
  'thoi_gian_kiem_ke',
  'ma_tai_san',
  'ten_thiet_bi',
];

const toUpperEnum = (value, fieldName, allowedValues, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} là bắt buộc`, 400);
    }
    return undefined;
  }

  if (value === null || typeof value !== 'string') {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized || !allowedValues.includes(normalized)) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }

  return normalized;
};

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
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    Number(parsed.getUTCFullYear()) !== year
    || Number(parsed.getUTCMonth()) + 1 !== month
    || Number(parsed.getUTCDate()) !== day
  ) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }

  return normalized;
};

const toDateTime = (value, fieldName, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} là bắt buộc`, 400);
    }
    return undefined;
  }

  if (value === null || value === '') {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`${fieldName} không hợp lệ`, 400);
  }

  return parsed;
};

const parsePagination = (query) => {
  const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
  const limit = query.limit === undefined ? 20 : toPositiveInt(query.limit, 'limit');

  if (limit > 100) {
    throw new AppError('limit tối đa là 100', 400);
  }

  return { page, limit };
};

const parseSort = (query, allowedSortFields, defaultSortBy) => {
  const sortBy = query.sortBy
    ? toNonEmptyString(query.sortBy, 'sortBy', 64)
    : defaultSortBy;
  const sortOrder = query.sortOrder
    ? toNonEmptyString(query.sortOrder, 'sortOrder', 4).toUpperCase()
    : 'DESC';

  if (!allowedSortFields.includes(sortBy)) {
    throw new AppError(`sortBy chỉ hỗ trợ: ${allowedSortFields.join(', ')}`, 400);
  }
  if (!ALLOWED_SORT_ORDERS.includes(sortOrder)) {
    throw new AppError('sortOrder chỉ hỗ trợ ASC hoặc DESC', 400);
  }

  return { sortBy, sortOrder };
};

const phieuKiemKeIdParam = {
  params: (params) => {
    requireObject(params, 'Dữ liệu params không hợp lệ');

    return {
      id: toPositiveInt(params.id, 'id'),
    };
  },
};

const phieuAndChiTietIdParam = {
  params: (params) => {
    requireObject(params, 'Dữ liệu params không hợp lệ');

    return {
      id: toPositiveInt(params.id, 'id'),
      chi_tiet_id: toPositiveInt(params.chi_tiet_id, 'chi_tiet_id'),
    };
  },
};

const createPhieuKiemKe = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, [
      'ten_dot_kiem_ke',
      'loai_pham_vi',
      'don_vi_id',
      'thoi_diem_bat_dau',
      'ghi_chu',
    ]);

    const loaiPhamVi = toUpperEnum(body.loai_pham_vi, 'loai_pham_vi', ALLOWED_LOAI_PHAM_VI, {
      required: true,
    });
    const donViId = toPositiveInt(body.don_vi_id, 'don_vi_id', { allowNull: true });

    if (loaiPhamVi === 'THEO_DON_VI' && !donViId) {
      throw new AppError('don_vi_id là bắt buộc khi loai_pham_vi = THEO_DON_VI', 400);
    }

    return {
      ten_dot_kiem_ke: toNonEmptyString(body.ten_dot_kiem_ke, 'ten_dot_kiem_ke', 255),
      loai_pham_vi: loaiPhamVi,
      don_vi_id: loaiPhamVi === 'THEO_DON_VI' ? donViId : null,
      thoi_diem_bat_dau: toDateTime(body.thoi_diem_bat_dau, 'thoi_diem_bat_dau', { required: true }),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const updatePhieuKiemKe = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    const allowedFields = [
      'ten_dot_kiem_ke',
      'loai_pham_vi',
      'don_vi_id',
      'thoi_diem_bat_dau',
      'ghi_chu',
    ];
    assertOnlyAllowedKeys(body, allowedFields);
    ensureAtLeastOneField(body, allowedFields, 'Cần ít nhất 1 trường để cập nhật');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ten_dot_kiem_ke')) {
      payload.ten_dot_kiem_ke = toNonEmptyString(body.ten_dot_kiem_ke, 'ten_dot_kiem_ke', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'loai_pham_vi')) {
      payload.loai_pham_vi = toUpperEnum(body.loai_pham_vi, 'loai_pham_vi', ALLOWED_LOAI_PHAM_VI);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'don_vi_id')) {
      payload.don_vi_id = toPositiveInt(body.don_vi_id, 'don_vi_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'thoi_diem_bat_dau')) {
      payload.thoi_diem_bat_dau = toDateTime(body.thoi_diem_bat_dau, 'thoi_diem_bat_dau');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 2000);
    }

    if (
      payload.loai_pham_vi === 'THEO_DON_VI'
      && Object.prototype.hasOwnProperty.call(payload, 'don_vi_id')
      && !payload.don_vi_id
    ) {
      throw new AppError('don_vi_id là bắt buộc khi loai_pham_vi = THEO_DON_VI', 400);
    }

    return payload;
  },
};

const getPhieuKiemKeListQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, [
      'page',
      'limit',
      'keyword',
      'trang_thai',
      'loai_pham_vi',
      'don_vi_id',
      'tu_ngay',
      'den_ngay',
      'sortBy',
      'sortOrder',
    ]);

    const { page, limit } = parsePagination(query);
    const { sortBy, sortOrder } = parseSort(query, ALLOWED_SORT_FIELDS, 'created_at');
    const tuNgay = toDateOnly(query.tu_ngay, 'tu_ngay');
    const denNgay = toDateOnly(query.den_ngay, 'den_ngay');

    if (tuNgay && denNgay && denNgay < tuNgay) {
      throw new AppError('den_ngay không được nhỏ hơn tu_ngay', 400);
    }

    return {
      page,
      limit,
      keyword: query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined,
      trang_thai: toUpperEnum(query.trang_thai, 'trang_thai', ALLOWED_TRANG_THAI),
      loai_pham_vi: toUpperEnum(query.loai_pham_vi, 'loai_pham_vi', ALLOWED_LOAI_PHAM_VI),
      don_vi_id: toPositiveInt(query.don_vi_id, 'don_vi_id'),
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      sortBy,
      sortOrder,
    };
  },
};

const chuyenTrangThaiPhieuKiemKe = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ['trang_thai', 'ghi_chu']);

    return {
      trang_thai: toUpperEnum(body.trang_thai, 'trang_thai', ALLOWED_TRANG_THAI, { required: true }),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const huyPhieuKiemKe = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ['ly_do', 'ghi_chu']);

    return {
      ly_do: toNonEmptyString(body.ly_do, 'ly_do', 2000),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const hoanTatPhieuKiemKe = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ['ghi_chu']);

    return {
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 2000),
    };
  },
};

const getChiTietKiemKeListQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, [
      'page',
      'limit',
      'keyword',
      'tinh_trang_kiem_ke_id',
      'nguoi_kiem_ke_id',
      'don_vi_thuc_te_id',
      'sortBy',
      'sortOrder',
    ]);

    const { page, limit } = parsePagination(query);
    const { sortBy, sortOrder } = parseSort(query, ALLOWED_CHI_TIET_SORT_FIELDS, 'chi_tiet_kiem_ke_id');

    return {
      page,
      limit,
      keyword: query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined,
      tinh_trang_kiem_ke_id: toPositiveInt(query.tinh_trang_kiem_ke_id, 'tinh_trang_kiem_ke_id'),
      nguoi_kiem_ke_id: toPositiveInt(query.nguoi_kiem_ke_id, 'nguoi_kiem_ke_id'),
      don_vi_thuc_te_id: toPositiveInt(query.don_vi_thuc_te_id, 'don_vi_thuc_te_id'),
      sortBy,
      sortOrder,
    };
  },
};

const updateChiTietKiemKe = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    const allowedFields = [
      'tinh_trang_kiem_ke_id',
      'don_vi_thuc_te_id',
      'ghi_chu',
      'nguoi_kiem_ke_id',
      'thoi_gian_kiem_ke',
    ];
    assertOnlyAllowedKeys(body, allowedFields);
    ensureAtLeastOneField(body, allowedFields, 'Cần ít nhất 1 trường để cập nhật');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'tinh_trang_kiem_ke_id')) {
      payload.tinh_trang_kiem_ke_id = toPositiveInt(body.tinh_trang_kiem_ke_id, 'tinh_trang_kiem_ke_id');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'don_vi_thuc_te_id')) {
      payload.don_vi_thuc_te_id = toPositiveInt(body.don_vi_thuc_te_id, 'don_vi_thuc_te_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 2000);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nguoi_kiem_ke_id')) {
      payload.nguoi_kiem_ke_id = toPositiveInt(body.nguoi_kiem_ke_id, 'nguoi_kiem_ke_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'thoi_gian_kiem_ke')) {
      payload.thoi_gian_kiem_ke = toDateTime(body.thoi_gian_kiem_ke, 'thoi_gian_kiem_ke');
    }

    return payload;
  },
};

const bulkUpdateChiTietKiemKe = {
  body: (body) => {
    requireObject(body, 'Body không hợp lệ');
    assertOnlyAllowedKeys(body, ['items']);

    if (!Array.isArray(body.items)) {
      throw new AppError('items phải là mảng', 400);
    }
    if (!body.items.length) {
      throw new AppError('items không được rỗng', 400);
    }
    if (body.items.length > 500) {
      throw new AppError('Số lượng items tối đa là 500', 400);
    }

    const normalizedItems = body.items.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new AppError(`items[${index}] không hợp lệ`, 400);
      }

      const allowedFields = [
        'chi_tiet_kiem_ke_id',
        'tinh_trang_kiem_ke_id',
        'don_vi_thuc_te_id',
        'ghi_chu',
        'nguoi_kiem_ke_id',
        'thoi_gian_kiem_ke',
      ];
      assertOnlyAllowedKeys(item, allowedFields);
      ensureAtLeastOneField(
        item,
        ['tinh_trang_kiem_ke_id', 'don_vi_thuc_te_id', 'ghi_chu', 'nguoi_kiem_ke_id', 'thoi_gian_kiem_ke'],
        `items[${index}] cần ít nhất 1 trường để cập nhật`,
      );

      const normalized = {
        chi_tiet_kiem_ke_id: toPositiveInt(item.chi_tiet_kiem_ke_id, `items[${index}].chi_tiet_kiem_ke_id`),
      };

      if (Object.prototype.hasOwnProperty.call(item, 'tinh_trang_kiem_ke_id')) {
        normalized.tinh_trang_kiem_ke_id = toPositiveInt(item.tinh_trang_kiem_ke_id, `items[${index}].tinh_trang_kiem_ke_id`);
      }
      if (Object.prototype.hasOwnProperty.call(item, 'don_vi_thuc_te_id')) {
        normalized.don_vi_thuc_te_id = toPositiveInt(item.don_vi_thuc_te_id, `items[${index}].don_vi_thuc_te_id`, { allowNull: true });
      }
      if (Object.prototype.hasOwnProperty.call(item, 'ghi_chu')) {
        normalized.ghi_chu = toNullableString(item.ghi_chu, `items[${index}].ghi_chu`, 2000);
      }
      if (Object.prototype.hasOwnProperty.call(item, 'nguoi_kiem_ke_id')) {
        normalized.nguoi_kiem_ke_id = toPositiveInt(item.nguoi_kiem_ke_id, `items[${index}].nguoi_kiem_ke_id`, { allowNull: true });
      }
      if (Object.prototype.hasOwnProperty.call(item, 'thoi_gian_kiem_ke')) {
        normalized.thoi_gian_kiem_ke = toDateTime(item.thoi_gian_kiem_ke, `items[${index}].thoi_gian_kiem_ke`);
      }

      return normalized;
    });

    return {
      items: normalizedItems,
    };
  },
};

const getPhieuKiemKeHistoryQuery = {
  query: (query) => {
    requireObject(query, 'Dữ liệu query không hợp lệ');
    assertOnlyAllowedKeys(query, ['page', 'limit']);

    return parsePagination(query);
  },
};

module.exports = {
  phieuKiemKeIdParam,
  phieuAndChiTietIdParam,
  createPhieuKiemKe,
  updatePhieuKiemKe,
  getPhieuKiemKeListQuery,
  chuyenTrangThaiPhieuKiemKe,
  huyPhieuKiemKe,
  hoanTatPhieuKiemKe,
  getChiTietKiemKeListQuery,
  updateChiTietKiemKe,
  bulkUpdateChiTietKiemKe,
  getPhieuKiemKeHistoryQuery,
};
