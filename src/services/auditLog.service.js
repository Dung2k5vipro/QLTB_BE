const auditLogRepository = require('../repositories/auditLog.repository');

const safeStringify = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch (_error) {
    return null;
  }
};

const writeAuditLog = async (payload) => {
  try {
    await auditLogRepository.createAuditLog({
      nguoi_dung_id: payload.nguoi_dung_id ?? null,
      module: payload.module ?? null,
      hanh_dong: payload.hanh_dong ?? null,
      entity_name: payload.entity_name ?? null,
      entity_id: payload.entity_id ?? null,
      du_lieu_cu: safeStringify(payload.du_lieu_cu),
      du_lieu_moi: safeStringify(payload.du_lieu_moi),
      ghi_chu: payload.ghi_chu ?? null,
      ip_address: payload.ip_address ?? null,
    });
  } catch (error) {
    console.error('Audit log write failed:', error.message);
  }
};

module.exports = {
  writeAuditLog,
};
