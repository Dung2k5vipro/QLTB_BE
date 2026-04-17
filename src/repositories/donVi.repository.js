const { pool } = require('../configs/db.config');

const SORT_COLUMN_MAP = {
  created_at: 'dv.created_at',
  updated_at: 'dv.updated_at',
  ma_don_vi: 'dv.ma_don_vi',
  ten_don_vi: 'dv.ten_don_vi',
  loai_don_vi: 'dv.loai_don_vi',
};

const BASE_SELECT_FIELDS = `
  dv.don_vi_id,
  dv.ma_don_vi,
  dv.ten_don_vi,
  dv.loai_don_vi,
  dv.parent_id,
  parent.ten_don_vi AS parent_ten_don_vi,
  dv.dia_diem,
  dv.mo_ta,
  dv.is_active,
  dv.created_at,
  dv.updated_at
`;

const appendFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(dv.ma_don_vi LIKE ? OR dv.ten_don_vi LIKE ? OR dv.dia_diem LIKE ? OR dv.mo_ta LIKE ?)');
    values.push(keyword, keyword, keyword, keyword);
  }

  if (filters.isActive !== undefined) {
    conditions.push('dv.is_active = ?');
    values.push(filters.isActive);
  }

  if (filters.loaiDonVi) {
    conditions.push('dv.loai_don_vi = ?');
    values.push(filters.loaiDonVi);
  }

  if (filters.parentId) {
    conditions.push('dv.parent_id = ?');
    values.push(filters.parentId);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const findOptions = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);

  const sql = `
    SELECT
      dv.don_vi_id,
      dv.ma_don_vi,
      dv.ten_don_vi,
      dv.loai_don_vi,
      dv.parent_id,
      dv.is_active
    FROM don_vi dv
    ${whereClause}
    ORDER BY dv.ten_don_vi ASC, dv.don_vi_id ASC
  `;

  const [rows] = await pool.query(sql, values);
  return rows;
};

const countDonVi = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    FROM don_vi dv
    ${whereClause}
  `;

  const [rows] = await pool.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findDonVi = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy] || SORT_COLUMN_MAP.created_at;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT ${BASE_SELECT_FIELDS}
    FROM don_vi dv
    LEFT JOIN don_vi parent ON parent.don_vi_id = dv.parent_id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}, dv.don_vi_id DESC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);
  const [rows] = await pool.query(sql, values);
  return rows;
};

const findById = async (donViId) => {
  const sql = `
    SELECT ${BASE_SELECT_FIELDS}
    FROM don_vi dv
    LEFT JOIN don_vi parent ON parent.don_vi_id = dv.parent_id
    WHERE dv.don_vi_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [donViId]);
  return rows[0] || null;
};

const existsByMaDonVi = async (maDonVi, excludeDonViId = null) => {
  if (!maDonVi) return false;

  let sql = 'SELECT don_vi_id FROM don_vi WHERE ma_don_vi = ?';
  const values = [maDonVi];

  if (excludeDonViId) {
    sql += ' AND don_vi_id <> ?';
    values.push(excludeDonViId);
  }

  sql += ' LIMIT 1';

  const [rows] = await pool.query(sql, values);
  return Boolean(rows[0]);
};

const createDonVi = async (payload) => {
  const sql = `
    INSERT INTO don_vi (
      ma_don_vi,
      ten_don_vi,
      loai_don_vi,
      parent_id,
      dia_diem,
      mo_ta,
      is_active,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await pool.query(sql, [
    payload.ma_don_vi,
    payload.ten_don_vi,
    payload.loai_don_vi,
    payload.parent_id ?? null,
    payload.dia_diem ?? null,
    payload.mo_ta ?? null,
    payload.is_active ?? 1,
  ]);

  return Number(result.insertId);
};

const updateDonViById = async (donViId, payload) => {
  const fieldMap = {
    ma_don_vi: 'ma_don_vi',
    ten_don_vi: 'ten_don_vi',
    loai_don_vi: 'loai_don_vi',
    parent_id: 'parent_id',
    dia_diem: 'dia_diem',
    mo_ta: 'mo_ta',
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
    UPDATE don_vi
    SET ${setClauses.join(', ')}
    WHERE don_vi_id = ?
  `;

  values.push(donViId);
  const [result] = await pool.query(sql, values);
  return result.affectedRows > 0;
};

const updateDonViStatus = async (donViId, isActive) => {
  const sql = `
    UPDATE don_vi
    SET is_active = ?, updated_at = NOW()
    WHERE don_vi_id = ?
  `;

  const [result] = await pool.query(sql, [isActive, donViId]);
  return result.affectedRows > 0;
};

module.exports = {
  findOptions,
  countDonVi,
  findDonVi,
  findById,
  existsByMaDonVi,
  createDonVi,
  updateDonViById,
  updateDonViStatus,
};

