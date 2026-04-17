const { pool } = require('../configs/db.config');

const resolveExecutor = (connection) => connection || pool;

const getDeviceOverviewCounts = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      COUNT(*) AS tong_so_thiet_bi,
      SUM(CASE WHEN UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%DANGSUDUNG%' THEN 1 ELSE 0 END) AS thiet_bi_dang_su_dung,
      SUM(CASE WHEN UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%BAOTRI%' THEN 1 ELSE 0 END) AS thiet_bi_dang_bao_tri,
      SUM(CASE WHEN UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%MATTHIEU%' THEN 1 ELSE 0 END) AS thiet_bi_mat_thieu,
      SUM(CASE WHEN UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%THANHLY%' THEN 1 ELSE 0 END) AS thiet_bi_da_thanh_ly
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
  `;
  const [rows] = await executor.query(sql);
  return rows[0] || {};
};

const countPhieuBaoHongChoXuLy = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COUNT(*) AS total
    FROM phieu_bao_hong
    WHERE trang_thai = 'CHO_XU_LY'
  `;
  const [rows] = await executor.query(sql);
  return Number(rows[0]?.total || 0);
};

const countPhieuKiemKeDangMo = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COUNT(*) AS total
    FROM phieu_kiem_ke
    WHERE trang_thai IN ('NHAP', 'DANG_KIEM_KE', 'CHO_XAC_NHAN')
  `;
  const [rows] = await executor.query(sql);
  return Number(rows[0]?.total || 0);
};

const countPhieuThanhLyChoDuyet = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COUNT(*) AS total
    FROM phieu_thanh_ly
    WHERE trang_thai = 'CHO_DUYET'
  `;
  const [rows] = await executor.query(sql);
  return Number(rows[0]?.total || 0);
};

const countDeviceSapHetBaoHanh = async ({ fromDate, toDate, connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COUNT(*) AS total
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    WHERE tb.ngay_het_bao_hanh IS NOT NULL
      AND DATE(tb.ngay_het_bao_hanh) BETWEEN ? AND ?
      AND UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) NOT LIKE '%THANHLY%'
  `;
  const [rows] = await executor.query(sql, [fromDate, toDate]);
  return Number(rows[0]?.total || 0);
};

const sumBaoTriCostInPeriod = async ({ fromDate, toDate, connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COALESCE(SUM(nk.chi_phi), 0) AS tong_chi_phi
    FROM nhat_ky_bao_tri nk
    WHERE DATE(COALESCE(nk.ngay_hoan_thanh, nk.ngay_tiep_nhan, nk.created_at)) BETWEEN ? AND ?
  `;
  const [rows] = await executor.query(sql, [fromDate, toDate]);
  return Number(rows[0]?.tong_chi_phi || 0);
};

const getTopDonViByDeviceCount = async (limit = 5, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      dv.don_vi_id,
      dv.ma_don_vi,
      dv.ten_don_vi,
      COUNT(tb.thiet_bi_id) AS tong_thiet_bi
    FROM don_vi dv
    LEFT JOIN thiet_bi tb ON tb.don_vi_hien_tai_id = dv.don_vi_id
    GROUP BY dv.don_vi_id, dv.ma_don_vi, dv.ten_don_vi
    ORDER BY tong_thiet_bi DESC, dv.don_vi_id ASC
    LIMIT ?
  `;
  const [rows] = await executor.query(sql, [Number(limit)]);
  return rows;
};

const getTopLoaiThietBiByCount = async (limit = 5, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ltb.loai_thiet_bi_id,
      ltb.ma_loai,
      ltb.ten_loai,
      COUNT(tb.thiet_bi_id) AS tong_thiet_bi
    FROM loai_thiet_bi ltb
    LEFT JOIN thiet_bi tb ON tb.loai_thiet_bi_id = ltb.loai_thiet_bi_id
    GROUP BY ltb.loai_thiet_bi_id, ltb.ma_loai, ltb.ten_loai
    ORDER BY tong_thiet_bi DESC, ltb.loai_thiet_bi_id ASC
    LIMIT ?
  `;
  const [rows] = await executor.query(sql, [Number(limit)]);
  return rows;
};

const getDeviceStatusDistribution = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      tttb.trang_thai_thiet_bi_id,
      tttb.ma_trang_thai,
      tttb.ten_trang_thai,
      tttb.is_terminal,
      COUNT(tb.thiet_bi_id) AS so_luong
    FROM trang_thai_thiet_bi tttb
    LEFT JOIN thiet_bi tb ON tb.trang_thai_thiet_bi_id = tttb.trang_thai_thiet_bi_id
    GROUP BY tttb.trang_thai_thiet_bi_id, tttb.ma_trang_thai, tttb.ten_trang_thai, tttb.is_terminal, tttb.thu_tu_hien_thi
    ORDER BY tttb.thu_tu_hien_thi ASC, tttb.trang_thai_thiet_bi_id ASC
  `;
  const [rows] = await executor.query(sql);
  return rows;
};

const getBaoTriCostByMonth = async ({ fromDate, toDate, months = 6, connection } = {}) => {
  const executor = resolveExecutor(connection);
  const useFixedRange = Boolean(fromDate && toDate);

  let sql = `
    SELECT
      DATE_FORMAT(COALESCE(nk.ngay_hoan_thanh, nk.ngay_tiep_nhan, nk.created_at), '%Y-%m') AS thang,
      SUM(nk.chi_phi) AS tong_chi_phi,
      COUNT(*) AS so_lan
    FROM nhat_ky_bao_tri nk
  `;
  const values = [];

  if (useFixedRange) {
    sql += `
      WHERE DATE(COALESCE(nk.ngay_hoan_thanh, nk.ngay_tiep_nhan, nk.created_at)) BETWEEN ? AND ?
    `;
    values.push(fromDate, toDate);
  } else {
    sql += `
      WHERE DATE(COALESCE(nk.ngay_hoan_thanh, nk.ngay_tiep_nhan, nk.created_at))
        BETWEEN DATE_SUB(CURDATE(), INTERVAL ? MONTH) AND CURDATE()
    `;
    values.push(Math.max(Number(months) - 1, 0));
  }

  sql += `
    GROUP BY thang
    ORDER BY thang ASC
  `;

  const [rows] = await executor.query(sql, values);
  return rows;
};

module.exports = {
  getDeviceOverviewCounts,
  countPhieuBaoHongChoXuLy,
  countPhieuKiemKeDangMo,
  countPhieuThanhLyChoDuyet,
  countDeviceSapHetBaoHanh,
  sumBaoTriCostInPeriod,
  getTopDonViByDeviceCount,
  getTopLoaiThietBiByCount,
  getDeviceStatusDistribution,
  getBaoTriCostByMonth,
};

