const { pool } = require('../configs/db.config');

const SORT_COLUMN_MAP = {
  created_at: 'vt.created_at',
  updated_at: 'vt.updated_at',
  ma_vai_tro: 'vt.ma_vai_tro',
  ten_vai_tro: 'vt.ten_vai_tro',
  is_active: 'vt.is_active',
};

const BASE_SELECT = `
  vt.vai_tro_id,
  vt.ma_vai_tro,
  vt.ten_vai_tro,
  vt.mo_ta,
  vt.is_active,
  vt.created_at,
  vt.updated_at
`;

const appendFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(vt.ma_vai_tro LIKE ? OR vt.ten_vai_tro LIKE ? OR vt.mo_ta LIKE ?)');
    values.push(keyword, keyword, keyword);
  }

  if (filters.isActive !== undefined) {
    conditions.push('vt.is_active = ?');
    values.push(filters.isActive);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const findAll = async () => {
  const sql = `
    SELECT ${BASE_SELECT}
    FROM vai_tro vt
    ORDER BY vt.ten_vai_tro ASC, vt.vai_tro_id ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
};

const countRoles = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    FROM vai_tro vt
    ${whereClause}
  `;

  const [rows] = await pool.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findRoles = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);
  const sortColumn = SORT_COLUMN_MAP[filters.sortBy] || SORT_COLUMN_MAP.created_at;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT ${BASE_SELECT}
    FROM vai_tro vt
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}, vt.vai_tro_id DESC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);
  const [rows] = await pool.query(sql, values);
  return rows;
};

const findById = async (vaiTroId) => {
  const sql = `
    SELECT ${BASE_SELECT}
    FROM vai_tro vt
    WHERE vt.vai_tro_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [vaiTroId]);
  return rows[0] || null;
};

const findByCode = async (maVaiTro, excludeVaiTroId = null) => {
  let sql = `
    SELECT ${BASE_SELECT}
    FROM vai_tro vt
    WHERE UPPER(vt.ma_vai_tro) = UPPER(?)
  `;
  const values = [maVaiTro];

  if (excludeVaiTroId) {
    sql += ' AND vt.vai_tro_id <> ?';
    values.push(excludeVaiTroId);
  }

  sql += ' LIMIT 1';
  const [rows] = await pool.query(sql, values);
  return rows[0] || null;
};

const findAdminRole = async () => {
  const sql = `
    SELECT ${BASE_SELECT}
    FROM vai_tro vt
    WHERE UPPER(vt.ma_vai_tro) = 'ADMIN' OR UPPER(vt.ten_vai_tro) = 'ADMIN'
    ORDER BY vt.vai_tro_id ASC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql);
  return rows[0] || null;
};

const createRole = async (payload) => {
  const sql = `
    INSERT INTO vai_tro (
      ma_vai_tro,
      ten_vai_tro,
      mo_ta,
      is_active,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await pool.query(sql, [
    payload.ma_vai_tro,
    payload.ten_vai_tro,
    payload.mo_ta ?? null,
    payload.is_active ?? 1,
  ]);

  return Number(result.insertId);
};

const updateRoleById = async (vaiTroId, payload) => {
  const fieldMap = {
    ma_vai_tro: 'ma_vai_tro',
    ten_vai_tro: 'ten_vai_tro',
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
    UPDATE vai_tro
    SET ${setClauses.join(', ')}
    WHERE vai_tro_id = ?
  `;

  values.push(vaiTroId);
  const [result] = await pool.query(sql, values);
  return result.affectedRows > 0;
};

const updateRoleStatus = async (vaiTroId, isActive) => {
  const sql = `
    UPDATE vai_tro
    SET is_active = ?, updated_at = NOW()
    WHERE vai_tro_id = ?
  `;

  const [result] = await pool.query(sql, [isActive, vaiTroId]);
  return result.affectedRows > 0;
};

const countUsersByRoleId = async (vaiTroId) => {
  const sql = `
    SELECT COUNT(*) AS total
    FROM nguoi_dung
    WHERE vai_tro_id = ?
  `;

  const [rows] = await pool.query(sql, [vaiTroId]);
  return Number(rows[0]?.total || 0);
};

module.exports = {
  findAll,
  countRoles,
  findRoles,
  findById,
  findByCode,
  findAdminRole,
  createRole,
  updateRoleById,
  updateRoleStatus,
  countUsersByRoleId,
};

