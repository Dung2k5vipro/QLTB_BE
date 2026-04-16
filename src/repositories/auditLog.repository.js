const { pool } = require('../configs/db.config');

const createAuditLog = async (payload) => {
  const sql = `
    INSERT INTO nhat_ky_he_thong (
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
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const [result] = await pool.query(sql, [
    payload.nguoi_dung_id ?? null,
    payload.module ?? null,
    payload.hanh_dong ?? null,
    payload.entity_name ?? null,
    payload.entity_id ?? null,
    payload.du_lieu_cu ?? null,
    payload.du_lieu_moi ?? null,
    payload.ghi_chu ?? null,
    payload.ip_address ?? null,
  ]);

  return Number(result.insertId);
};

module.exports = {
  createAuditLog,
};
