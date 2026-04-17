const { pool } = require('../configs/db.config');

const resolveExecutor = (connection) => connection || pool;

const buildPaginatedResult = async ({ executor, baseSql, whereClause, groupByClause, orderByClause, values, page, limit }) => {
  const offset = (Number(page) - 1) * Number(limit);

  const countSql = `
    SELECT COUNT(*) AS total
    FROM (
      ${baseSql}
      ${whereClause}
      ${groupByClause}
    ) AS grouped_rows
  `;
  const [countRows] = await executor.query(countSql, values);
  const totalItems = Number(countRows[0]?.total || 0);

  const listSql = `
    ${baseSql}
    ${whereClause}
    ${groupByClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;
  const [items] = await executor.query(listSql, [...values, Number(limit), Number(offset)]);

  return {
    items,
    totalItems,
  };
};

const getThietBiTheoLoai = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = [];

  if (filters.don_vi_id) {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.trang_thai_thiet_bi_id) {
    conditions.push('tb.trang_thai_thiet_bi_id = ?');
    values.push(filters.trang_thai_thiet_bi_id);
  }
  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(ltb.ma_loai LIKE ? OR ltb.ten_loai LIKE ?)');
    values.push(keyword, keyword);
  }

  return buildPaginatedResult({
    executor,
    baseSql: `
      SELECT
        ltb.loai_thiet_bi_id,
        ltb.ma_loai,
        ltb.ten_loai,
        COUNT(tb.thiet_bi_id) AS tong_thiet_bi
      FROM loai_thiet_bi ltb
      LEFT JOIN thiet_bi tb ON tb.loai_thiet_bi_id = ltb.loai_thiet_bi_id
    `,
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    groupByClause: 'GROUP BY ltb.loai_thiet_bi_id, ltb.ma_loai, ltb.ten_loai',
    orderByClause: 'ORDER BY tong_thiet_bi DESC, ltb.loai_thiet_bi_id ASC',
    values,
    page: filters.page || 1,
    limit: filters.limit || 20,
  });
};

const getThietBiTheoDonVi = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = [];

  if (filters.loai_thiet_bi_id) {
    conditions.push('tb.loai_thiet_bi_id = ?');
    values.push(filters.loai_thiet_bi_id);
  }
  if (filters.trang_thai_thiet_bi_id) {
    conditions.push('tb.trang_thai_thiet_bi_id = ?');
    values.push(filters.trang_thai_thiet_bi_id);
  }
  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(dv.ma_don_vi LIKE ? OR dv.ten_don_vi LIKE ?)');
    values.push(keyword, keyword);
  }

  return buildPaginatedResult({
    executor,
    baseSql: `
      SELECT
        dv.don_vi_id,
        dv.ma_don_vi,
        dv.ten_don_vi,
        COUNT(tb.thiet_bi_id) AS tong_thiet_bi
      FROM don_vi dv
      LEFT JOIN thiet_bi tb ON tb.don_vi_hien_tai_id = dv.don_vi_id
    `,
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    groupByClause: 'GROUP BY dv.don_vi_id, dv.ma_don_vi, dv.ten_don_vi',
    orderByClause: 'ORDER BY tong_thiet_bi DESC, dv.don_vi_id ASC',
    values,
    page: filters.page || 1,
    limit: filters.limit || 20,
  });
};

const getThietBiTheoTrangThai = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = [];

  if (filters.don_vi_id) {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.loai_thiet_bi_id) {
    conditions.push('tb.loai_thiet_bi_id = ?');
    values.push(filters.loai_thiet_bi_id);
  }

  const sql = `
    SELECT
      tttb.trang_thai_thiet_bi_id,
      tttb.ma_trang_thai,
      tttb.ten_trang_thai,
      tttb.is_terminal,
      COUNT(tb.thiet_bi_id) AS tong_thiet_bi
    FROM trang_thai_thiet_bi tttb
    LEFT JOIN thiet_bi tb ON tb.trang_thai_thiet_bi_id = tttb.trang_thai_thiet_bi_id
    ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
    GROUP BY tttb.trang_thai_thiet_bi_id, tttb.ma_trang_thai, tttb.ten_trang_thai, tttb.is_terminal, tttb.thu_tu_hien_thi
    ORDER BY tttb.thu_tu_hien_thi ASC, tttb.trang_thai_thiet_bi_id ASC
  `;
  const [rows] = await executor.query(sql, values);
  return rows;
};

const getThietBiSapHetBaoHanh = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = [
    'tb.ngay_het_bao_hanh IS NOT NULL',
    "UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) NOT LIKE '%THANHLY%'",
  ];

  if (filters.tu_ngay && filters.den_ngay) {
    conditions.push('DATE(tb.ngay_het_bao_hanh) BETWEEN ? AND ?');
    values.push(filters.tu_ngay, filters.den_ngay);
  } else if (filters.so_ngay) {
    conditions.push('DATE(tb.ngay_het_bao_hanh) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)');
    values.push(Number(filters.so_ngay));
  } else {
    conditions.push('DATE(tb.ngay_het_bao_hanh) BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
  }

  if (filters.don_vi_id) {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.loai_thiet_bi_id) {
    conditions.push('tb.loai_thiet_bi_id = ?');
    values.push(filters.loai_thiet_bi_id);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    ${whereClause}
  `;
  const [countRows] = await executor.query(countSql, values);
  const totalItems = Number(countRows[0]?.total || 0);

  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const listSql = `
    SELECT
      tb.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tb.ngay_het_bao_hanh,
      tb.don_vi_hien_tai_id,
      dv.ma_don_vi,
      dv.ten_don_vi,
      tb.loai_thiet_bi_id,
      ltb.ma_loai,
      ltb.ten_loai,
      tb.trang_thai_thiet_bi_id,
      tttb.ma_trang_thai,
      tttb.ten_trang_thai
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    LEFT JOIN don_vi dv ON dv.don_vi_id = tb.don_vi_hien_tai_id
    LEFT JOIN loai_thiet_bi ltb ON ltb.loai_thiet_bi_id = tb.loai_thiet_bi_id
    ${whereClause}
    ORDER BY tb.ngay_het_bao_hanh ASC, tb.thiet_bi_id ASC
    LIMIT ? OFFSET ?
  `;
  const [items] = await executor.query(listSql, [...values, limit, offset]);

  return { items, totalItems };
};

const getThietBiHongHoacBaoTri = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = [];

  if (filters.trang_thai === 'HONG_NANG') {
    conditions.push("UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%HONGNANG%'");
  } else if (filters.trang_thai === 'DANG_BAO_TRI') {
    conditions.push("UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%BAOTRI%'");
  } else {
    conditions.push("(UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%HONGNANG%' OR UPPER(REPLACE(tttb.ma_trang_thai, '_', '')) LIKE '%BAOTRI%')");
  }

  if (filters.don_vi_id) {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.loai_thiet_bi_id) {
    conditions.push('tb.loai_thiet_bi_id = ?');
    values.push(filters.loai_thiet_bi_id);
  }
  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(tb.ma_tai_san LIKE ? OR tb.ten_thiet_bi LIKE ? OR tb.so_serial LIKE ?)');
    values.push(keyword, keyword, keyword);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    ${whereClause}
  `;
  const [countRows] = await executor.query(countSql, values);
  const totalItems = Number(countRows[0]?.total || 0);

  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const listSql = `
    SELECT
      tb.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tb.model,
      tb.so_serial,
      tb.don_vi_hien_tai_id,
      dv.ma_don_vi,
      dv.ten_don_vi,
      tb.loai_thiet_bi_id,
      ltb.ma_loai,
      ltb.ten_loai,
      tb.trang_thai_thiet_bi_id,
      tttb.ma_trang_thai,
      tttb.ten_trang_thai,
      tb.tinh_trang_hien_tai
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    LEFT JOIN don_vi dv ON dv.don_vi_id = tb.don_vi_hien_tai_id
    LEFT JOIN loai_thiet_bi ltb ON ltb.loai_thiet_bi_id = tb.loai_thiet_bi_id
    ${whereClause}
    ORDER BY tb.updated_at DESC, tb.thiet_bi_id DESC
    LIMIT ? OFFSET ?
  `;
  const [items] = await executor.query(listSql, [...values, limit, offset]);

  return { items, totalItems };
};

const getChiPhiSuaChuaTheoThang = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = ['1 = 1'];

  if (filters.nam) {
    conditions.push('YEAR(nk.work_date) = ?');
    values.push(filters.nam);
  }
  if (filters.tu_thang) {
    conditions.push('MONTH(nk.work_date) >= ?');
    values.push(filters.tu_thang);
  }
  if (filters.den_thang) {
    conditions.push('MONTH(nk.work_date) <= ?');
    values.push(filters.den_thang);
  }

  const sql = `
    SELECT
      YEAR(nk.work_date) AS nam,
      MONTH(nk.work_date) AS thang,
      DATE_FORMAT(nk.work_date, '%Y-%m') AS ky_thang,
      SUM(nk.chi_phi) AS tong_chi_phi,
      COUNT(*) AS so_lan
    FROM (
      SELECT COALESCE(ngay_hoan_thanh, ngay_tiep_nhan, created_at) AS work_date, chi_phi
      FROM nhat_ky_bao_tri
    ) nk
    WHERE ${conditions.join(' AND ')}
    GROUP BY YEAR(nk.work_date), MONTH(nk.work_date), DATE_FORMAT(nk.work_date, '%Y-%m')
    ORDER BY YEAR(nk.work_date) ASC, MONTH(nk.work_date) ASC
  `;
  const [rows] = await executor.query(sql, values);
  return rows;
};

const getChiPhiSuaChuaTheoQuy = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = ['1 = 1'];

  if (filters.nam) {
    conditions.push('YEAR(nk.work_date) = ?');
    values.push(filters.nam);
  }
  if (filters.quy) {
    conditions.push('QUARTER(nk.work_date) = ?');
    values.push(filters.quy);
  }

  const sql = `
    SELECT
      YEAR(nk.work_date) AS nam,
      QUARTER(nk.work_date) AS quy,
      CONCAT('Q', QUARTER(MIN(nk.work_date)), '/', YEAR(MIN(nk.work_date))) AS ky_quy,
      SUM(nk.chi_phi) AS tong_chi_phi,
      COUNT(*) AS so_lan
    FROM (
      SELECT COALESCE(ngay_hoan_thanh, ngay_tiep_nhan, created_at) AS work_date, chi_phi
      FROM nhat_ky_bao_tri
    ) nk
    WHERE ${conditions.join(' AND ')}
    GROUP BY YEAR(nk.work_date), QUARTER(nk.work_date)
    ORDER BY YEAR(nk.work_date) ASC, QUARTER(nk.work_date) ASC
  `;
  const [rows] = await executor.query(sql, values);
  return rows;
};

const getChiPhiSuaChuaTheoNam = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = ['1 = 1'];

  if (filters.tu_nam) {
    conditions.push('YEAR(nk.work_date) >= ?');
    values.push(filters.tu_nam);
  }
  if (filters.den_nam) {
    conditions.push('YEAR(nk.work_date) <= ?');
    values.push(filters.den_nam);
  }

  const sql = `
    SELECT
      YEAR(nk.work_date) AS nam,
      SUM(nk.chi_phi) AS tong_chi_phi,
      COUNT(*) AS so_lan
    FROM (
      SELECT COALESCE(ngay_hoan_thanh, ngay_tiep_nhan, created_at) AS work_date, chi_phi
      FROM nhat_ky_bao_tri
    ) nk
    WHERE ${conditions.join(' AND ')}
    GROUP BY YEAR(nk.work_date)
    ORDER BY YEAR(nk.work_date) ASC
  `;
  const [rows] = await executor.query(sql, values);
  return rows;
};

const getLichSuDieuChuyen = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = ['1 = 1'];

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
  if (filters.tu_ngay) {
    conditions.push('DATE(ls.thoi_gian_thuc_hien) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(ls.thoi_gian_thuc_hien) <= ?');
    values.push(filters.den_ngay);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM lich_su_ban_giao_dieu_chuyen ls
    ${whereClause}
  `;
  const [countRows] = await executor.query(countSql, values);
  const totalItems = Number(countRows[0]?.total || 0);

  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const listSql = `
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
      creator.ho_ten AS ten_nguoi_tao
    FROM lich_su_ban_giao_dieu_chuyen ls
    INNER JOIN thiet_bi tb ON tb.thiet_bi_id = ls.thiet_bi_id
    LEFT JOIN don_vi tu_dv ON tu_dv.don_vi_id = ls.tu_don_vi_id
    LEFT JOIN don_vi den_dv ON den_dv.don_vi_id = ls.den_don_vi_id
    LEFT JOIN nguoi_dung tu_nd ON tu_nd.nguoi_dung_id = ls.tu_nguoi_phu_trach_id
    LEFT JOIN nguoi_dung den_nd ON den_nd.nguoi_dung_id = ls.den_nguoi_phu_trach_id
    LEFT JOIN nguoi_dung creator ON creator.nguoi_dung_id = ls.created_by
    ${whereClause}
    ORDER BY ls.thoi_gian_thuc_hien DESC, ls.lich_su_id DESC
    LIMIT ? OFFSET ?
  `;
  const [items] = await executor.query(listSql, [...values, limit, offset]);

  return { items, totalItems };
};

const getKetQuaKiemKeTheoKy = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = ['1 = 1'];

  if (filters.tu_ngay) {
    conditions.push('DATE(pkk.thoi_diem_bat_dau) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(pkk.thoi_diem_bat_dau) <= ?');
    values.push(filters.den_ngay);
  }
  if (filters.don_vi_id) {
    conditions.push('pkk.don_vi_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.trang_thai) {
    conditions.push('pkk.trang_thai = ?');
    values.push(filters.trang_thai);
  }

  return buildPaginatedResult({
    executor,
    baseSql: `
      SELECT
        pkk.phieu_kiem_ke_id,
        pkk.ma_phieu,
        pkk.ten_dot_kiem_ke,
        pkk.loai_pham_vi,
        pkk.don_vi_id,
        dv.ma_don_vi,
        dv.ten_don_vi,
        pkk.thoi_diem_bat_dau,
        pkk.thoi_diem_ket_thuc,
        pkk.trang_thai,
        COUNT(ctkk.chi_tiet_kiem_ke_id) AS tong_thiet_bi,
        SUM(CASE WHEN UPPER(REPLACE(ttkk.ma_tinh_trang, '_', '')) LIKE '%TOTDAT%' THEN 1 ELSE 0 END) AS so_luong_tot_dat,
        SUM(CASE WHEN UPPER(REPLACE(ttkk.ma_tinh_trang, '_', '')) = 'HONG' THEN 1 ELSE 0 END) AS so_luong_hong,
        SUM(CASE WHEN UPPER(REPLACE(ttkk.ma_tinh_trang, '_', '')) LIKE '%THIEUMAT%' THEN 1 ELSE 0 END) AS so_luong_thieu_mat,
        SUM(CASE WHEN UPPER(REPLACE(ttkk.ma_tinh_trang, '_', '')) LIKE '%SAIVITRI%' THEN 1 ELSE 0 END) AS so_luong_sai_vi_tri
      FROM phieu_kiem_ke pkk
      LEFT JOIN don_vi dv ON dv.don_vi_id = pkk.don_vi_id
      LEFT JOIN chi_tiet_kiem_ke ctkk ON ctkk.phieu_kiem_ke_id = pkk.phieu_kiem_ke_id
      LEFT JOIN tinh_trang_kiem_ke ttkk ON ttkk.tinh_trang_kiem_ke_id = ctkk.tinh_trang_kiem_ke_id
    `,
    whereClause: `WHERE ${conditions.join(' AND ')}`,
    groupByClause: `
      GROUP BY
        pkk.phieu_kiem_ke_id,
        pkk.ma_phieu,
        pkk.ten_dot_kiem_ke,
        pkk.loai_pham_vi,
        pkk.don_vi_id,
        dv.ma_don_vi,
        dv.ten_don_vi,
        pkk.thoi_diem_bat_dau,
        pkk.thoi_diem_ket_thuc,
        pkk.trang_thai
    `,
    orderByClause: 'ORDER BY pkk.thoi_diem_bat_dau DESC, pkk.phieu_kiem_ke_id DESC',
    values,
    page: filters.page || 1,
    limit: filters.limit || 20,
  });
};

const getThietBiDeXuatThanhLy = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = [];

  if (filters.trang_thai) {
    conditions.push('ptl.trang_thai = ?');
    values.push(filters.trang_thai);
  } else {
    conditions.push("ptl.trang_thai IN ('NHAP', 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI')");
  }
  if (filters.tu_ngay) {
    conditions.push('DATE(ptl.ngay_de_xuat) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(ptl.ngay_de_xuat) <= ?');
    values.push(filters.den_ngay);
  }
  if (filters.don_vi_id) {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.loai_thiet_bi_id) {
    conditions.push('tb.loai_thiet_bi_id = ?');
    values.push(filters.loai_thiet_bi_id);
  }
  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(ptl.ma_phieu LIKE ? OR tb.ma_tai_san LIKE ? OR tb.ten_thiet_bi LIKE ?)');
    values.push(keyword, keyword, keyword);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countSql = `
    SELECT COUNT(*) AS total
    FROM chi_tiet_thanh_ly cttl
    INNER JOIN phieu_thanh_ly ptl ON ptl.phieu_thanh_ly_id = cttl.phieu_thanh_ly_id
    INNER JOIN thiet_bi tb ON tb.thiet_bi_id = cttl.thiet_bi_id
    ${whereClause}
  `;
  const [countRows] = await executor.query(countSql, values);
  const totalItems = Number(countRows[0]?.total || 0);

  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const listSql = `
    SELECT
      cttl.chi_tiet_thanh_ly_id,
      cttl.phieu_thanh_ly_id,
      ptl.ma_phieu,
      ptl.trang_thai,
      ptl.ngay_de_xuat,
      cttl.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tb.don_vi_hien_tai_id,
      dv.ma_don_vi,
      dv.ten_don_vi,
      tb.loai_thiet_bi_id,
      ltb.ma_loai,
      ltb.ten_loai,
      cttl.ly_do_thanh_ly_id,
      ldtl.ma_ly_do,
      ldtl.ten_ly_do,
      cttl.tinh_trang_hien_tai,
      cttl.chi_phi_sua_chua_da_phat_sinh,
      cttl.gia_tri_thu_hoi_du_kien,
      cttl.ghi_chu
    FROM chi_tiet_thanh_ly cttl
    INNER JOIN phieu_thanh_ly ptl ON ptl.phieu_thanh_ly_id = cttl.phieu_thanh_ly_id
    INNER JOIN thiet_bi tb ON tb.thiet_bi_id = cttl.thiet_bi_id
    LEFT JOIN don_vi dv ON dv.don_vi_id = tb.don_vi_hien_tai_id
    LEFT JOIN loai_thiet_bi ltb ON ltb.loai_thiet_bi_id = tb.loai_thiet_bi_id
    INNER JOIN ly_do_thanh_ly ldtl ON ldtl.ly_do_thanh_ly_id = cttl.ly_do_thanh_ly_id
    ${whereClause}
    ORDER BY ptl.ngay_de_xuat DESC, cttl.chi_tiet_thanh_ly_id DESC
    LIMIT ? OFFSET ?
  `;
  const [items] = await executor.query(listSql, [...values, limit, offset]);

  return { items, totalItems };
};

const getThietBiDaThanhLy = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = ["ptl.trang_thai = 'HOAN_TAT'"];

  if (filters.tu_ngay) {
    conditions.push('DATE(ptl.ngay_hoan_tat) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(ptl.ngay_hoan_tat) <= ?');
    values.push(filters.den_ngay);
  }
  if (filters.don_vi_id) {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.loai_thiet_bi_id) {
    conditions.push('tb.loai_thiet_bi_id = ?');
    values.push(filters.loai_thiet_bi_id);
  }
  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(ptl.ma_phieu LIKE ? OR tb.ma_tai_san LIKE ? OR tb.ten_thiet_bi LIKE ?)');
    values.push(keyword, keyword, keyword);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const countSql = `
    SELECT COUNT(*) AS total
    FROM chi_tiet_thanh_ly cttl
    INNER JOIN phieu_thanh_ly ptl ON ptl.phieu_thanh_ly_id = cttl.phieu_thanh_ly_id
    INNER JOIN thiet_bi tb ON tb.thiet_bi_id = cttl.thiet_bi_id
    ${whereClause}
  `;
  const [countRows] = await executor.query(countSql, values);
  const totalItems = Number(countRows[0]?.total || 0);

  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const listSql = `
    SELECT
      cttl.chi_tiet_thanh_ly_id,
      cttl.phieu_thanh_ly_id,
      ptl.ma_phieu,
      ptl.ngay_de_xuat,
      ptl.ngay_hoan_tat,
      ptl.nguoi_hoan_tat_id,
      nd.ho_ten AS ten_nguoi_hoan_tat,
      cttl.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tb.don_vi_hien_tai_id,
      dv.ma_don_vi,
      dv.ten_don_vi,
      tb.loai_thiet_bi_id,
      ltb.ma_loai,
      ltb.ten_loai,
      cttl.ly_do_thanh_ly_id,
      ldtl.ma_ly_do,
      ldtl.ten_ly_do,
      cttl.tinh_trang_hien_tai,
      cttl.chi_phi_sua_chua_da_phat_sinh,
      cttl.gia_tri_thu_hoi_du_kien,
      cttl.ghi_chu
    FROM chi_tiet_thanh_ly cttl
    INNER JOIN phieu_thanh_ly ptl ON ptl.phieu_thanh_ly_id = cttl.phieu_thanh_ly_id
    INNER JOIN thiet_bi tb ON tb.thiet_bi_id = cttl.thiet_bi_id
    LEFT JOIN nguoi_dung nd ON nd.nguoi_dung_id = ptl.nguoi_hoan_tat_id
    LEFT JOIN don_vi dv ON dv.don_vi_id = tb.don_vi_hien_tai_id
    LEFT JOIN loai_thiet_bi ltb ON ltb.loai_thiet_bi_id = tb.loai_thiet_bi_id
    INNER JOIN ly_do_thanh_ly ldtl ON ldtl.ly_do_thanh_ly_id = cttl.ly_do_thanh_ly_id
    ${whereClause}
    ORDER BY ptl.ngay_hoan_tat DESC, cttl.chi_tiet_thanh_ly_id DESC
    LIMIT ? OFFSET ?
  `;
  const [items] = await executor.query(listSql, [...values, limit, offset]);

  return { items, totalItems };
};

module.exports = {
  getThietBiTheoLoai,
  getThietBiTheoDonVi,
  getThietBiTheoTrangThai,
  getThietBiSapHetBaoHanh,
  getThietBiHongHoacBaoTri,
  getChiPhiSuaChuaTheoThang,
  getChiPhiSuaChuaTheoQuy,
  getChiPhiSuaChuaTheoNam,
  getLichSuDieuChuyen,
  getKetQuaKiemKeTheoKy,
  getThietBiDeXuatThanhLy,
  getThietBiDaThanhLy,
};

