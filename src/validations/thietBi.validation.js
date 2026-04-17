const AppError = require('../utils/appError');

const ALLOWED_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'ma_tai_san',
  'ten_thiet_bi',
  'ngay_mua',
  'gia_tri_mua',
];
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
const ALLOWED_TRANSFER_TYPES = ['CAP_PHAT', 'BAN_GIAO', 'DIEU_CHUYEN', 'THU_HOI'];

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const requireObject = (value, message = 'Dữ liệu không hợp lệ') => {
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

const ensureAtLeastOneField = (payload, fields, message) => {
  const hasAnyField = fields.some((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (!hasAnyField) {
    throw new AppError(message, 400);
  }
};

const toNonEmptyString = (value, fieldName, maxLength = 255) => {
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} pháº£i lÃ  chuá»—i`, 400);
  }

  const normalized = value.trim();
  if (!normalized) {
    throw new AppError(`${fieldName} khÃ´ng ???c Ä‘á»ƒ trá»‘ng`, 400);
  }
  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vÆ°á»£t quÃ¡ Ä‘á»™ dÃ i tá»‘i Ä‘a ${maxLength}`, 400);
  }

  return normalized;
};

const toNullableString = (value, fieldName, maxLength = 1000) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} pháº£i lÃ  chuá»—i`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vÆ°á»£t quÃ¡ Ä‘á»™ dÃ i tá»‘i Ä‘a ${maxLength}`, 400);
  }

  return normalized;
};

const toPositiveInt = (value, fieldName, { allowNull = false } = {}) => {
  if (value === undefined) return undefined;
  if (value === null && allowNull) return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} pháº£i lÃ  sá»‘ nguyÃªn dÆ°Æ¡ng`, 400);
  }

  return parsed;
};

const toNonNegativeNumber = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new AppError(`${fieldName} pháº£i lÃ  s? khÃ´ng ?m`, 400);
  }

  return parsed;
};

const toDateString = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} pháº£i lÃ  chuá»—i ngay YYYY-MM-DD`, 400);
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
    throw new AppError(`${fieldName} khÃ´ng há»£p lá»‡`, 400);
  }

  return normalized;
};

const requireObjectVn = (value, message = 'Dá»¯ liá»‡u gá»­i lÃªn khÃ´ng há»£p lá»‡!') => {
  if (!isObject(value)) {
    throw new AppError(message, 400);
  }
};

const assertOnlyAllowedKeysVn = (payload, allowedFields) => {
  const invalidFields = Object.keys(payload).filter((key) => !allowedFields.includes(key));
  if (invalidFields.length) {
    throw new AppError(`KhÃ´ng hÄ‘ trá»£ trÆ°á»ng: ${invalidFields.join(', ')}`, 400);
  }
};

const toPositiveIntVn = (value, fieldName, { allowNull = false, required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} lÃ  báº¯t buÄ‘"c`, 400);
    }
    return undefined;
  }

  if (value === null) {
    if (allowNull) return null;
    throw new AppError(`${fieldName} pháº£i lÃ  sÄ‘ nguyÃªn dÆ°Æ¡ng`, 400);
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new AppError(`${fieldName} pháº£i lÃ  sÄ‘ nguyÃªn dÆ°Æ¡ng`, 400);
  }

  return parsed;
};

const toNullableStringVn = (value, fieldName, maxLength = 2000, { required = false } = {}) => {
  if (value === undefined) {
    if (required) {
      throw new AppError(`${fieldName} lÃ  báº¯t buÄ‘"c`, 400);
    }
    return undefined;
  }
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} pháº£i lÃ  chuÄ‘i`, 400);
  }

  const normalized = value.trim();
  if (!normalized) {
    if (required) {
      throw new AppError(`${fieldName} lÃ  báº¯t buÄ‘"c`, 400);
    }
    return null;
  }

  if (normalized.length > maxLength) {
    throw new AppError(`${fieldName} vÆ°á»£t quÃ¡ Ä‘Ä‘" dÃ i tÄ‘i Ä‘a ${maxLength}`, 400);
  }

  return normalized;
};

const toDateTimeVn = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} pháº£i lÃ  chuÄ‘i thá»i gian há»£p lÄ‘!`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`${fieldName} khÃ´ng há»£p lÄ‘!`, 400);
  }

  return date;
};

const parseDateOnlyVn = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') {
    throw new AppError(`${fieldName} pháº£i theo Ä‘Ä‘9nh dáº¡ng YYYY-MM-DD`, 400);
  }

  const normalized = value.trim();
  if (!normalized) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AppError(`${fieldName} pháº£i theo Ä‘Ä‘9nh dáº¡ng YYYY-MM-DD`, 400);
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    Number(date.getUTCFullYear()) !== year
    || Number(date.getUTCMonth()) + 1 !== month
    || Number(date.getUTCDate()) !== day
  ) {
    throw new AppError(`${fieldName} khÃ´ng há»£p lÄ‘!`, 400);
  }

  return normalized;
};

const parseTransferBody = (body, { requireReason = false } = {}) => {
  requireObjectVn(body, 'Dá»¯ liá»‡u gá»­i lÃªn khÃ´ng há»£p lá»‡!');
  assertOnlyAllowedKeysVn(body, [
    'thiet_bi_id',
    'den_don_vi_id',
    'den_nguoi_phu_trach_id',
    'ly_do',
    'ghi_chu',
    'thoi_gian_thuc_hien',
  ]);

  const payload = {
    thiet_bi_id: toPositiveIntVn(body.thiet_bi_id, 'thiet_bi_id', { required: true }),
    den_don_vi_id: toPositiveIntVn(body.den_don_vi_id, 'den_don_vi_id'),
    den_nguoi_phu_trach_id: toPositiveIntVn(body.den_nguoi_phu_trach_id, 'den_nguoi_phu_trach_id'),
    ly_do: toNullableStringVn(body.ly_do, 'ly_do', 255, { required: requireReason }),
    ghi_chu: toNullableStringVn(body.ghi_chu, 'ghi_chu', 5000),
    thoi_gian_thuc_hien: toDateTimeVn(body.thoi_gian_thuc_hien, 'thoi_gian_thuc_hien'),
  };

  if (payload.den_don_vi_id === undefined && payload.den_nguoi_phu_trach_id === undefined) {
    throw new AppError('Cáº§n cung cáº¥p den_don_vi_id hoáº·c den_nguoi_phu_trach_id', 400);
  }

  return payload;
};

const capPhat = {
  body: (body) => parseTransferBody(body, { requireReason: false }),
};

const banGiao = {
  body: (body) => parseTransferBody(body, { requireReason: false }),
};

const dieuChuyen = {
  body: (body) => parseTransferBody(body, { requireReason: true }),
};

const thuHoi = {
  body: (body) => {
    requireObjectVn(body, 'Dá»¯ liá»‡u gá»­i lÃªn khÃ´ng há»£p lá»‡!');
    assertOnlyAllowedKeysVn(body, [
      'thiet_bi_id',
      'den_don_vi_id',
      'den_nguoi_phu_trach_id',
      'ly_do',
      'ghi_chu',
      'thoi_gian_thuc_hien',
    ]);

    return {
      thiet_bi_id: toPositiveIntVn(body.thiet_bi_id, 'thiet_bi_id', { required: true }),
      den_don_vi_id: toPositiveIntVn(body.den_don_vi_id, 'den_don_vi_id', { allowNull: true }),
      den_nguoi_phu_trach_id: toPositiveIntVn(body.den_nguoi_phu_trach_id, 'den_nguoi_phu_trach_id', { allowNull: true }),
      ly_do: toNullableStringVn(body.ly_do, 'ly_do', 255),
      ghi_chu: toNullableStringVn(body.ghi_chu, 'ghi_chu', 5000),
      thoi_gian_thuc_hien: toDateTimeVn(body.thoi_gian_thuc_hien, 'thoi_gian_thuc_hien'),
    };
  },
};

const getTransferHistory = {
  query: (query) => {
    requireObjectVn(query, 'Dá»¯ liÄ‘!u query khÃ´ng há»£p lÄ‘!');
    assertOnlyAllowedKeysVn(query, [
      'thiet_bi_id',
      'loai_nghiep_vu',
      'tu_don_vi_id',
      'den_don_vi_id',
      'tu_nguoi_phu_trach_id',
      'den_nguoi_phu_trach_id',
      'created_by',
      'tu_ngay',
      'den_ngay',
      'page',
      'limit',
    ]);

    const page = query.page === undefined ? 1 : toPositiveIntVn(query.page, 'page');
    const limit = query.limit === undefined ? 20 : toPositiveIntVn(query.limit, 'limit');

    if (limit > 100) {
      throw new AppError('limit tÄ‘i Ä‘a lÃ  100', 400);
    }

    const loaiNghiepVu = query.loai_nghiep_vu === undefined
      ? undefined
      : String(query.loai_nghiep_vu || '').trim().toUpperCase();

    if (loaiNghiepVu && !ALLOWED_TRANSFER_TYPES.includes(loaiNghiepVu)) {
      throw new AppError(`loai_nghiep_vu chÄ‘0 hÄ‘ trá»£: ${ALLOWED_TRANSFER_TYPES.join(', ')}`, 400);
    }

    const tuNgay = parseDateOnlyVn(query.tu_ngay, 'tu_ngay');
    const denNgay = parseDateOnlyVn(query.den_ngay, 'den_ngay');
    if (tuNgay && denNgay && denNgay < tuNgay) {
      throw new AppError('den_ngay khÃ´ng Ä‘Æ°á»£c nhá» hÆ¡n tu_ngay', 400);
    }

    return {
      thiet_bi_id: toPositiveIntVn(query.thiet_bi_id, 'thiet_bi_id'),
      loai_nghiep_vu: loaiNghiepVu,
      tu_don_vi_id: toPositiveIntVn(query.tu_don_vi_id, 'tu_don_vi_id'),
      den_don_vi_id: toPositiveIntVn(query.den_don_vi_id, 'den_don_vi_id'),
      tu_nguoi_phu_trach_id: toPositiveIntVn(query.tu_nguoi_phu_trach_id, 'tu_nguoi_phu_trach_id'),
      den_nguoi_phu_trach_id: toPositiveIntVn(query.den_nguoi_phu_trach_id, 'den_nguoi_phu_trach_id'),
      created_by: toPositiveIntVn(query.created_by, 'created_by'),
      tu_ngay: tuNgay,
      den_ngay: denNgay,
      page,
      limit,
    };
  },
};

const assertNgayMuaNotFuture = (ngayMua) => {
  if (!ngayMua) return;

  const now = new Date();
  const nowDate = now.toISOString().slice(0, 10);
  if (ngayMua > nowDate) {
    throw new AppError('ngay_mua không được lớn hơn ngày hiện tại', 400);
  }
};

const assertWarrantyAfterPurchase = ({ ngayMua, ngayHetBaoHanh }) => {
  if (!ngayMua || !ngayHetBaoHanh) return;
  if (ngayHetBaoHanh < ngayMua) {
    throw new AppError('ngay_het_bao_hanh không được nhỏ hơn ngay_mua', 400);
  }
};

const deviceIdParam = {
  params: (params) => {
    requireObject(params, 'Params khÃ´ng há»£p lá»‡');

    return {
      id: toPositiveInt(params.id, 'id'),
    };
  },
};

const createDevice = {
  body: (body) => {
    requireObject(body, 'Body khÃ´ng há»£p lá»‡');

    const allowedFields = [
      'ten_thiet_bi',
      'loai_thiet_bi_id',
      'hang_san_xuat_id',
      'model',
      'so_serial',
      'nha_cung_cap_id',
      'ngay_mua',
      'ngay_het_bao_hanh',
      'gia_tri_mua',
      'don_vi_hien_tai_id',
      'nguoi_phu_trach_id',
      'trang_thai_thiet_bi_id',
      'tinh_trang_hien_tai',
      'ghi_chu',
    ];
    assertOnlyAllowedKeys(body, allowedFields);

    const payload = {
      ten_thiet_bi: toNonEmptyString(body.ten_thiet_bi, 'ten_thiet_bi', 255),
      loai_thiet_bi_id: toPositiveInt(body.loai_thiet_bi_id, 'loai_thiet_bi_id'),
      hang_san_xuat_id: toPositiveInt(body.hang_san_xuat_id, 'hang_san_xuat_id', { allowNull: true }),
      model: toNullableString(body.model, 'model', 100),
      so_serial: toNullableString(body.so_serial, 'so_serial', 150),
      nha_cung_cap_id: toPositiveInt(body.nha_cung_cap_id, 'nha_cung_cap_id', { allowNull: true }),
      ngay_mua: toDateString(body.ngay_mua, 'ngay_mua'),
      ngay_het_bao_hanh: toDateString(body.ngay_het_bao_hanh, 'ngay_het_bao_hanh'),
      gia_tri_mua: toNonNegativeNumber(body.gia_tri_mua, 'gia_tri_mua'),
      don_vi_hien_tai_id: toPositiveInt(body.don_vi_hien_tai_id, 'don_vi_hien_tai_id', { allowNull: true }),
      nguoi_phu_trach_id: toPositiveInt(body.nguoi_phu_trach_id, 'nguoi_phu_trach_id', { allowNull: true }),
      trang_thai_thiet_bi_id: toPositiveInt(body.trang_thai_thiet_bi_id, 'trang_thai_thiet_bi_id'),
      tinh_trang_hien_tai: toNullableString(body.tinh_trang_hien_tai, 'tinh_trang_hien_tai', 255),
      ghi_chu: toNullableString(body.ghi_chu, 'ghi_chu', 5000),
    };

    if (payload.gia_tri_mua === undefined || payload.gia_tri_mua === null) {
      payload.gia_tri_mua = 0;
    }

    assertNgayMuaNotFuture(payload.ngay_mua);
    assertWarrantyAfterPurchase({
      ngayMua: payload.ngay_mua,
      ngayHetBaoHanh: payload.ngay_het_bao_hanh,
    });

    return payload;
  },
};

const updateDevice = {
  body: (body) => {
    requireObject(body, 'Body khÃ´ng há»£p lá»‡');

    const allowedFields = [
      'ten_thiet_bi',
      'loai_thiet_bi_id',
      'hang_san_xuat_id',
      'model',
      'so_serial',
      'nha_cung_cap_id',
      'ngay_mua',
      'ngay_het_bao_hanh',
      'gia_tri_mua',
      'don_vi_hien_tai_id',
      'nguoi_phu_trach_id',
      'tinh_trang_hien_tai',
      'ghi_chu',
    ];
    assertOnlyAllowedKeys(body, allowedFields);
    ensureAtLeastOneField(body, allowedFields, 'Cần ít nhất 1 trường để cập nhật');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ten_thiet_bi')) {
      payload.ten_thiet_bi = toNonEmptyString(body.ten_thiet_bi, 'ten_thiet_bi', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'loai_thiet_bi_id')) {
      payload.loai_thiet_bi_id = toPositiveInt(body.loai_thiet_bi_id, 'loai_thiet_bi_id');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'hang_san_xuat_id')) {
      payload.hang_san_xuat_id = toPositiveInt(body.hang_san_xuat_id, 'hang_san_xuat_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'model')) {
      payload.model = toNullableString(body.model, 'model', 100);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'so_serial')) {
      payload.so_serial = toNullableString(body.so_serial, 'so_serial', 150);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nha_cung_cap_id')) {
      payload.nha_cung_cap_id = toPositiveInt(body.nha_cung_cap_id, 'nha_cung_cap_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ngay_mua')) {
      payload.ngay_mua = toDateString(body.ngay_mua, 'ngay_mua');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ngay_het_bao_hanh')) {
      payload.ngay_het_bao_hanh = toDateString(body.ngay_het_bao_hanh, 'ngay_het_bao_hanh');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'gia_tri_mua')) {
      payload.gia_tri_mua = toNonNegativeNumber(body.gia_tri_mua, 'gia_tri_mua');
    }
    if (Object.prototype.hasOwnProperty.call(body, 'don_vi_hien_tai_id')) {
      payload.don_vi_hien_tai_id = toPositiveInt(body.don_vi_hien_tai_id, 'don_vi_hien_tai_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'nguoi_phu_trach_id')) {
      payload.nguoi_phu_trach_id = toPositiveInt(body.nguoi_phu_trach_id, 'nguoi_phu_trach_id', { allowNull: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'tinh_trang_hien_tai')) {
      payload.tinh_trang_hien_tai = toNullableString(body.tinh_trang_hien_tai, 'tinh_trang_hien_tai', 255);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ghi_chu')) {
      payload.ghi_chu = toNullableString(body.ghi_chu, 'ghi_chu', 5000);
    }

    const effectiveNgayMua = Object.prototype.hasOwnProperty.call(payload, 'ngay_mua') ? payload.ngay_mua : undefined;
    const effectiveNgayHetBaoHanh = Object.prototype.hasOwnProperty.call(payload, 'ngay_het_bao_hanh')
      ? payload.ngay_het_bao_hanh
      : undefined;

    assertNgayMuaNotFuture(effectiveNgayMua);
    assertWarrantyAfterPurchase({
      ngayMua: effectiveNgayMua,
      ngayHetBaoHanh: effectiveNgayHetBaoHanh,
    });

    return payload;
  },
};

const updateDeviceStatus = {
  body: (body) => {
    requireObject(body, 'Body khÃ´ng há»£p lá»‡');
    assertOnlyAllowedKeys(body, ['trang_thai_thiet_bi_id', 'ly_do']);

    return {
      trang_thai_thiet_bi_id: toPositiveInt(body.trang_thai_thiet_bi_id, 'trang_thai_thiet_bi_id'),
      ly_do: toNullableString(body.ly_do, 'ly_do', 2000),
    };
  },
};

const getDevicesQuery = {
  query: (query) => {
    requireObject(query, 'Query khÃ´ng há»£p lá»‡');

    const page = query.page === undefined ? 1 : toPositiveInt(query.page, 'page');
    const limit = query.limit === undefined ? 20 : toPositiveInt(query.limit, 'limit');

    if (limit > 100) {
      throw new AppError('limit tối đa là 100', 400);
    }

    const sortBy = query.sortBy ? toNonEmptyString(query.sortBy, 'sortBy', 50) : 'created_at';
    const sortOrder = query.sortOrder ? toNonEmptyString(query.sortOrder, 'sortOrder', 4).toUpperCase() : 'DESC';

    if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
      throw new AppError(`sortBy chá»‰ há»— trá»£: ${ALLOWED_SORT_FIELDS.join(', ')}`, 400);
    }
    if (!ALLOWED_SORT_ORDERS.includes(sortOrder)) {
      throw new AppError('sortOrder chá»‰ há»— trá»£ ASC hoáº·c DESC', 400);
    }

    const keyword = query.keyword ? toNonEmptyString(query.keyword, 'keyword', 255) : undefined;
    const loaiThietBiId = query.loaiThietBiId === undefined ? undefined : toPositiveInt(query.loaiThietBiId, 'loaiThietBiId');
    const hangSanXuatId = query.hangSanXuatId === undefined ? undefined : toPositiveInt(query.hangSanXuatId, 'hangSanXuatId');
    const nhaCungCapId = query.nhaCungCapId === undefined ? undefined : toPositiveInt(query.nhaCungCapId, 'nhaCungCapId');
    const donViId = query.donViId === undefined ? undefined : toPositiveInt(query.donViId, 'donViId');
    const nguoiPhuTrachId = query.nguoiPhuTrachId === undefined ? undefined : toPositiveInt(query.nguoiPhuTrachId, 'nguoiPhuTrachId');
    const trangThaiId = query.trangThaiId === undefined ? undefined : toPositiveInt(query.trangThaiId, 'trangThaiId');
    const fromDate = query.fromDate === undefined ? undefined : toDateString(query.fromDate, 'fromDate');
    const toDate = query.toDate === undefined ? undefined : toDateString(query.toDate, 'toDate');

    if (fromDate && toDate && toDate < fromDate) {
      throw new AppError('toDate không được nhỏ hơn fromDate', 400);
    }

    return {
      page,
      limit,
      keyword,
      loaiThietBiId,
      hangSanXuatId,
      nhaCungCapId,
      donViId,
      nguoiPhuTrachId,
      trangThaiId,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    };
  },
};

const getDeviceById = deviceIdParam;
const getDeviceStatusHistory = deviceIdParam;

module.exports = {
  createDevice,
  updateDevice,
  updateDeviceStatus,
  getDevicesQuery,
  capPhat,
  banGiao,
  dieuChuyen,
  thuHoi,
  getTransferHistory,
  getDeviceById,
  getDeviceStatusHistory,
  deviceIdParam,
};


