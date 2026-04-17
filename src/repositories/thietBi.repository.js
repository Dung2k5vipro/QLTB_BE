const { pool } = require('../configs/db.config');

const SORT_COLUMN_MAP = {
  created_at: 'tb.created_at',
  updated_at: 'tb.updated_at',
  ma_tai_san: 'tb.ma_tai_san',
  ten_thiet_bi: 'tb.ten_thiet_bi',
  ngay_mua: 'tb.ngay_mua',
  gia_tri_mua: 'tb.gia_tri_mua',
};

const TRANSFER_HISTORY_SORT_COLUMN_MAP = {
  thoi_gian_thuc_hien: 'ls.thoi_gian_thuc_hien',
  created_at: 'ls.created_at',
};

const BASE_DEVICE_FIELDS = `
  tb.thiet_bi_id,
  tb.ma_tai_san,
  tb.ten_thiet_bi,
  tb.loai_thiet_bi_id,
  tb.hang_san_xuat_id,
  tb.model,
  tb.so_serial,
  tb.nha_cung_cap_id,
  tb.ngay_mua,
  tb.ngay_het_bao_hanh,
  tb.gia_tri_mua,
  tb.don_vi_hien_tai_id,
  tb.nguoi_phu_trach_id,
  tb.trang_thai_thiet_bi_id,
  tb.tinh_trang_hien_tai,
  tb.ghi_chu,
  tb.created_by,
  tb.updated_by,
  tb.created_at,
  tb.updated_at
`;

const DETAIL_JOIN_FIELDS = `
  ltb.ma_loai,
  ltb.ma_viet_tat,
  ltb.ten_loai,
  hsx.ma_hang,
  hsx.ten_hang,
  ncc.ma_ncc,
  ncc.ten_ncc,
  dv.ma_don_vi,
  dv.ten_don_vi,
  nd.ho_ten AS ten_nguoi_phu_trach,
  tttb.ma_trang_thai,
  tttb.ten_trang_thai
`;

const LIST_JOIN_CLAUSE = `
  FROM thiet_bi tb
  INNER JOIN loai_thiet_bi ltb ON ltb.loai_thiet_bi_id = tb.loai_thiet_bi_id
  LEFT JOIN hang_san_xuat hsx ON hsx.hang_san_xuat_id = tb.hang_san_xuat_id
  LEFT JOIN nha_cung_cap ncc ON ncc.nha_cung_cap_id = tb.nha_cung_cap_id
  LEFT JOIN don_vi dv ON dv.don_vi_id = tb.don_vi_hien_tai_id
  LEFT JOIN nguoi_dung nd ON nd.nguoi_dung_id = tb.nguoi_phu_trach_id
  INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
`;

const DETAIL_JOIN_CLAUSE = `
  ${LIST_JOIN_CLAUSE}
  LEFT JOIN nguoi_dung nd_create ON nd_create.nguoi_dung_id = tb.created_by
  LEFT JOIN nguoi_dung nd_update ON nd_update.nguoi_dung_id = tb.updated_by
`;

const resolveExecutor = (connection) => connection || pool;

const appendListFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(tb.ma_tai_san LIKE ? OR tb.ten_thiet_bi LIKE ? OR tb.so_serial LIKE ? OR tb.model LIKE ?)');
    values.push(keyword, keyword, keyword, keyword);
  }

  if (filters.loaiThietBiId) {
    conditions.push('tb.loai_thiet_bi_id = ?');
    values.push(filters.loaiThietBiId);
  }
  if (filters.hangSanXuatId) {
    conditions.push('tb.hang_san_xuat_id = ?');
    values.push(filters.hangSanXuatId);
  }
  if (filters.nhaCungCapId) {
    conditions.push('tb.nha_cung_cap_id = ?');
    values.push(filters.nhaCungCapId);
  }
  if (filters.donViId) {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(filters.donViId);
  }
  if (filters.nguoiPhuTrachId) {
    conditions.push('tb.nguoi_phu_trach_id = ?');
    values.push(filters.nguoiPhuTrachId);
  }
  if (filters.trangThaiId) {
    conditions.push('tb.trang_thai_thiet_bi_id = ?');
    values.push(filters.trangThaiId);
  }
  if (filters.fromDate) {
    conditions.push('tb.ngay_mua >= ?');
    values.push(filters.fromDate);
  }
  if (filters.toDate) {
    conditions.push('tb.ngay_mua <= ?');
    values.push(filters.toDate);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const appendTransferHistoryFilters = (filters, values) => {
  const conditions = [];

  if (filters.thiet_bi_id) {
    conditions.push('ls.thiet_bi_id = ?');
    values.push(filters.thiet_bi_id);
  }
  if (filters.loai_nghiep_vu) {
    conditions.push('ls.loai_nghiep_vu = ?');
    values.push(filters.loai_nghiep_vu);
  }
  if (filters.tu_don_vi_id) {
    conditions.push('ls.tu_don_vi_id = ?');
    values.push(filters.tu_don_vi_id);
  }
  if (filters.den_don_vi_id) {
    conditions.push('ls.den_don_vi_id = ?');
    values.push(filters.den_don_vi_id);
  }
  if (filters.tu_nguoi_phu_trach_id) {
    conditions.push('ls.tu_nguoi_phu_trach_id = ?');
    values.push(filters.tu_nguoi_phu_trach_id);
  }
  if (filters.den_nguoi_phu_trach_id) {
    conditions.push('ls.den_nguoi_phu_trach_id = ?');
    values.push(filters.den_nguoi_phu_trach_id);
  }
  if (filters.created_by) {
    conditions.push('ls.created_by = ?');
    values.push(filters.created_by);
  }
  if (filters.tu_ngay) {
    conditions.push('DATE(ls.thoi_gian_thuc_hien) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(ls.thoi_gian_thuc_hien) <= ?');
    values.push(filters.den_ngay);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const getConnection = async () => {
  return pool.getConnection();
};

const findLoaiThietBiById = async (loaiThietBiId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT loai_thiet_bi_id, ma_loai, ma_viet_tat, ten_loai, is_active
    FROM loai_thiet_bi
    WHERE loai_thiet_bi_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [loaiThietBiId]);
  return rows[0] || null;
};

const findHangSanXuatById = async (hangSanXuatId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT hang_san_xuat_id, ma_hang, ten_hang, is_active
    FROM hang_san_xuat
    WHERE hang_san_xuat_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [hangSanXuatId]);
  return rows[0] || null;
};

const findNhaCungCapById = async (nhaCungCapId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT nha_cung_cap_id, ma_ncc, ten_ncc, is_active
    FROM nha_cung_cap
    WHERE nha_cung_cap_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [nhaCungCapId]);
  return rows[0] || null;
};

const findDonViById = async (donViId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT don_vi_id, ma_don_vi, ten_don_vi, is_active
    FROM don_vi
    WHERE don_vi_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [donViId]);
  return rows[0] || null;
};

const findNguoiDungById = async (nguoiDungId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT nguoi_dung_id, ho_ten, trang_thai_tai_khoan
    FROM nguoi_dung
    WHERE nguoi_dung_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [nguoiDungId]);
  return rows[0] || null;
};

const findTrangThaiById = async (trangThaiId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT trang_thai_thiet_bi_id, ma_trang_thai, ten_trang_thai, is_active
    FROM trang_thai_thiet_bi
    WHERE trang_thai_thiet_bi_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [trangThaiId]);
  return rows[0] || null;
};

const findDangSuDungStatus = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT trang_thai_thiet_bi_id, ma_trang_thai, ten_trang_thai, is_active
    FROM trang_thai_thiet_bi
    WHERE is_active = 1
      AND (
        UPPER(ma_trang_thai) = 'DANG_SU_DUNG'
        OR UPPER(ma_trang_thai) = 'DANGSUDUNG'
        OR UPPER(ten_trang_thai) = 'ĐANG SỬ DỤNG'
        OR UPPER(ten_trang_thai) = 'DANG SU DUNG'
      )
    ORDER BY trang_thai_thiet_bi_id ASC
    LIMIT 1
  `;

  const [rows] = await executor.query(sql);
  return rows[0] || null;
};

const findDeviceRecordById = async (thietBiId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT ${BASE_DEVICE_FIELDS}
    FROM thiet_bi tb
    WHERE tb.thiet_bi_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;

  const [rows] = await executor.query(sql, [thietBiId]);
  return rows[0] || null;
};

const findDeviceById = async (thietBiId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${BASE_DEVICE_FIELDS},
      ${DETAIL_JOIN_FIELDS},
      nd_create.ho_ten AS ten_nguoi_tao,
      nd_update.ho_ten AS ten_nguoi_cap_nhat
    ${DETAIL_JOIN_CLAUSE}
    WHERE tb.thiet_bi_id = ?
    LIMIT 1
  `;

  const [rows] = await executor.query(sql, [thietBiId]);
  return rows[0] || null;
};

const existsSerial = async (soSerial, { excludeDeviceId = null, connection } = {}) => {
  if (!soSerial) return false;

  const executor = resolveExecutor(connection);
  let sql = 'SELECT thiet_bi_id FROM thiet_bi WHERE so_serial = ?';
  const values = [soSerial];

  if (excludeDeviceId) {
    sql += ' AND thiet_bi_id <> ?';
    values.push(excludeDeviceId);
  }

  sql += ' LIMIT 1';

  const [rows] = await executor.query(sql, values);
  return Boolean(rows[0]);
};

const countDevices = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendListFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    ${LIST_JOIN_CLAUSE}
    ${whereClause}
  `;

  const [rows] = await executor.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findDevices = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendListFilters(filters, values);

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy] || SORT_COLUMN_MAP.created_at;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT
      ${BASE_DEVICE_FIELDS},
      ${DETAIL_JOIN_FIELDS}
    ${LIST_JOIN_CLAUSE}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}, tb.thiet_bi_id DESC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);

  const [rows] = await executor.query(sql, values);
  return rows;
};

const createDevice = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);

  const sql = `
    INSERT INTO thiet_bi (
      ma_tai_san,
      ten_thiet_bi,
      loai_thiet_bi_id,
      hang_san_xuat_id,
      model,
      so_serial,
      nha_cung_cap_id,
      ngay_mua,
      ngay_het_bao_hanh,
      gia_tri_mua,
      don_vi_hien_tai_id,
      nguoi_phu_trach_id,
      trang_thai_thiet_bi_id,
      tinh_trang_hien_tai,
      ghi_chu,
      created_by,
      updated_by,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await executor.query(sql, [
    payload.ma_tai_san,
    payload.ten_thiet_bi,
    payload.loai_thiet_bi_id,
    payload.hang_san_xuat_id ?? null,
    payload.model ?? null,
    payload.so_serial ?? null,
    payload.nha_cung_cap_id ?? null,
    payload.ngay_mua ?? null,
    payload.ngay_het_bao_hanh ?? null,
    payload.gia_tri_mua ?? 0,
    payload.don_vi_hien_tai_id ?? null,
    payload.nguoi_phu_trach_id ?? null,
    payload.trang_thai_thiet_bi_id,
    payload.tinh_trang_hien_tai ?? null,
    payload.ghi_chu ?? null,
    payload.created_by ?? null,
    payload.updated_by ?? null,
  ]);

  return Number(result.insertId);
};

const updateDeviceById = async (thietBiId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    ten_thiet_bi: 'ten_thiet_bi',
    loai_thiet_bi_id: 'loai_thiet_bi_id',
    hang_san_xuat_id: 'hang_san_xuat_id',
    model: 'model',
    so_serial: 'so_serial',
    nha_cung_cap_id: 'nha_cung_cap_id',
    ngay_mua: 'ngay_mua',
    ngay_het_bao_hanh: 'ngay_het_bao_hanh',
    gia_tri_mua: 'gia_tri_mua',
    don_vi_hien_tai_id: 'don_vi_hien_tai_id',
    nguoi_phu_trach_id: 'nguoi_phu_trach_id',
    tinh_trang_hien_tai: 'tinh_trang_hien_tai',
    ghi_chu: 'ghi_chu',
    updated_by: 'updated_by',
  };

  const setClauses = [];
  const values = [];

  Object.keys(fieldMap).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      setClauses.push(`${fieldMap[key]} = ?`);
      values.push(payload[key]);
    }
  });

  if (!setClauses.length) return false;

  setClauses.push('updated_at = NOW()');

  const sql = `
    UPDATE thiet_bi
    SET ${setClauses.join(', ')}
    WHERE thiet_bi_id = ?
  `;

  values.push(thietBiId);

  const [result] = await executor.query(sql, values);
  return result.affectedRows > 0;
};

const updateDeviceStatus = async (thietBiId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);

  const sql = `
    UPDATE thiet_bi
    SET trang_thai_thiet_bi_id = ?, updated_by = ?, updated_at = NOW()
    WHERE thiet_bi_id = ?
  `;

  const [result] = await executor.query(sql, [
    payload.trang_thai_thiet_bi_id,
    payload.updated_by ?? null,
    thietBiId,
  ]);

  return result.affectedRows > 0;
};

const createStatusHistory = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);

  const sql = `
    INSERT INTO lich_su_trang_thai_thiet_bi (
      thiet_bi_id,
      tu_trang_thai_id,
      den_trang_thai_id,
      loai_nguon_phat_sinh,
      nguon_phat_sinh_id,
      ly_do,
      changed_by,
      changed_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const [result] = await executor.query(sql, [
    payload.thiet_bi_id,
    payload.tu_trang_thai_id ?? null,
    payload.den_trang_thai_id,
    payload.loai_nguon_phat_sinh ?? null,
    payload.nguon_phat_sinh_id ?? null,
    payload.ly_do ?? null,
    payload.changed_by ?? null,
  ]);

  return Number(result.insertId);
};

const createTransferHistory = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);

  const sql = `
    INSERT INTO lich_su_ban_giao_dieu_chuyen (
      thiet_bi_id,
      loai_nghiep_vu,
      tu_don_vi_id,
      den_don_vi_id,
      tu_nguoi_phu_trach_id,
      den_nguoi_phu_trach_id,
      ly_do,
      ghi_chu,
      thoi_gian_thuc_hien,
      created_by,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const [result] = await executor.query(sql, [
    payload.thiet_bi_id,
    payload.loai_nghiep_vu,
    payload.tu_don_vi_id ?? null,
    payload.den_don_vi_id ?? null,
    payload.tu_nguoi_phu_trach_id ?? null,
    payload.den_nguoi_phu_trach_id ?? null,
    payload.ly_do ?? null,
    payload.ghi_chu ?? null,
    payload.thoi_gian_thuc_hien || new Date(),
    payload.created_by ?? null,
  ]);

  return Number(result.insertId);
};

const countTransferHistory = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendTransferHistoryFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    FROM lich_su_ban_giao_dieu_chuyen ls
    ${whereClause}
  `;

  const [rows] = await executor.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findTransferHistory = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendTransferHistoryFilters(filters, values);

  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;
  const sortColumn = TRANSFER_HISTORY_SORT_COLUMN_MAP.thoi_gian_thuc_hien;

  const sql = `
    SELECT
      ls.lich_su_id,
      ls.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      ls.loai_nghiep_vu,
      ls.tu_don_vi_id,
      tu_dv.ma_don_vi AS tu_ma_don_vi,
      tu_dv.ten_don_vi AS tu_ten_don_vi,
      ls.den_don_vi_id,
      den_dv.ma_don_vi AS den_ma_don_vi,
      den_dv.ten_don_vi AS den_ten_don_vi,
      ls.tu_nguoi_phu_trach_id,
      tu_nd.ho_ten AS tu_ten_nguoi_phu_trach,
      ls.den_nguoi_phu_trach_id,
      den_nd.ho_ten AS den_ten_nguoi_phu_trach,
      ls.ly_do,
      ls.ghi_chu,
      ls.thoi_gian_thuc_hien,
      ls.created_by,
      creator.ho_ten AS ten_nguoi_tao,
      ls.created_at
    FROM lich_su_ban_giao_dieu_chuyen ls
    INNER JOIN thiet_bi tb ON tb.thiet_bi_id = ls.thiet_bi_id
    LEFT JOIN don_vi tu_dv ON tu_dv.don_vi_id = ls.tu_don_vi_id
    LEFT JOIN don_vi den_dv ON den_dv.don_vi_id = ls.den_don_vi_id
    LEFT JOIN nguoi_dung tu_nd ON tu_nd.nguoi_dung_id = ls.tu_nguoi_phu_trach_id
    LEFT JOIN nguoi_dung den_nd ON den_nd.nguoi_dung_id = ls.den_nguoi_phu_trach_id
    LEFT JOIN nguoi_dung creator ON creator.nguoi_dung_id = ls.created_by
    ${whereClause}
    ORDER BY ${sortColumn} DESC, ls.lich_su_id DESC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);

  const [rows] = await executor.query(sql, values);
  return rows;
};

const findStatusHistoryByDeviceId = async (thietBiId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      h.lich_su_trang_thai_id,
      h.thiet_bi_id,
      h.tu_trang_thai_id,
      old_st.ma_trang_thai AS tu_ma_trang_thai,
      old_st.ten_trang_thai AS tu_ten_trang_thai,
      h.den_trang_thai_id,
      new_st.ma_trang_thai AS den_ma_trang_thai,
      new_st.ten_trang_thai AS den_ten_trang_thai,
      h.loai_nguon_phat_sinh,
      h.nguon_phat_sinh_id,
      h.ly_do,
      h.changed_by,
      nd.ho_ten AS ten_nguoi_thay_doi,
      h.changed_at
    FROM lich_su_trang_thai_thiet_bi h
    LEFT JOIN trang_thai_thiet_bi old_st ON old_st.trang_thai_thiet_bi_id = h.tu_trang_thai_id
    INNER JOIN trang_thai_thiet_bi new_st ON new_st.trang_thai_thiet_bi_id = h.den_trang_thai_id
    LEFT JOIN nguoi_dung nd ON nd.nguoi_dung_id = h.changed_by
    WHERE h.thiet_bi_id = ?
    ORDER BY h.changed_at DESC, h.lich_su_trang_thai_id DESC
  `;

  const [rows] = await executor.query(sql, [thietBiId]);
  return rows;
};

module.exports = {
  getConnection,
  findLoaiThietBiById,
  findHangSanXuatById,
  findNhaCungCapById,
  findDonViById,
  findNguoiDungById,
  findTrangThaiById,
  findDangSuDungStatus,
  findDeviceRecordById,
  findDeviceById,
  existsSerial,
  countDevices,
  findDevices,
  createDevice,
  updateDeviceById,
  updateDeviceStatus,
  createStatusHistory,
  createTransferHistory,
  countTransferHistory,
  findTransferHistory,
  findStatusHistoryByDeviceId,
};


