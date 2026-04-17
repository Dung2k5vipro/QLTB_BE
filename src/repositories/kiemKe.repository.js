const { pool } = require('../configs/db.config');

const PHIEU_SORT_COLUMN_MAP = {
  created_at: 'pkk.created_at',
  updated_at: 'pkk.updated_at',
  thoi_diem_bat_dau: 'pkk.thoi_diem_bat_dau',
  thoi_diem_ket_thuc: 'pkk.thoi_diem_ket_thuc',
  ma_phieu: 'pkk.ma_phieu',
  ten_dot_kiem_ke: 'pkk.ten_dot_kiem_ke',
  trang_thai: 'pkk.trang_thai',
};

const CHI_TIET_SORT_COLUMN_MAP = {
  chi_tiet_kiem_ke_id: 'ctkk.chi_tiet_kiem_ke_id',
  updated_at: 'ctkk.updated_at',
  thoi_gian_kiem_ke: 'ctkk.thoi_gian_kiem_ke',
  ma_tai_san: 'tb.ma_tai_san',
  ten_thiet_bi: 'tb.ten_thiet_bi',
};

const PHIEU_BASE_SELECT = `
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
  pkk.nguoi_tao_id,
  nd_tao.ho_ten AS ten_nguoi_tao,
  pkk.nguoi_xac_nhan_id,
  nd_xac_nhan.ho_ten AS ten_nguoi_xac_nhan,
  pkk.ghi_chu,
  pkk.created_at,
  pkk.updated_at
`;

const PHIEU_BASE_JOIN = `
  FROM phieu_kiem_ke pkk
  LEFT JOIN don_vi dv ON dv.don_vi_id = pkk.don_vi_id
  LEFT JOIN nguoi_dung nd_tao ON nd_tao.nguoi_dung_id = pkk.nguoi_tao_id
  LEFT JOIN nguoi_dung nd_xac_nhan ON nd_xac_nhan.nguoi_dung_id = pkk.nguoi_xac_nhan_id
`;

const CHI_TIET_BASE_SELECT = `
  ctkk.chi_tiet_kiem_ke_id,
  ctkk.phieu_kiem_ke_id,
  ctkk.thiet_bi_id,
  tb.ma_tai_san,
  tb.ten_thiet_bi,
  tb.model,
  tb.so_serial,
  tb.don_vi_hien_tai_id,
  dv_tb.ma_don_vi AS ma_don_vi_hien_tai,
  dv_tb.ten_don_vi AS ten_don_vi_hien_tai,
  ctkk.tinh_trang_kiem_ke_id,
  ttkk.ma_tinh_trang,
  ttkk.ten_tinh_trang,
  ctkk.don_vi_thuc_te_id,
  dvtt.ma_don_vi AS ma_don_vi_thuc_te,
  dvtt.ten_don_vi AS ten_don_vi_thuc_te,
  ctkk.ghi_chu,
  ctkk.nguoi_kiem_ke_id,
  ndkk.ho_ten AS ten_nguoi_kiem_ke,
  ctkk.thoi_gian_kiem_ke,
  ctkk.created_at,
  ctkk.updated_at
`;

const CHI_TIET_BASE_JOIN = `
  FROM chi_tiet_kiem_ke ctkk
  INNER JOIN thiet_bi tb ON tb.thiet_bi_id = ctkk.thiet_bi_id
  INNER JOIN tinh_trang_kiem_ke ttkk ON ttkk.tinh_trang_kiem_ke_id = ctkk.tinh_trang_kiem_ke_id
  LEFT JOIN don_vi dv_tb ON dv_tb.don_vi_id = tb.don_vi_hien_tai_id
  LEFT JOIN don_vi dvtt ON dvtt.don_vi_id = ctkk.don_vi_thuc_te_id
  LEFT JOIN nguoi_dung ndkk ON ndkk.nguoi_dung_id = ctkk.nguoi_kiem_ke_id
`;

const resolveExecutor = (connection) => connection || pool;

const appendPhieuFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(pkk.ma_phieu LIKE ? OR pkk.ten_dot_kiem_ke LIKE ?)');
    values.push(keyword, keyword);
  }
  if (filters.trang_thai) {
    conditions.push('pkk.trang_thai = ?');
    values.push(filters.trang_thai);
  }
  if (filters.loai_pham_vi) {
    conditions.push('pkk.loai_pham_vi = ?');
    values.push(filters.loai_pham_vi);
  }
  if (filters.don_vi_id) {
    conditions.push('pkk.don_vi_id = ?');
    values.push(filters.don_vi_id);
  }
  if (filters.tu_ngay) {
    conditions.push('DATE(pkk.thoi_diem_bat_dau) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(pkk.thoi_diem_bat_dau) <= ?');
    values.push(filters.den_ngay);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const appendChiTietFilters = (phieuKiemKeId, filters, values) => {
  const conditions = ['ctkk.phieu_kiem_ke_id = ?'];
  values.push(phieuKiemKeId);

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(tb.ma_tai_san LIKE ? OR tb.ten_thiet_bi LIKE ? OR tb.model LIKE ? OR tb.so_serial LIKE ?)');
    values.push(keyword, keyword, keyword, keyword);
  }
  if (filters.tinh_trang_kiem_ke_id) {
    conditions.push('ctkk.tinh_trang_kiem_ke_id = ?');
    values.push(filters.tinh_trang_kiem_ke_id);
  }
  if (filters.nguoi_kiem_ke_id) {
    conditions.push('ctkk.nguoi_kiem_ke_id = ?');
    values.push(filters.nguoi_kiem_ke_id);
  }
  if (filters.don_vi_thuc_te_id) {
    conditions.push('ctkk.don_vi_thuc_te_id = ?');
    values.push(filters.don_vi_thuc_te_id);
  }

  return `WHERE ${conditions.join(' AND ')}`;
};

const getConnection = async () => {
  return pool.getConnection();
};

const countPhieuKiemKe = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendPhieuFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    ${PHIEU_BASE_JOIN}
    ${whereClause}
  `;
  const [rows] = await executor.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findPhieuKiemKeList = async (filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendPhieuFilters(filters, values);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;
  const sortColumn = PHIEU_SORT_COLUMN_MAP[filters.sortBy] || PHIEU_SORT_COLUMN_MAP.created_at;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const sql = `
    SELECT
      ${PHIEU_BASE_SELECT}
    ${PHIEU_BASE_JOIN}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}, pkk.phieu_kiem_ke_id DESC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);
  const [rows] = await executor.query(sql, values);
  return rows;
};

const findPhieuKiemKeById = async (phieuKiemKeId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${PHIEU_BASE_SELECT}
    ${PHIEU_BASE_JOIN}
    WHERE pkk.phieu_kiem_ke_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [phieuKiemKeId]);
  return rows[0] || null;
};

const createPhieuKiemKe = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    INSERT INTO phieu_kiem_ke (
      ma_phieu,
      ten_dot_kiem_ke,
      loai_pham_vi,
      don_vi_id,
      thoi_diem_bat_dau,
      thoi_diem_ket_thuc,
      trang_thai,
      nguoi_tao_id,
      nguoi_xac_nhan_id,
      ghi_chu,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await executor.query(sql, [
    payload.ma_phieu,
    payload.ten_dot_kiem_ke,
    payload.loai_pham_vi,
    payload.don_vi_id ?? null,
    payload.thoi_diem_bat_dau,
    payload.thoi_diem_ket_thuc ?? null,
    payload.trang_thai,
    payload.nguoi_tao_id,
    payload.nguoi_xac_nhan_id ?? null,
    payload.ghi_chu ?? null,
  ]);
  return Number(result.insertId);
};

const updatePhieuKiemKeById = async (phieuKiemKeId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    ten_dot_kiem_ke: 'ten_dot_kiem_ke',
    loai_pham_vi: 'loai_pham_vi',
    don_vi_id: 'don_vi_id',
    thoi_diem_bat_dau: 'thoi_diem_bat_dau',
    thoi_diem_ket_thuc: 'thoi_diem_ket_thuc',
    trang_thai: 'trang_thai',
    nguoi_xac_nhan_id: 'nguoi_xac_nhan_id',
    ghi_chu: 'ghi_chu',
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
    UPDATE phieu_kiem_ke
    SET ${setClauses.join(', ')}
    WHERE phieu_kiem_ke_id = ?
  `;
  values.push(phieuKiemKeId);

  const [result] = await executor.query(sql, values);
  return result.affectedRows > 0;
};

const findDevicesForScope = async (
  { loai_pham_vi, don_vi_id },
  { connection, forUpdate = false } = {},
) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const conditions = ['1 = 1'];

  if (loai_pham_vi === 'THEO_DON_VI') {
    conditions.push('tb.don_vi_hien_tai_id = ?');
    values.push(don_vi_id);
  }

  const sql = `
    SELECT
      tb.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tb.don_vi_hien_tai_id,
      tb.trang_thai_thiet_bi_id,
      tb.tinh_trang_hien_tai,
      tttb.ma_trang_thai,
      tttb.ten_trang_thai
    FROM thiet_bi tb
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY tb.thiet_bi_id ASC
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;

  const [rows] = await executor.query(sql, values);
  return rows;
};

const createChiTietKiemKeBatch = async (rows, { connection } = {}) => {
  if (!rows.length) return 0;

  const executor = resolveExecutor(connection);
  const sql = `
    INSERT INTO chi_tiet_kiem_ke (
      phieu_kiem_ke_id,
      thiet_bi_id,
      tinh_trang_kiem_ke_id,
      don_vi_thuc_te_id,
      ghi_chu,
      nguoi_kiem_ke_id,
      thoi_gian_kiem_ke,
      created_at,
      updated_at
    )
    VALUES ?
  `;

  const values = rows.map((row) => [
    row.phieu_kiem_ke_id,
    row.thiet_bi_id,
    row.tinh_trang_kiem_ke_id,
    row.don_vi_thuc_te_id ?? null,
    row.ghi_chu ?? null,
    row.nguoi_kiem_ke_id ?? null,
    row.thoi_gian_kiem_ke ?? null,
    new Date(),
    new Date(),
  ]);

  const [result] = await executor.query(sql, [values]);
  return Number(result.affectedRows || 0);
};

const deleteChiTietByPhieuId = async (phieuKiemKeId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    DELETE FROM chi_tiet_kiem_ke
    WHERE phieu_kiem_ke_id = ?
  `;
  const [result] = await executor.query(sql, [phieuKiemKeId]);
  return Number(result.affectedRows || 0);
};

const countChiTietKiemKeByPhieuId = async (phieuKiemKeId, filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendChiTietFilters(phieuKiemKeId, filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    ${CHI_TIET_BASE_JOIN}
    ${whereClause}
  `;
  const [rows] = await executor.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findChiTietKiemKeByPhieuId = async (phieuKiemKeId, filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendChiTietFilters(phieuKiemKeId, filters, values);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;
  const sortColumn = CHI_TIET_SORT_COLUMN_MAP[filters.sortBy] || CHI_TIET_SORT_COLUMN_MAP.chi_tiet_kiem_ke_id;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const sql = `
    SELECT
      ${CHI_TIET_BASE_SELECT}
    ${CHI_TIET_BASE_JOIN}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}, ctkk.chi_tiet_kiem_ke_id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(limit, offset);

  const [rows] = await executor.query(sql, values);
  return rows;
};

const findAllChiTietKiemKeByPhieuId = async (phieuKiemKeId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${CHI_TIET_BASE_SELECT}
    ${CHI_TIET_BASE_JOIN}
    WHERE ctkk.phieu_kiem_ke_id = ?
    ORDER BY ctkk.chi_tiet_kiem_ke_id ASC
  `;
  const [rows] = await executor.query(sql, [phieuKiemKeId]);
  return rows;
};

const findChiTietKiemKeById = async (
  phieuKiemKeId,
  chiTietKiemKeId,
  { connection, forUpdate = false } = {},
) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${CHI_TIET_BASE_SELECT}
    ${CHI_TIET_BASE_JOIN}
    WHERE ctkk.phieu_kiem_ke_id = ?
      AND ctkk.chi_tiet_kiem_ke_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [phieuKiemKeId, chiTietKiemKeId]);
  return rows[0] || null;
};

const updateChiTietKiemKeById = async (chiTietKiemKeId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    tinh_trang_kiem_ke_id: 'tinh_trang_kiem_ke_id',
    don_vi_thuc_te_id: 'don_vi_thuc_te_id',
    ghi_chu: 'ghi_chu',
    nguoi_kiem_ke_id: 'nguoi_kiem_ke_id',
    thoi_gian_kiem_ke: 'thoi_gian_kiem_ke',
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
    UPDATE chi_tiet_kiem_ke
    SET ${setClauses.join(', ')}
    WHERE chi_tiet_kiem_ke_id = ?
  `;
  values.push(chiTietKiemKeId);

  const [result] = await executor.query(sql, values);
  return result.affectedRows > 0;
};

const countPendingChiTietByPhieuId = async (phieuKiemKeId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COUNT(*) AS total
    FROM chi_tiet_kiem_ke ctkk
    LEFT JOIN tinh_trang_kiem_ke ttkk ON ttkk.tinh_trang_kiem_ke_id = ctkk.tinh_trang_kiem_ke_id
    WHERE phieu_kiem_ke_id = ?
      AND (
        ctkk.tinh_trang_kiem_ke_id IS NULL
        OR ctkk.nguoi_kiem_ke_id IS NULL
        OR ctkk.thoi_gian_kiem_ke IS NULL
        OR REPLACE(REPLACE(REPLACE(REPLACE(UPPER(IFNULL(ttkk.ma_tinh_trang, '')), '_', ''), '-', ''), ' ', ''), '.', '') IN (
          'CHUAKIEMKE',
          'CHUACOKETQUA',
          'CHOKIEMKE'
        )
      )
  `;
  const [rows] = await executor.query(sql, [phieuKiemKeId]);
  return Number(rows[0]?.total || 0);
};

const findChiTietForDongBoByPhieuId = async (phieuKiemKeId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ctkk.chi_tiet_kiem_ke_id,
      ctkk.phieu_kiem_ke_id,
      ctkk.thiet_bi_id,
      ctkk.tinh_trang_kiem_ke_id,
      ttkk.ma_tinh_trang,
      ttkk.ten_tinh_trang,
      ctkk.don_vi_thuc_te_id,
      ctkk.ghi_chu,
      ctkk.nguoi_kiem_ke_id,
      ctkk.thoi_gian_kiem_ke,
      tb.don_vi_hien_tai_id,
      tb.trang_thai_thiet_bi_id,
      tb.tinh_trang_hien_tai,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tttb.ma_trang_thai AS ma_trang_thai_thiet_bi,
      tttb.ten_trang_thai AS ten_trang_thai_thiet_bi
    FROM chi_tiet_kiem_ke ctkk
    INNER JOIN tinh_trang_kiem_ke ttkk ON ttkk.tinh_trang_kiem_ke_id = ctkk.tinh_trang_kiem_ke_id
    INNER JOIN thiet_bi tb ON tb.thiet_bi_id = ctkk.thiet_bi_id
    INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
    WHERE ctkk.phieu_kiem_ke_id = ?
    ORDER BY ctkk.chi_tiet_kiem_ke_id ASC
  `;
  const [rows] = await executor.query(sql, [phieuKiemKeId]);
  return rows;
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
    SELECT nd.nguoi_dung_id, nd.ho_ten, nd.trang_thai_tai_khoan, nd.vai_tro_id, vt.ma_vai_tro
    FROM nguoi_dung nd
    LEFT JOIN vai_tro vt ON vt.vai_tro_id = nd.vai_tro_id
    WHERE nd.nguoi_dung_id = ?
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [nguoiDungId]);
  return rows[0] || null;
};

const findTinhTrangKiemKeById = async (tinhTrangKiemKeId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT tinh_trang_kiem_ke_id, ma_tinh_trang, ten_tinh_trang, is_active
    FROM tinh_trang_kiem_ke
    WHERE tinh_trang_kiem_ke_id = ?
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [tinhTrangKiemKeId]);
  return rows[0] || null;
};

const findTinhTrangKiemKeByCode = async (maTinhTrang, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT tinh_trang_kiem_ke_id, ma_tinh_trang, ten_tinh_trang, is_active
    FROM tinh_trang_kiem_ke
    WHERE UPPER(ma_tinh_trang) = UPPER(?)
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [maTinhTrang]);
  return rows[0] || null;
};

const findActiveTinhTrangKiemKeList = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT tinh_trang_kiem_ke_id, ma_tinh_trang, ten_tinh_trang, is_active
    FROM tinh_trang_kiem_ke
    WHERE is_active = 1
    ORDER BY tinh_trang_kiem_ke_id ASC
  `;
  const [rows] = await executor.query(sql);
  return rows;
};

const ensureDefaultTinhTrangKiemKe = async ({ connection } = {}) => {
  const executor = resolveExecutor(connection);
  const defaultCode = 'CHUA_KIEM_KE';
  const defaultName = 'Chưa kiểm kê';
  const defaultDescription = 'Trạng thái đầu kỳ mặc định cho chi tiết kiểm kê mới';

  const existing = await findTinhTrangKiemKeByCode(defaultCode, { connection });
  if (existing) {
    await executor.query(
      `
        UPDATE tinh_trang_kiem_ke
        SET ten_tinh_trang = ?, mo_ta = ?, is_active = 1
        WHERE tinh_trang_kiem_ke_id = ?
      `,
      [defaultName, defaultDescription, existing.tinh_trang_kiem_ke_id],
    );

    return findTinhTrangKiemKeByCode(defaultCode, { connection });
  }

  await executor.query(
    `
      INSERT INTO tinh_trang_kiem_ke (
        ma_tinh_trang,
        ten_tinh_trang,
        mo_ta,
        is_active
      )
      VALUES (?, ?, ?, 1)
    `,
    [defaultCode, defaultName, defaultDescription],
  );

  return findTinhTrangKiemKeByCode(defaultCode, { connection });
};

const findTrangThaiThietBiList = async ({ connection, activeOnly = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT trang_thai_thiet_bi_id, ma_trang_thai, ten_trang_thai, is_active
    FROM trang_thai_thiet_bi
    ${activeOnly ? 'WHERE is_active = 1' : ''}
    ORDER BY trang_thai_thiet_bi_id ASC
  `;
  const [rows] = await executor.query(sql);
  return rows;
};

const findDeviceById = async (thietBiId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      tb.thiet_bi_id,
      tb.ma_tai_san,
      tb.ten_thiet_bi,
      tb.don_vi_hien_tai_id,
      tb.trang_thai_thiet_bi_id,
      tb.tinh_trang_hien_tai,
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

const updateDeviceById = async (thietBiId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    don_vi_hien_tai_id: 'don_vi_hien_tai_id',
    tinh_trang_hien_tai: 'tinh_trang_hien_tai',
    trang_thai_thiet_bi_id: 'trang_thai_thiet_bi_id',
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

const countNhatKyByPhieuId = async (phieuKiemKeId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COUNT(*) AS total
    FROM nhat_ky_he_thong
    WHERE entity_name = 'phieu_kiem_ke'
      AND entity_id = ?
      AND module = 'KIEM_KE'
  `;
  const [rows] = await executor.query(sql, [phieuKiemKeId]);
  return Number(rows[0]?.total || 0);
};

const findNhatKyByPhieuId = async (phieuKiemKeId, { page = 1, limit = 20 } = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const offset = (Number(page) - 1) * Number(limit);
  const sql = `
    SELECT
      nhat_ky_id,
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
    FROM nhat_ky_he_thong
    WHERE entity_name = 'phieu_kiem_ke'
      AND entity_id = ?
      AND module = 'KIEM_KE'
    ORDER BY created_at DESC, nhat_ky_id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await executor.query(sql, [phieuKiemKeId, Number(limit), Number(offset)]);
  return rows;
};

module.exports = {
  getConnection,
  countPhieuKiemKe,
  findPhieuKiemKeList,
  findPhieuKiemKeById,
  createPhieuKiemKe,
  updatePhieuKiemKeById,
  findDevicesForScope,
  createChiTietKiemKeBatch,
  deleteChiTietByPhieuId,
  countChiTietKiemKeByPhieuId,
  findChiTietKiemKeByPhieuId,
  findAllChiTietKiemKeByPhieuId,
  findChiTietKiemKeById,
  updateChiTietKiemKeById,
  countPendingChiTietByPhieuId,
  findChiTietForDongBoByPhieuId,
  findDonViById,
  findNguoiDungById,
  findTinhTrangKiemKeById,
  findTinhTrangKiemKeByCode,
  findActiveTinhTrangKiemKeList,
  ensureDefaultTinhTrangKiemKe,
  findTrangThaiThietBiList,
  findDeviceById,
  updateDeviceById,
  createDeviceStatusHistory,
  countNhatKyByPhieuId,
  findNhatKyByPhieuId,
};

