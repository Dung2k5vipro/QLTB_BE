const { pool } = require('../configs/db.config');

const MAINTENANCE_BASE_SELECT = `
  nk.nhat_ky_bao_tri_id,
  nk.thiet_bi_id,
  tb.ma_tai_san,
  tb.ten_thiet_bi,
  tb.trang_thai_thiet_bi_id,
  tttb.ma_trang_thai AS ma_trang_thai_thiet_bi,
  tttb.ten_trang_thai AS ten_trang_thai_thiet_bi,
  nk.phieu_bao_hong_id,
  pbh.ma_phieu,
  pbh.trang_thai AS trang_thai_phieu_bao_hong,
  pbh.mo_ta_su_co AS mo_ta_su_co_phieu_bao_hong,
  pbh.thoi_gian_phat_hien AS thoi_gian_phat_hien_su_co,
  pbh.thoi_gian_tiep_nhan AS thoi_gian_tiep_nhan_phieu,
  pbh.thoi_gian_dong AS thoi_gian_dong_phieu,
  pbh.nguoi_tao_id AS nguoi_tao_phieu_id,
  nguoi_tao_phieu.ho_ten AS ten_nguoi_tao_phieu,
  pbh.nguoi_tiep_nhan_id AS nguoi_tiep_nhan_phieu_id,
  nguoi_tiep_nhan_phieu.ho_ten AS ten_nguoi_tiep_nhan_phieu,
  pbh.nguoi_dong_phieu_id,
  nguoi_dong_phieu.ho_ten AS ten_nguoi_dong_phieu,
  nk.loai_xu_ly,
  nk.ngay_tiep_nhan,
  nk.ngay_hoan_thanh,
  nk.noi_dung_xu_ly,
  nk.chi_phi,
  nk.phu_tung_thay_the,
  nk.don_vi_sua_chua_id,
  dvsc.ma_dvsc,
  dvsc.ten_dvsc AS ten_don_vi_sua_chua,
  nk.ket_qua_xu_ly,
  nk.thuc_hien_boi_id,
  nguoi_thuc_hien.ho_ten AS ten_nguoi_thuc_hien,
  nk.created_at,
  nk.updated_at
`;

const MAINTENANCE_BASE_JOIN = `
  FROM nhat_ky_bao_tri nk
  INNER JOIN thiet_bi tb ON tb.thiet_bi_id = nk.thiet_bi_id
  INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
  LEFT JOIN phieu_bao_hong pbh ON pbh.phieu_bao_hong_id = nk.phieu_bao_hong_id
  LEFT JOIN nguoi_dung nguoi_tao_phieu ON nguoi_tao_phieu.nguoi_dung_id = pbh.nguoi_tao_id
  LEFT JOIN nguoi_dung nguoi_tiep_nhan_phieu ON nguoi_tiep_nhan_phieu.nguoi_dung_id = pbh.nguoi_tiep_nhan_id
  LEFT JOIN nguoi_dung nguoi_dong_phieu ON nguoi_dong_phieu.nguoi_dung_id = pbh.nguoi_dong_phieu_id
  LEFT JOIN don_vi_sua_chua dvsc ON dvsc.don_vi_sua_chua_id = nk.don_vi_sua_chua_id
  LEFT JOIN nguoi_dung nguoi_thuc_hien ON nguoi_thuc_hien.nguoi_dung_id = nk.thuc_hien_boi_id
`;

const resolveExecutor = (connection) => connection || pool;

const appendMaintenanceFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push(`(
      tb.ma_tai_san LIKE ?
      OR tb.ten_thiet_bi LIKE ?
      OR pbh.ma_phieu LIKE ?
      OR nk.noi_dung_xu_ly LIKE ?
      OR nk.ket_qua_xu_ly LIKE ?
    )`);
    values.push(keyword, keyword, keyword, keyword, keyword);
  }

  if (filters.thiet_bi_id) {
    conditions.push('nk.thiet_bi_id = ?');
    values.push(filters.thiet_bi_id);
  }
  if (filters.phieu_bao_hong_id) {
    conditions.push('nk.phieu_bao_hong_id = ?');
    values.push(filters.phieu_bao_hong_id);
  }
  if (filters.loai_xu_ly) {
    conditions.push('nk.loai_xu_ly = ?');
    values.push(filters.loai_xu_ly);
  }
  if (filters.don_vi_sua_chua_id) {
    conditions.push('nk.don_vi_sua_chua_id = ?');
    values.push(filters.don_vi_sua_chua_id);
  }
  if (filters.thuc_hien_boi_id) {
    conditions.push('nk.thuc_hien_boi_id = ?');
    values.push(filters.thuc_hien_boi_id);
  }
  if (filters.tu_ngay) {
    conditions.push('DATE(COALESCE(nk.ngay_tiep_nhan, nk.created_at)) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(COALESCE(nk.ngay_tiep_nhan, nk.created_at)) <= ?');
    values.push(filters.den_ngay);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const getConnection = async () => {
  return pool.getConnection();
};

const findThietBiById = async (thietBiId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      tb.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tb.trang_thai_thiet_bi_id,
      tttb.ma_trang_thai,
      tttb.ten_trang_thai
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    WHERE tb.thiet_bi_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [thietBiId]);
  return rows[0] || null;
};

const findPhieuBaoHongById = async (phieuBaoHongId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      pbh.phieu_bao_hong_id,
      pbh.ma_phieu,
      pbh.thiet_bi_id,
      pbh.trang_thai,
      pbh.nguoi_tiep_nhan_id,
      pbh.thoi_gian_tiep_nhan,
      pbh.nguoi_dong_phieu_id,
      pbh.thoi_gian_dong
    FROM phieu_bao_hong pbh
    WHERE pbh.phieu_bao_hong_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [phieuBaoHongId]);
  return rows[0] || null;
};

const findDonViSuaChuaById = async (donViSuaChuaId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT don_vi_sua_chua_id, ma_dvsc, ten_dvsc, is_active
    FROM don_vi_sua_chua
    WHERE don_vi_sua_chua_id = ?
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [donViSuaChuaId]);
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

const findTrangThaiThietBiList = async ({ connection, activeOnly = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT trang_thai_thiet_bi_id, ma_trang_thai, ten_trang_thai, is_active
    FROM trang_thai_thiet_bi
    ${activeOnly ? 'WHERE is_active = 1' : ''}
    ORDER BY thu_tu_hien_thi ASC, trang_thai_thiet_bi_id ASC
  `;
  const [rows] = await executor.query(sql);
  return rows;
};

const findTrangThaiThietBiById = async (trangThaiThietBiId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT trang_thai_thiet_bi_id, ma_trang_thai, ten_trang_thai, is_active
    FROM trang_thai_thiet_bi
    WHERE trang_thai_thiet_bi_id = ?
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [trangThaiThietBiId]);
  return rows[0] || null;
};

const findNhatKyBaoTriById = async (nhatKyBaoTriId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${MAINTENANCE_BASE_SELECT}
    ${MAINTENANCE_BASE_JOIN}
    WHERE nk.nhat_ky_bao_tri_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [nhatKyBaoTriId]);
  return rows[0] || null;
};

const createNhatKyBaoTri = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    INSERT INTO nhat_ky_bao_tri (
      thiet_bi_id,
      phieu_bao_hong_id,
      loai_xu_ly,
      ngay_tiep_nhan,
      ngay_hoan_thanh,
      noi_dung_xu_ly,
      chi_phi,
      phu_tung_thay_the,
      don_vi_sua_chua_id,
      ket_qua_xu_ly,
      thuc_hien_boi_id,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await executor.query(sql, [
    payload.thiet_bi_id,
    payload.phieu_bao_hong_id ?? null,
    payload.loai_xu_ly,
    payload.ngay_tiep_nhan ?? new Date(),
    payload.ngay_hoan_thanh ?? null,
    payload.noi_dung_xu_ly ?? null,
    payload.chi_phi ?? 0,
    payload.phu_tung_thay_the === undefined || payload.phu_tung_thay_the === null
      ? null
      : JSON.stringify(payload.phu_tung_thay_the),
    payload.don_vi_sua_chua_id ?? null,
    payload.ket_qua_xu_ly ?? null,
    payload.thuc_hien_boi_id ?? null,
  ]);

  return Number(result.insertId);
};

const updateNhatKyBaoTriById = async (nhatKyBaoTriId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    loai_xu_ly: 'loai_xu_ly',
    ngay_tiep_nhan: 'ngay_tiep_nhan',
    ngay_hoan_thanh: 'ngay_hoan_thanh',
    noi_dung_xu_ly: 'noi_dung_xu_ly',
    chi_phi: 'chi_phi',
    phu_tung_thay_the: 'phu_tung_thay_the',
    don_vi_sua_chua_id: 'don_vi_sua_chua_id',
    ket_qua_xu_ly: 'ket_qua_xu_ly',
    thuc_hien_boi_id: 'thuc_hien_boi_id',
  };

  const setClauses = [];
  const values = [];

  Object.keys(fieldMap).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      setClauses.push(`${fieldMap[key]} = ?`);
      if (key === 'phu_tung_thay_the' && payload[key] !== null && payload[key] !== undefined) {
        values.push(JSON.stringify(payload[key]));
      } else {
        values.push(payload[key]);
      }
    }
  });

  if (!setClauses.length) return false;

  setClauses.push('updated_at = NOW()');
  const sql = `
    UPDATE nhat_ky_bao_tri
    SET ${setClauses.join(', ')}
    WHERE nhat_ky_bao_tri_id = ?
  `;
  values.push(nhatKyBaoTriId);

  const [result] = await executor.query(sql, values);
  return result.affectedRows > 0;
};

const countNhatKyBaoTri = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendMaintenanceFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    ${MAINTENANCE_BASE_JOIN}
    ${whereClause}
  `;
  const [rows] = await executor.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findNhatKyBaoTriList = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendMaintenanceFilters(filters, values);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT
      ${MAINTENANCE_BASE_SELECT}
    ${MAINTENANCE_BASE_JOIN}
    ${whereClause}
    ORDER BY COALESCE(nk.ngay_hoan_thanh, nk.ngay_tiep_nhan, nk.created_at) DESC, nk.nhat_ky_bao_tri_id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(limit, offset);
  const [rows] = await executor.query(sql, values);
  return rows;
};

const updatePhieuBaoHongById = async (phieuBaoHongId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    trang_thai: 'trang_thai',
    nguoi_dong_phieu_id: 'nguoi_dong_phieu_id',
    thoi_gian_dong: 'thoi_gian_dong',
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
    UPDATE phieu_bao_hong
    SET ${setClauses.join(', ')}
    WHERE phieu_bao_hong_id = ?
  `;
  values.push(phieuBaoHongId);

  const [result] = await executor.query(sql, values);
  return result.affectedRows > 0;
};

const updateThietBiTrangThai = async (thietBiId, payload, { connection } = {}) => {
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

const createDeviceStatusHistory = async (payload, { connection } = {}) => {
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

const createSystemLog = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    INSERT INTO nhat_ky_he_thong (
      nguoi_dung_id,
      module,
      hanh_dong,
      entity_name,
      entity_id,
      du_lieu_cu,
      du_lieu_moi,
      ghi_chu,
      ip_address,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const [result] = await executor.query(sql, [
    payload.nguoi_dung_id ?? null,
    payload.module ?? null,
    payload.hanh_dong ?? null,
    payload.entity_name ?? null,
    payload.entity_id ?? null,
    payload.du_lieu_cu ?? null,
    payload.du_lieu_moi ?? null,
    payload.ghi_chu ?? null,
    payload.ip_address ?? null,
  ]);

  return Number(result.insertId);
};

module.exports = {
  getConnection,
  findThietBiById,
  findPhieuBaoHongById,
  findDonViSuaChuaById,
  findNguoiDungById,
  findTrangThaiThietBiList,
  findTrangThaiThietBiById,
  findNhatKyBaoTriById,
  createNhatKyBaoTri,
  updateNhatKyBaoTriById,
  countNhatKyBaoTri,
  findNhatKyBaoTriList,
  updatePhieuBaoHongById,
  updateThietBiTrangThai,
  createDeviceStatusHistory,
  createSystemLog,
};

