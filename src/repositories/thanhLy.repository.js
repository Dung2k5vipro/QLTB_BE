const { pool } = require('../configs/db.config');

const PHIEU_SORT_COLUMN_MAP = {
  created_at: 'ptl.created_at',
  updated_at: 'ptl.updated_at',
  ngay_de_xuat: 'ptl.ngay_de_xuat',
  ma_phieu: 'ptl.ma_phieu',
  trang_thai: 'ptl.trang_thai',
};

const CHI_TIET_SORT_COLUMN_MAP = {
  chi_tiet_thanh_ly_id: 'cttl.chi_tiet_thanh_ly_id',
  created_at: 'cttl.created_at',
  ma_tai_san: 'tb.ma_tai_san',
  ten_thiet_bi: 'tb.ten_thiet_bi',
  chi_phi_sua_chua_da_phat_sinh: 'cttl.chi_phi_sua_chua_da_phat_sinh',
  gia_tri_thu_hoi_du_kien: 'cttl.gia_tri_thu_hoi_du_kien',
};

const PHIEU_BASE_SELECT = `
  ptl.phieu_thanh_ly_id,
  ptl.ma_phieu,
  ptl.nguoi_tao_id,
  nd_tao.ho_ten AS ten_nguoi_tao,
  ptl.ngay_de_xuat,
  ptl.trang_thai,
  ptl.nguoi_duyet_id,
  nd_duyet.ho_ten AS ten_nguoi_duyet,
  ptl.ngay_duyet,
  ptl.nguoi_hoan_tat_id,
  nd_hoan_tat.ho_ten AS ten_nguoi_hoan_tat,
  ptl.ngay_hoan_tat,
  ptl.ly_do_tu_choi,
  ptl.ghi_chu,
  ptl.created_at,
  ptl.updated_at
`;

const PHIEU_BASE_JOIN = `
  FROM phieu_thanh_ly ptl
  LEFT JOIN nguoi_dung nd_tao ON nd_tao.nguoi_dung_id = ptl.nguoi_tao_id
  LEFT JOIN nguoi_dung nd_duyet ON nd_duyet.nguoi_dung_id = ptl.nguoi_duyet_id
  LEFT JOIN nguoi_dung nd_hoan_tat ON nd_hoan_tat.nguoi_dung_id = ptl.nguoi_hoan_tat_id
`;

const CHI_TIET_BASE_SELECT = `
  cttl.chi_tiet_thanh_ly_id,
  cttl.phieu_thanh_ly_id,
  cttl.thiet_bi_id,
  tb.ma_tai_san,
  tb.ten_thiet_bi,
  tb.model,
  tb.so_serial,
  tb.don_vi_hien_tai_id,
  dv.ma_don_vi AS ma_don_vi_hien_tai,
  dv.ten_don_vi AS ten_don_vi_hien_tai,
  tb.trang_thai_thiet_bi_id,
  tttb.ma_trang_thai,
  tttb.ten_trang_thai,
  cttl.ly_do_thanh_ly_id,
  ldtl.ma_ly_do,
  ldtl.ten_ly_do,
  cttl.tinh_trang_hien_tai,
  cttl.chi_phi_sua_chua_da_phat_sinh,
  cttl.gia_tri_thu_hoi_du_kien,
  cttl.ghi_chu,
  cttl.created_at
`;

const CHI_TIET_BASE_JOIN = `
  FROM chi_tiet_thanh_ly cttl
  INNER JOIN thiet_bi tb ON tb.thiet_bi_id = cttl.thiet_bi_id
  INNER JOIN ly_do_thanh_ly ldtl ON ldtl.ly_do_thanh_ly_id = cttl.ly_do_thanh_ly_id
  INNER JOIN trang_thai_thiet_bi tttb ON tttb.trang_thai_thiet_bi_id = tb.trang_thai_thiet_bi_id
  LEFT JOIN don_vi dv ON dv.don_vi_id = tb.don_vi_hien_tai_id
`;

const resolveExecutor = (connection) => connection || pool;

const appendPhieuFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(ptl.ma_phieu LIKE ? OR ptl.ghi_chu LIKE ?)');
    values.push(keyword, keyword);
  }
  if (filters.trang_thai) {
    conditions.push('ptl.trang_thai = ?');
    values.push(filters.trang_thai);
  }
  if (filters.nguoi_tao_id) {
    conditions.push('ptl.nguoi_tao_id = ?');
    values.push(filters.nguoi_tao_id);
  }
  if (filters.nguoi_duyet_id) {
    conditions.push('ptl.nguoi_duyet_id = ?');
    values.push(filters.nguoi_duyet_id);
  }
  if (filters.tu_ngay) {
    conditions.push('DATE(ptl.ngay_de_xuat) >= ?');
    values.push(filters.tu_ngay);
  }
  if (filters.den_ngay) {
    conditions.push('DATE(ptl.ngay_de_xuat) <= ?');
    values.push(filters.den_ngay);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const appendChiTietFilters = (phieuThanhLyId, filters, values) => {
  const conditions = ['cttl.phieu_thanh_ly_id = ?'];
  values.push(phieuThanhLyId);

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(tb.ma_tai_san LIKE ? OR tb.ten_thiet_bi LIKE ? OR tb.so_serial LIKE ? OR tb.model LIKE ?)');
    values.push(keyword, keyword, keyword, keyword);
  }
  if (filters.ly_do_thanh_ly_id) {
    conditions.push('cttl.ly_do_thanh_ly_id = ?');
    values.push(filters.ly_do_thanh_ly_id);
  }
  if (filters.thiet_bi_id) {
    conditions.push('cttl.thiet_bi_id = ?');
    values.push(filters.thiet_bi_id);
  }

  return `WHERE ${conditions.join(' AND ')}`;
};

const getConnection = async () => {
  return pool.getConnection();
};

const countPhieuThanhLy = async (filters = {}, { connection } = {}) => {
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

const findPhieuThanhLyList = async (filters = {}, { connection } = {}) => {
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
    ORDER BY ${sortColumn} ${sortOrder}, ptl.phieu_thanh_ly_id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(limit, offset);

  const [rows] = await executor.query(sql, values);
  return rows;
};

const findPhieuThanhLyById = async (phieuThanhLyId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${PHIEU_BASE_SELECT}
    ${PHIEU_BASE_JOIN}
    WHERE ptl.phieu_thanh_ly_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [phieuThanhLyId]);
  return rows[0] || null;
};

const createPhieuThanhLy = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    INSERT INTO phieu_thanh_ly (
      ma_phieu,
      nguoi_tao_id,
      ngay_de_xuat,
      trang_thai,
      nguoi_duyet_id,
      ngay_duyet,
      nguoi_hoan_tat_id,
      ngay_hoan_tat,
      ly_do_tu_choi,
      ghi_chu,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;
  const [result] = await executor.query(sql, [
    payload.ma_phieu,
    payload.nguoi_tao_id,
    payload.ngay_de_xuat,
    payload.trang_thai,
    payload.nguoi_duyet_id ?? null,
    payload.ngay_duyet ?? null,
    payload.nguoi_hoan_tat_id ?? null,
    payload.ngay_hoan_tat ?? null,
    payload.ly_do_tu_choi ?? null,
    payload.ghi_chu ?? null,
  ]);
  return Number(result.insertId);
};

const updatePhieuThanhLyById = async (phieuThanhLyId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    ngay_de_xuat: 'ngay_de_xuat',
    trang_thai: 'trang_thai',
    nguoi_duyet_id: 'nguoi_duyet_id',
    ngay_duyet: 'ngay_duyet',
    nguoi_hoan_tat_id: 'nguoi_hoan_tat_id',
    ngay_hoan_tat: 'ngay_hoan_tat',
    ly_do_tu_choi: 'ly_do_tu_choi',
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
    UPDATE phieu_thanh_ly
    SET ${setClauses.join(', ')}
    WHERE phieu_thanh_ly_id = ?
  `;
  values.push(phieuThanhLyId);

  const [result] = await executor.query(sql, values);
  return result.affectedRows > 0;
};

const countChiTietThanhLyByPhieuId = async (phieuThanhLyId, filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendChiTietFilters(phieuThanhLyId, filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    ${CHI_TIET_BASE_JOIN}
    ${whereClause}
  `;
  const [rows] = await executor.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findChiTietThanhLyByPhieuId = async (phieuThanhLyId, filters = {}, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const values = [];
  const whereClause = appendChiTietFilters(phieuThanhLyId, filters, values);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;
  const sortColumn = CHI_TIET_SORT_COLUMN_MAP[filters.sortBy] || CHI_TIET_SORT_COLUMN_MAP.chi_tiet_thanh_ly_id;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const sql = `
    SELECT
      ${CHI_TIET_BASE_SELECT}
    ${CHI_TIET_BASE_JOIN}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}, cttl.chi_tiet_thanh_ly_id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(limit, offset);

  const [rows] = await executor.query(sql, values);
  return rows;
};

const findAllChiTietThanhLyByPhieuId = async (phieuThanhLyId, { connection, forUpdate = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${CHI_TIET_BASE_SELECT}
    ${CHI_TIET_BASE_JOIN}
    WHERE cttl.phieu_thanh_ly_id = ?
    ORDER BY cttl.chi_tiet_thanh_ly_id ASC
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [phieuThanhLyId]);
  return rows;
};

const findChiTietThanhLyById = async (
  phieuThanhLyId,
  chiTietThanhLyId,
  { connection, forUpdate = false } = {},
) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT
      ${CHI_TIET_BASE_SELECT}
    ${CHI_TIET_BASE_JOIN}
    WHERE cttl.phieu_thanh_ly_id = ?
      AND cttl.chi_tiet_thanh_ly_id = ?
    LIMIT 1
    ${forUpdate ? 'FOR UPDATE' : ''}
  `;
  const [rows] = await executor.query(sql, [phieuThanhLyId, chiTietThanhLyId]);
  return rows[0] || null;
};

const createChiTietThanhLyBatch = async (rows, { connection } = {}) => {
  if (!rows.length) return 0;

  const executor = resolveExecutor(connection);
  const sql = `
    INSERT INTO chi_tiet_thanh_ly (
      phieu_thanh_ly_id,
      thiet_bi_id,
      ly_do_thanh_ly_id,
      tinh_trang_hien_tai,
      chi_phi_sua_chua_da_phat_sinh,
      gia_tri_thu_hoi_du_kien,
      ghi_chu,
      created_at
    )
    VALUES ?
  `;

  const values = rows.map((row) => ([
    row.phieu_thanh_ly_id,
    row.thiet_bi_id,
    row.ly_do_thanh_ly_id,
    row.tinh_trang_hien_tai ?? null,
    row.chi_phi_sua_chua_da_phat_sinh ?? 0,
    row.gia_tri_thu_hoi_du_kien ?? 0,
    row.ghi_chu ?? null,
    new Date(),
  ]));

  const [result] = await executor.query(sql, [values]);
  return Number(result.affectedRows || 0);
};

const createChiTietThanhLy = async (payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    INSERT INTO chi_tiet_thanh_ly (
      phieu_thanh_ly_id,
      thiet_bi_id,
      ly_do_thanh_ly_id,
      tinh_trang_hien_tai,
      chi_phi_sua_chua_da_phat_sinh,
      gia_tri_thu_hoi_du_kien,
      ghi_chu,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
  `;
  const [result] = await executor.query(sql, [
    payload.phieu_thanh_ly_id,
    payload.thiet_bi_id,
    payload.ly_do_thanh_ly_id,
    payload.tinh_trang_hien_tai ?? null,
    payload.chi_phi_sua_chua_da_phat_sinh ?? 0,
    payload.gia_tri_thu_hoi_du_kien ?? 0,
    payload.ghi_chu ?? null,
  ]);
  return Number(result.insertId);
};

const updateChiTietThanhLyById = async (chiTietThanhLyId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    thiet_bi_id: 'thiet_bi_id',
    ly_do_thanh_ly_id: 'ly_do_thanh_ly_id',
    tinh_trang_hien_tai: 'tinh_trang_hien_tai',
    chi_phi_sua_chua_da_phat_sinh: 'chi_phi_sua_chua_da_phat_sinh',
    gia_tri_thu_hoi_du_kien: 'gia_tri_thu_hoi_du_kien',
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

  const sql = `
    UPDATE chi_tiet_thanh_ly
    SET ${setClauses.join(', ')}
    WHERE chi_tiet_thanh_ly_id = ?
  `;
  values.push(chiTietThanhLyId);

  const [result] = await executor.query(sql, values);
  return result.affectedRows > 0;
};

const deleteChiTietThanhLyById = async (phieuThanhLyId, chiTietThanhLyId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    DELETE FROM chi_tiet_thanh_ly
    WHERE phieu_thanh_ly_id = ?
      AND chi_tiet_thanh_ly_id = ?
  `;
  const [result] = await executor.query(sql, [phieuThanhLyId, chiTietThanhLyId]);
  return Number(result.affectedRows || 0);
};

const findLyDoThanhLyById = async (lyDoThanhLyId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT ly_do_thanh_ly_id, ma_ly_do, ten_ly_do, is_active
    FROM ly_do_thanh_ly
    WHERE ly_do_thanh_ly_id = ?
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [lyDoThanhLyId]);
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

const findTrangThaiThietBiList = async ({ connection, activeOnly = false } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT trang_thai_thiet_bi_id, ma_trang_thai, ten_trang_thai, is_terminal, is_active
    FROM trang_thai_thiet_bi
    ${activeOnly ? 'WHERE is_active = 1' : ''}
    ORDER BY thu_tu_hien_thi ASC, trang_thai_thiet_bi_id ASC
  `;
  const [rows] = await executor.query(sql);
  return rows;
};

const findOpenBaoHongByDeviceId = async (
  thietBiId,
  {
    connection,
    openStatuses = ['CHO_XU_LY', 'DA_TIEP_NHAN', 'DANG_XU_LY', 'CHO_LINH_KIEN'],
  } = {},
) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT phieu_bao_hong_id, ma_phieu, trang_thai
    FROM phieu_bao_hong
    WHERE thiet_bi_id = ?
      AND trang_thai IN (${openStatuses.map(() => '?').join(', ')})
    ORDER BY phieu_bao_hong_id DESC
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [thietBiId, ...openStatuses]);
  return rows[0] || null;
};

const findOpenKiemKeByDeviceId = async (
  thietBiId,
  {
    connection,
    openStatuses = ['NHAP', 'DANG_KIEM_KE', 'CHO_XAC_NHAN'],
  } = {},
) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT pkk.phieu_kiem_ke_id, pkk.ma_phieu, pkk.trang_thai
    FROM chi_tiet_kiem_ke ctkk
    INNER JOIN phieu_kiem_ke pkk ON pkk.phieu_kiem_ke_id = ctkk.phieu_kiem_ke_id
    WHERE ctkk.thiet_bi_id = ?
      AND pkk.trang_thai IN (${openStatuses.map(() => '?').join(', ')})
    ORDER BY pkk.phieu_kiem_ke_id DESC
    LIMIT 1
  `;
  const [rows] = await executor.query(sql, [thietBiId, ...openStatuses]);
  return rows[0] || null;
};

const findOpenThanhLyByDeviceId = async (
  thietBiId,
  {
    connection,
    excludePhieuThanhLyId = null,
    openStatuses = ['NHAP', 'CHO_DUYET', 'DA_DUYET'],
  } = {},
) => {
  const executor = resolveExecutor(connection);
  const values = [thietBiId, ...openStatuses];
  let sql = `
    SELECT ptl.phieu_thanh_ly_id, ptl.ma_phieu, ptl.trang_thai
    FROM chi_tiet_thanh_ly cttl
    INNER JOIN phieu_thanh_ly ptl ON ptl.phieu_thanh_ly_id = cttl.phieu_thanh_ly_id
    WHERE cttl.thiet_bi_id = ?
      AND ptl.trang_thai IN (${openStatuses.map(() => '?').join(', ')})
  `;

  if (excludePhieuThanhLyId) {
    sql += ' AND ptl.phieu_thanh_ly_id <> ?';
    values.push(excludePhieuThanhLyId);
  }

  sql += ' ORDER BY ptl.phieu_thanh_ly_id DESC LIMIT 1';

  const [rows] = await executor.query(sql, values);
  return rows[0] || null;
};

const updateDeviceById = async (thietBiId, payload, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const fieldMap = {
    trang_thai_thiet_bi_id: 'trang_thai_thiet_bi_id',
    tinh_trang_hien_tai: 'tinh_trang_hien_tai',
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

const countNhatKyByPhieuId = async (phieuThanhLyId, { connection } = {}) => {
  const executor = resolveExecutor(connection);
  const sql = `
    SELECT COUNT(*) AS total
    FROM nhat_ky_he_thong
    WHERE entity_name = 'phieu_thanh_ly'
      AND entity_id = ?
      AND module = 'THANH_LY'
  `;
  const [rows] = await executor.query(sql, [phieuThanhLyId]);
  return Number(rows[0]?.total || 0);
};

const findNhatKyByPhieuId = async (
  phieuThanhLyId,
  { page = 1, limit = 20 } = {},
  { connection } = {},
) => {
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
    WHERE entity_name = 'phieu_thanh_ly'
      AND entity_id = ?
      AND module = 'THANH_LY'
    ORDER BY created_at DESC, nhat_ky_id DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await executor.query(sql, [phieuThanhLyId, Number(limit), Number(offset)]);
  return rows;
};

module.exports = {
  getConnection,
  countPhieuThanhLy,
  findPhieuThanhLyList,
  findPhieuThanhLyById,
  createPhieuThanhLy,
  updatePhieuThanhLyById,
  countChiTietThanhLyByPhieuId,
  findChiTietThanhLyByPhieuId,
  findAllChiTietThanhLyByPhieuId,
  findChiTietThanhLyById,
  createChiTietThanhLyBatch,
  createChiTietThanhLy,
  updateChiTietThanhLyById,
  deleteChiTietThanhLyById,
  findLyDoThanhLyById,
  findNguoiDungById,
  findDeviceById,
  findTrangThaiThietBiList,
  findOpenBaoHongByDeviceId,
  findOpenKiemKeByDeviceId,
  findOpenThanhLyByDeviceId,
  updateDeviceById,
  createDeviceStatusHistory,
  countNhatKyByPhieuId,
  findNhatKyByPhieuId,
};


