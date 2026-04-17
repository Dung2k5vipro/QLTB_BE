const AppError = require('../utils/appError');
const roleRepository = require('../repositories/role.repository');
const { writeAuditLog } = require('./auditLog.service');

const PROTECTED_ROLE_CODES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];

const isProtectedRole = (role) => {
  return PROTECTED_ROLE_CODES.includes(String(role?.ma_vai_tro || '').trim().toUpperCase());
};

const ensureRoleExists = async (vaiTroId) => {
  const role = await roleRepository.findById(vaiTroId);
  if (!role) {
    throw new AppError('Kh�ng t�m th�y vai tr�', 404);
  }

  return role;
};

const ensureCodeUnique = async (maVaiTro, excludeVaiTroId = null) => {
  if (!maVaiTro) return;

  const existing = await roleRepository.findByCode(maVaiTro, excludeVaiTroId);
  if (existing) {
    throw new AppError('M� vai tr� � t�n t�i', 409);
  }
};

const ensureProtectedRoleUpdateAllowed = (currentRole, payload) => {
  if (!isProtectedRole(currentRole)) return;

  if (
    Object.prototype.hasOwnProperty.call(payload, 'ma_vai_tro')
    && String(payload.ma_vai_tro).trim().toUpperCase() !== String(currentRole.ma_vai_tro).trim().toUpperCase()
  ) {
    throw new AppError('Kh�ng ��c thay �i m� vai tr� h� th�ng', 400);
  }
};

const ensureCanDeactivateRole = async (currentRole, nextIsActive) => {
  if (Number(nextIsActive) === 1) return;

  if (isProtectedRole(currentRole)) {
    throw new AppError('Kh�ng ��c v� hi�u h�a vai tr� h� th�ng', 400);
  }

  const totalUsers = await roleRepository.countUsersByRoleId(currentRole.vai_tro_id);
  if (totalUsers > 0) {
    throw new AppError('Kh�ng th� v� hi�u h�a vai tr� ang ��c g�n cho ng��i d�ng', 400);
  }
};

const getRoleList = async (query) => {
  const [items, totalItems] = await Promise.all([
    roleRepository.findRoles(query),
    roleRepository.countRoles(query),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit) || 1,
    },
  };
};

const getRoleById = async (vaiTroId) => {
  return ensureRoleExists(vaiTroId);
};

const createRole = async (actor, payload, context = {}) => {
  await ensureCodeUnique(payload.ma_vai_tro);

  const insertedId = await roleRepository.createRole(payload);
  const createdRole = await ensureRoleExists(insertedId);

  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: 'VAI_TRO',
    hanh_dong: 'CREATE',
    entity_name: 'vai_tro',
    entity_id: insertedId,
    du_lieu_moi: createdRole,
    ghi_chu: `T�o vai tr� ${createdRole.ten_vai_tro}`,
    ip_address: context.ipAddress,
  });

  return createdRole;
};

const updateRole = async (actor, vaiTroId, payload, context = {}) => {
  const currentRole = await ensureRoleExists(vaiTroId);
  ensureProtectedRoleUpdateAllowed(currentRole, payload);

  if (Object.prototype.hasOwnProperty.call(payload, 'ma_vai_tro')) {
    await ensureCodeUnique(payload.ma_vai_tro, vaiTroId);
  }

  await roleRepository.updateRoleById(vaiTroId, payload);
  const updatedRole = await ensureRoleExists(vaiTroId);

  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: 'VAI_TRO',
    hanh_dong: 'UPDATE',
    entity_name: 'vai_tro',
    entity_id: vaiTroId,
    du_lieu_cu: currentRole,
    du_lieu_moi: updatedRole,
    ghi_chu: `C�p nh�t vai tr� ${updatedRole.ten_vai_tro}`,
    ip_address: context.ipAddress,
  });

  return updatedRole;
};

const updateRoleStatus = async (actor, vaiTroId, payload, context = {}) => {
  const currentRole = await ensureRoleExists(vaiTroId);

  if (Number(currentRole.is_active) === Number(payload.is_active)) {
    return {
      changed: false,
      role: currentRole,
    };
  }

  await ensureCanDeactivateRole(currentRole, payload.is_active);
  await roleRepository.updateRoleStatus(vaiTroId, payload.is_active);
  const updatedRole = await ensureRoleExists(vaiTroId);

  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: 'VAI_TRO',
    hanh_dong: 'UPDATE_STATUS',
    entity_name: 'vai_tro',
    entity_id: vaiTroId,
    du_lieu_cu: { is_active: currentRole.is_active },
    du_lieu_moi: { is_active: updatedRole.is_active },
    ghi_chu: `C�p nh�t tr�ng th�i vai tr� ${updatedRole.ten_vai_tro}`,
    ip_address: context.ipAddress,
  });

  return {
    changed: true,
    role: updatedRole,
  };
};

module.exports = {
  getRoleList,
  getRoleById,
  createRole,
  updateRole,
  updateRoleStatus,
};

