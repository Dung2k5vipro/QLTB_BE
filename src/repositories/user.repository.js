const { pool } = require('../configs/db.config');

const USER_PUBLIC_SELECT = `
  nd.nguoi_dung_id,
  nd.vai_tro_id,
  nd.don_vi_id,
  nd.ten_dang_nhap,
  nd.ho_ten,
  nd.email,
  nd.so_dien_thoai,
  nd.trang_thai_tai_khoan,
  nd.ghi_chu,
  nd.created_at,
  nd.updated_at,
  vt.ma_vai_tro,
  vt.ten_vai_tro,
  dv.ten_don_vi
`;

const USER_AUTH_SELECT = `
  nd.nguoi_dung_id,
  nd.vai_tro_id,
  nd.don_vi_id,
  nd.ten_dang_nhap,
  nd.mat_khau_hash,
  nd.ho_ten,
  nd.email,
  nd.so_dien_thoai,
  nd.trang_thai_tai_khoan,
  nd.ghi_chu,
  nd.created_at,
  nd.updated_at,
  vt.ma_vai_tro,
  vt.ten_vai_tro,
  dv.ten_don_vi
`;

const USER_JOIN_CLAUSE = `
  FROM nguoi_dung nd
  LEFT JOIN vai_tro vt ON vt.vai_tro_id = nd.vai_tro_id
  LEFT JOIN don_vi dv ON dv.don_vi_id = nd.don_vi_id
`;

const SORT_COLUMN_MAP = {
  created_at: 'nd.created_at',
  updated_at: 'nd.updated_at',
  ho_ten: 'nd.ho_ten',
  ten_dang_nhap: 'nd.ten_dang_nhap',
  email: 'nd.email',
};

const appendFilters = (filters, values) => {
  const conditions = [];

  if (filters.keyword) {
    const keyword = `%${filters.keyword}%`;
    conditions.push('(nd.ten_dang_nhap LIKE ? OR nd.ho_ten LIKE ? OR nd.email LIKE ? OR nd.so_dien_thoai LIKE ?)');
    values.push(keyword, keyword, keyword, keyword);
  }

  if (filters.vaiTroId) {
    conditions.push('nd.vai_tro_id = ?');
    values.push(filters.vaiTroId);
  }

  if (filters.donViId) {
    conditions.push('nd.don_vi_id = ?');
    values.push(filters.donViId);
  }

  if (filters.trangThaiTaiKhoan) {
    conditions.push('nd.trang_thai_tai_khoan = ?');
    values.push(filters.trangThaiTaiKhoan);
  }

  if (!conditions.length) return '';
  return `WHERE ${conditions.join(' AND ')}`;
};

const findAuthByUsername = async (tenDangNhap) => {
  const sql = `
    SELECT ${USER_AUTH_SELECT}
    ${USER_JOIN_CLAUSE}
    WHERE nd.ten_dang_nhap = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [tenDangNhap]);
  return rows[0] || null;
};

const findAuthById = async (nguoiDungId) => {
  const sql = `
    SELECT ${USER_AUTH_SELECT}
    ${USER_JOIN_CLAUSE}
    WHERE nd.nguoi_dung_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [nguoiDungId]);
  return rows[0] || null;
};

const findById = async (nguoiDungId) => {
  const sql = `
    SELECT ${USER_PUBLIC_SELECT}
    ${USER_JOIN_CLAUSE}
    WHERE nd.nguoi_dung_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [nguoiDungId]);
  return rows[0] || null;
};

const countUsers = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);

  const sql = `
    SELECT COUNT(*) AS total
    ${USER_JOIN_CLAUSE}
    ${whereClause}
  `;

  const [rows] = await pool.query(sql, values);
  return Number(rows[0]?.total || 0);
};

const findUsers = async (filters = {}) => {
  const values = [];
  const whereClause = appendFilters(filters, values);

  const sortColumn = SORT_COLUMN_MAP[filters.sortBy] || SORT_COLUMN_MAP.created_at;
  const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;

  const sql = `
    SELECT ${USER_PUBLIC_SELECT}
    ${USER_JOIN_CLAUSE}
    ${whereClause}
    ORDER BY ${sortColumn} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);

  const [rows] = await pool.query(sql, values);
  return rows;
};

const createUser = async (payload) => {
  const sql = `
    INSERT INTO nguoi_dung (
      vai_tro_id,
      don_vi_id,
      ten_dang_nhap,
      mat_khau_hash,
      ho_ten,
      email,
      so_dien_thoai,
      trang_thai_tai_khoan,
      ghi_chu,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `;

  const [result] = await pool.query(sql, [
    payload.vai_tro_id,
    payload.don_vi_id,
    payload.ten_dang_nhap,
    payload.mat_khau_hash,
    payload.ho_ten,
    payload.email,
    payload.so_dien_thoai,
    payload.trang_thai_tai_khoan,
    payload.ghi_chu,
  ]);

  return Number(result.insertId);
};

const updateUserById = async (nguoiDungId, payload) => {
  const fieldMap = {
    ten_dang_nhap: 'ten_dang_nhap',
    ho_ten: 'ho_ten',
    email: 'email',
    so_dien_thoai: 'so_dien_thoai',
    vai_tro_id: 'vai_tro_id',
    don_vi_id: 'don_vi_id',
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
    UPDATE nguoi_dung
    SET ${setClauses.join(', ')}
    WHERE nguoi_dung_id = ?
  `;

  values.push(nguoiDungId);

  const [result] = await pool.query(sql, values);
  return result.affectedRows > 0;
};

const updatePasswordHash = async (nguoiDungId, matKhauHash) => {
  const sql = `
    UPDATE nguoi_dung
    SET mat_khau_hash = ?, updated_at = NOW()
    WHERE nguoi_dung_id = ?
  `;

  const [result] = await pool.query(sql, [matKhauHash, nguoiDungId]);
  return result.affectedRows > 0;
};

const updateAccountStatus = async (nguoiDungId, trangThaiTaiKhoan) => {
  const sql = `
    UPDATE nguoi_dung
    SET trang_thai_tai_khoan = ?, updated_at = NOW()
    WHERE nguoi_dung_id = ?
  `;

  const [result] = await pool.query(sql, [trangThaiTaiKhoan, nguoiDungId]);
  return result.affectedRows > 0;
};

const existsByUsername = async (tenDangNhap, excludeUserId = null) => {
  let sql = 'SELECT nguoi_dung_id FROM nguoi_dung WHERE ten_dang_nhap = ?';
  const values = [tenDangNhap];

  if (excludeUserId) {
    sql += ' AND nguoi_dung_id <> ?';
    values.push(excludeUserId);
  }

  sql += ' LIMIT 1';

  const [rows] = await pool.query(sql, values);
  return Boolean(rows[0]);
};

const existsByEmail = async (email, excludeUserId = null) => {
  if (!email) return false;

  let sql = 'SELECT nguoi_dung_id FROM nguoi_dung WHERE email = ?';
  const values = [email];

  if (excludeUserId) {
    sql += ' AND nguoi_dung_id <> ?';
    values.push(excludeUserId);
  }

  sql += ' LIMIT 1';

  const [rows] = await pool.query(sql, values);
  return Boolean(rows[0]);
};

const existsByPhone = async (soDienThoai, excludeUserId = null) => {
  if (!soDienThoai) return false;

  let sql = 'SELECT nguoi_dung_id FROM nguoi_dung WHERE so_dien_thoai = ?';
  const values = [soDienThoai];

  if (excludeUserId) {
    sql += ' AND nguoi_dung_id <> ?';
    values.push(excludeUserId);
  }

  sql += ' LIMIT 1';

  const [rows] = await pool.query(sql, values);
  return Boolean(rows[0]);
};

const countActiveAdminsExcludingUser = async (excludeUserId = null) => {
  let sql = `
    SELECT COUNT(*) AS total
    FROM nguoi_dung nd
    INNER JOIN vai_tro vt ON vt.vai_tro_id = nd.vai_tro_id
    WHERE (UPPER(vt.ma_vai_tro) = 'ADMIN' OR UPPER(vt.ten_vai_tro) = 'ADMIN')
      AND nd.trang_thai_tai_khoan = 'ACTIVE'
  `;

  const values = [];

  if (excludeUserId) {
    sql += ' AND nd.nguoi_dung_id <> ?';
    values.push(excludeUserId);
  }

  const [rows] = await pool.query(sql, values);
  return Number(rows[0]?.total || 0);
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
  findAuthByUsername,
  findAuthById,
  findById,
  countUsers,
  findUsers,
  createUser,
  updateUserById,
  updatePasswordHash,
  updateAccountStatus,
  existsByUsername,
  existsByEmail,
  existsByPhone,
  countActiveAdminsExcludingUser,
  countUsersByRoleId,
};
