const AppError = require('../utils/appError');
const { writeAuditLog } = require('./auditLog.service');

const isMysqlDuplicateKeyError = (error) => {
  return Number(error?.errno) === 1062 || String(error?.code || '').toUpperCase() === 'ER_DUP_ENTRY';
};

const createMasterDataService = ({
  moduleName,
  entityName,
  idField,
  displayField,
  uniqueFields = [],
  repository,
}) => {
  const ensureExists = async (id) => {
    const row = await repository.findById(id);
    if (!row) {
      throw new AppError('Khong tim thay du lieu', 404);
    }

    return row;
  };

  const ensureUniqueFields = async (payload, excludeId = null) => {
    for (const field of uniqueFields) {
      if (!Object.prototype.hasOwnProperty.call(payload, field)) continue;

      const value = payload[field];
      if (value === null || value === undefined || value === '') continue;

      const exists = await repository.existsByField(field, value, excludeId);
      if (exists) {
        throw new AppError(`${field} da ton tai`, 409);
      }
    }
  };

  const mapDatabaseError = (error) => {
    if (!isMysqlDuplicateKeyError(error)) return error;

    const message = String(error?.sqlMessage || error?.message || '');
    const duplicatedField = uniqueFields.find((field) => message.includes(field));

    if (duplicatedField) {
      return new AppError(`${duplicatedField} da ton tai`, 409);
    }

    return new AppError('Du lieu bi trung voi ban ghi khac', 409);
  };

  const getList = async (query) => {
    const [items, totalItems] = await Promise.all([
      repository.findItems(query),
      repository.countItems(query),
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

  const getDetail = async (id) => {
    return ensureExists(id);
  };

  const create = async (actor, payload, context = {}) => {
    try {
      await ensureUniqueFields(payload);

      const insertedId = await repository.create(payload);
      const createdItem = await ensureExists(insertedId);

      await writeAuditLog({
        nguoi_dung_id: actor?.nguoi_dung_id || null,
        module: moduleName,
        hanh_dong: 'CREATE',
        entity_name: entityName,
        entity_id: insertedId,
        du_lieu_moi: createdItem,
        ghi_chu: `Tao moi ${entityName}${createdItem?.[displayField] ? `: ${createdItem[displayField]}` : ''}`,
        ip_address: context.ipAddress,
      });

      return createdItem;
    } catch (error) {
      throw mapDatabaseError(error);
    }
  };

  const update = async (actor, id, payload, context = {}) => {
    const currentItem = await ensureExists(id);

    try {
      await ensureUniqueFields(payload, id);
      await repository.updateById(id, payload);
    } catch (error) {
      throw mapDatabaseError(error);
    }

    const updatedItem = await ensureExists(id);

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: moduleName,
      hanh_dong: 'UPDATE',
      entity_name: entityName,
      entity_id: id,
      du_lieu_cu: currentItem,
      du_lieu_moi: updatedItem,
      ghi_chu: `Cap nhat ${entityName}${updatedItem?.[displayField] ? `: ${updatedItem[displayField]}` : ''}`,
      ip_address: context.ipAddress,
    });

    return updatedItem;
  };

  const updateStatus = async (actor, id, payload, context = {}) => {
    const currentItem = await ensureExists(id);
    const nextStatus = Number(payload.is_active);

    if (Number(currentItem.is_active) === nextStatus) {
      return {
        changed: false,
        item: currentItem,
      };
    }

    await repository.updateStatus(id, nextStatus);
    const updatedItem = await ensureExists(id);

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: moduleName,
      hanh_dong: 'UPDATE_STATUS',
      entity_name: entityName,
      entity_id: id,
      du_lieu_cu: {
        is_active: currentItem.is_active,
      },
      du_lieu_moi: {
        is_active: updatedItem.is_active,
      },
      ghi_chu: `Chuyen trang thai ${entityName} sang ${nextStatus ? 'active' : 'inactive'}`,
      ip_address: context.ipAddress,
    });

    return {
      changed: true,
      item: updatedItem,
    };
  };

  return {
    getList,
    getDetail,
    create,
    update,
    updateStatus,
  };
};

module.exports = {
  createMasterDataService,
};
