const { pool } = require('../configs/db.config');

const findAll = async () => {
  const sql = `
    SELECT vai_tro_id, ma_vai_tro, ten_vai_tro
    FROM vai_tro
    ORDER BY ten_vai_tro ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
};

const findById = async (vaiTroId) => {
  const sql = `
    SELECT vai_tro_id, ma_vai_tro, ten_vai_tro
    FROM vai_tro
    WHERE vai_tro_id = ?
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [vaiTroId]);
  return rows[0] || null;
};

const findAdminRole = async () => {
  const sql = `
    SELECT vai_tro_id, ma_vai_tro, ten_vai_tro, is_active
    FROM vai_tro
    WHERE UPPER(ma_vai_tro) = 'ADMIN' OR UPPER(ten_vai_tro) = 'ADMIN'
    ORDER BY vai_tro_id ASC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql);
  return rows[0] || null;
};

module.exports = {
  findAll,
  findById,
  findAdminRole,
};
