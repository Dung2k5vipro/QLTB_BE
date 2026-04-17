const { pool } = require('../configs/db.config');

const SORT_COLUMN_MAP = {
  created_at: 'nk.created_at',
  module: 'nk.module',
  hanh_dong: 'nk.hanh_dong',
  nguoi_dung_id: 'nk.nguoi_dung_id',
};

const BASE_SELECT = `
  nk.nhat_ky_id,
  nk.nguoi_dung_id,
  nd.ho_ten AS ten_nguoi_dung,
  nd.email,
  vt.ma_vai_tro,
  vt.ten_vai_tro,
  nk.module,
  nk.hanh_dong,
  nk.entity_name,
  nk.entity_id,
  nk.du_lieu_cu,
  nk.du_lieu_moi,
  nk.ghi_chu,
  nk.ip_address,
  nk.created_at
`;

const BASE_JOIN = `
  FROM nhat_ky_he_thong nk
  LEFT JOIN nguoi_dung nd ON nd.nguoi_dung_id = nk.nguoi_dung_id
  LEFT JOIN vai_tro vt ON vt.vai_tro_id = nd.vai_tro_id
`;

const appendFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(nk.ghi_chu LIKE ? OR nk.entity_name LIKE ? OR CAST(nk.entity_id AS CHAR) LIKE ? OR nk.ip_address LIKE ?)');
    values.push(keyword, keyword, keyword, keyword);
  }

  if (filters.module) {
    conditions.push('UPPER(nk.module) = UPPER(?)');
    values.push(filters.module);
  }

  if (filters.hanh_dong) {
    conditions.push('UPPER(nk.hanh_dong) = UPPER(?)');
    values.push(filters.hanh_dong);
  }

  if (filters.nguoi_dung_id) {
    conditions.push('nk.nguoi_dung_id = ?');
    values.push(filters.nguoi_dung_id);
  }

  if (filters.tu_ngay) {
    conditions.push('DATE(nk.created_at) >= ?');
    values.push(filters.tu_ngay);
  }

  if (filters.den_ngay) {
    conditions.push('DATE(nk.created_at) <= ?');
    values.push(filters.den_ngay);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const countNhatKyHeThong = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    ${BASE_JOIN}
    ${whereClause}
  `;

  const [rows] = await pool.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findNhatKyHeThong = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);
  const sortColumn = SORT_COLUMN_MAP[filters.sortBy] || SORT_COLUMN_MAP.created_at;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT ${BASE_SELECT}
    ${BASE_JOIN}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}, nk.nhat_ky_id DESC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);
  const [rows] = await pool.query(sql, values);
  return rows;
};

const findNhatKyHeThongById = async (nhatKyId) => {
  const sql = `
    SELECT ${BASE_SELECT}
    ${BASE_JOIN}
    WHERE nk.nhat_ky_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [nhatKyId]);
  return rows[0] || null;
};

module.exports = {
  countNhatKyHeThong,
  findNhatKyHeThong,
  findNhatKyHeThongById,
};
