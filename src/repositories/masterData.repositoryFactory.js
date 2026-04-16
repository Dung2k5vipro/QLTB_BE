const { pool } = require('../configs/db.config');

const resolveExecutor = (connection) => connection || pool;

const createMasterDataRepository = ({
  tableName,
  idField,
  searchableFields = [],
  listFields = [],
  detailFields = [],
  insertFields = [],
  updateFields = [],
  uniqueFields = [],
  sortColumnMap = {},
  defaultSortBy,
  hasUpdatedAt = false,
  hasIsActive = true,
}) => {
  if (!tableName || !idField) {
    throw new Error('tableName va idField la bat buoc');
  }
  if (!listFields.length || !detailFields.length) {
    throw new Error(`listFields/detailFields chua duoc cau hinh cho ${tableName}`);
  }

  const buildWhereClause = (filters, values) => {
    const conditions = [];

    if (filters.keyword && searchableFields.length) {
      const keyword = `%${filters.keyword}%`;
      const fragments = searchableFields.map((column) => `${column} LIKE ?`);
      conditions.push(`(${fragments.join(' OR ')})`);
      searchableFields.forEach(() => values.push(keyword));
    }

    if (hasIsActive && filters.isActive !== undefined) {
      conditions.push('is_active = ?');
      values.push(filters.isActive);
    }

    if (!conditions.length) return '';
    return `WHERE ${conditions.join(' AND ')}`;
  };

  const countItems = async (filters = {}, { connection } = {}) => {
    const executor = resolveExecutor(connection);
    const values = [];
    const whereClause = buildWhereClause(filters, values);

    const sql = `
      SELECT COUNT(*) AS total
      FROM ${tableName}
      ${whereClause}
    `;

    const [rows] = await executor.query(sql, values);
    return Number(rows[0]?.total || 0);
  };

  const findItems = async (filters = {}, { connection } = {}) => {
    const executor = resolveExecutor(connection);
    const values = [];
    const whereClause = buildWhereClause(filters, values);

    const sortColumn = sortColumnMap[filters.sortBy] || sortColumnMap[defaultSortBy] || idField;
    const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT ${listFields.join(', ')}
      FROM ${tableName}
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, ${idField} DESC
      LIMIT ? OFFSET ?
    `;

    values.push(limit, offset);

    const [rows] = await executor.query(sql, values);
    return rows;
  };

  const findById = async (id, { connection } = {}) => {
    const executor = resolveExecutor(connection);
    const sql = `
      SELECT ${detailFields.join(', ')}
      FROM ${tableName}
      WHERE ${idField} = ?
      LIMIT 1
    `;

    const [rows] = await executor.query(sql, [id]);
    return rows[0] || null;
  };

  const existsByField = async (fieldName, fieldValue, excludeId = null, { connection } = {}) => {
    if (!uniqueFields.includes(fieldName)) {
      throw new Error(`Truong ${fieldName} khong nam trong uniqueFields cua ${tableName}`);
    }

    const executor = resolveExecutor(connection);
    let sql = `SELECT ${idField} FROM ${tableName} WHERE ${fieldName} = ?`;
    const values = [fieldValue];

    if (excludeId) {
      sql += ` AND ${idField} <> ?`;
      values.push(excludeId);
    }

    sql += ' LIMIT 1';

    const [rows] = await executor.query(sql, values);
    return Boolean(rows[0]);
  };

  const create = async (payload, { connection } = {}) => {
    const executor = resolveExecutor(connection);
    const columns = [];
    const placeholders = [];
    const values = [];

    insertFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        columns.push(field);
        placeholders.push('?');
        values.push(payload[field]);
      }
    });

    if (!columns.length) {
      throw new Error(`Khong co du lieu de tao ban ghi cho ${tableName}`);
    }

    const sql = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
    `;

    const [result] = await executor.query(sql, values);
    return Number(result.insertId);
  };

  const updateById = async (id, payload, { connection } = {}) => {
    const executor = resolveExecutor(connection);
    const setClauses = [];
    const values = [];

    updateFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        setClauses.push(`${field} = ?`);
        values.push(payload[field]);
      }
    });

    if (hasUpdatedAt) {
      setClauses.push('updated_at = NOW()');
    }

    if (!setClauses.length) {
      return false;
    }

    const sql = `
      UPDATE ${tableName}
      SET ${setClauses.join(', ')}
      WHERE ${idField} = ?
    `;

    values.push(id);

    const [result] = await executor.query(sql, values);
    return result.affectedRows > 0;
  };

  const updateStatus = async (id, isActive, { connection } = {}) => {
    if (!hasIsActive) {
      throw new Error(`Bang ${tableName} khong ho tro truong is_active`);
    }

    const executor = resolveExecutor(connection);
    const setClauses = ['is_active = ?'];
    const values = [isActive];

    if (hasUpdatedAt) {
      setClauses.push('updated_at = NOW()');
    }

    const sql = `
      UPDATE ${tableName}
      SET ${setClauses.join(', ')}
      WHERE ${idField} = ?
    `;

    values.push(id);

    const [result] = await executor.query(sql, values);
    return result.affectedRows > 0;
  };

  return {
    countItems,
    findItems,
    findById,
    existsByField,
    create,
    updateById,
    updateStatus,
  };
};

module.exports = {
  createMasterDataRepository,
};
