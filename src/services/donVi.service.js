const donViRepository = require('../repositories/donVi.repository');
const AppError = require('../utils/appError');
const { writeAuditLog } = require('./auditLog.service');

const ensureDonViExists = async (donViId) => {
  const donVi = await donViRepository.findById(donViId);
  if (!donVi) {
    throw new AppError('Khong tim thay don vi', 404);
  }

  return donVi;
};

const ensureMaDonViUnique = async (maDonVi, excludeDonViId = null) => {
  if (!maDonVi) return;

  const exists = await donViRepository.existsByMaDonVi(maDonVi, excludeDonViId);
  if (exists) {
    throw new AppError('ma_don_vi da ton tai', 409);
  }
};

const ensureParentValid = async ({ parentId, currentId = null }) => {
  if (parentId === undefined) return;
  if (parentId === null) return;

  const numericParentId = Number(parentId);

  if (currentId && numericParentId === Number(currentId)) {
    throw new AppError('parent_id khong duoc trung voi chinh don_vi_id', 400);
  }

  const parent = await ensureDonViExists(numericParentId);
  if (!parent) {
    throw new AppError('parent_id khong ton tai', 400);
  }

  if (!currentId) return;

  let cursor = numericParentId;
  const visited = new Set();

  while (cursor) {
    if (visited.has(cursor)) break;
    visited.add(cursor);

    if (cursor === Number(currentId)) {
      throw new AppError('Khong the tao vong lap cha-con cho don_vi', 400);
    }

    const currentNode = await ensureDonViExists(cursor);
    cursor = currentNode.parent_id ? Number(currentNode.parent_id) : null;
  }
};

const getDonViList = async (query) => {
  const [items, totalItems] = await Promise.all([
    donViRepository.findDonVi(query),
    donViRepository.countDonVi(query),
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

const getDonViOptions = async (query = {}) => {
  return donViRepository.findOptions(query);
};

const getDonViById = async (donViId) => {
  return ensureDonViExists(donViId);
};

const createDonVi = async (actor, payload, context = {}) => {
  await ensureMaDonViUnique(payload.ma_don_vi);
  await ensureParentValid({ parentId: payload.parent_id });

  const insertedId = await donViRepository.createDonVi(payload);
  const createdDonVi = await ensureDonViExists(insertedId);

  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: 'DON_VI',
    hanh_dong: 'CREATE',
    entity_name: 'don_vi',
    entity_id: insertedId,
    du_lieu_moi: createdDonVi,
    ghi_chu: `Tao don vi ${createdDonVi.ten_don_vi}`,
    ip_address: context.ipAddress,
  });

  return createdDonVi;
};

const updateDonVi = async (actor, donViId, payload, context = {}) => {
  const currentDonVi = await ensureDonViExists(donViId);

  if (Object.prototype.hasOwnProperty.call(payload, 'ma_don_vi')) {
    await ensureMaDonViUnique(payload.ma_don_vi, donViId);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'parent_id')) {
    await ensureParentValid({
      parentId: payload.parent_id,
      currentId: donViId,
    });
  }

  await donViRepository.updateDonViById(donViId, payload);
  const updatedDonVi = await ensureDonViExists(donViId);

  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: 'DON_VI',
    hanh_dong: 'UPDATE',
    entity_name: 'don_vi',
    entity_id: donViId,
    du_lieu_cu: currentDonVi,
    du_lieu_moi: updatedDonVi,
    ghi_chu: `Cap nhat don vi ${updatedDonVi.ten_don_vi}`,
    ip_address: context.ipAddress,
  });

  return updatedDonVi;
};

const updateDonViStatus = async (actor, donViId, payload, context = {}) => {
  const currentDonVi = await ensureDonViExists(donViId);

  if (Number(currentDonVi.is_active) === Number(payload.is_active)) {
    return {
      changed: false,
      donVi: currentDonVi,
    };
  }

  await donViRepository.updateDonViStatus(donViId, payload.is_active);
  const updatedDonVi = await ensureDonViExists(donViId);

  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: 'DON_VI',
    hanh_dong: 'UPDATE_STATUS',
    entity_name: 'don_vi',
    entity_id: donViId,
    du_lieu_cu: {
      is_active: currentDonVi.is_active,
    },
    du_lieu_moi: {
      is_active: updatedDonVi.is_active,
    },
    ghi_chu: `Chuyen trang thai don vi ${updatedDonVi.ten_don_vi} sang ${Number(updatedDonVi.is_active) === 1 ? 'active' : 'inactive'}`,
    ip_address: context.ipAddress,
  });

  return {
    changed: true,
    donVi: updatedDonVi,
  };
};

module.exports = {
  getDonViList,
  getDonViOptions,
  getDonViById,
  createDonVi,
  updateDonVi,
  updateDonViStatus,
};
