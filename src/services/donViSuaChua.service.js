const AppError = require('../utils/appError');
const { createMasterDataService } = require('./masterData.serviceFactory');
const donViSuaChuaRepository = require('../repositories/donViSuaChua.repository');

const baseService = createMasterDataService({
  moduleName: 'DON_VI_SUA_CHUA',
  entityName: 'don_vi_sua_chua',
  idField: 'don_vi_sua_chua_id',
  displayField: 'ten_dvsc',
  uniqueFields: ['ma_dvsc'],
  repository: donViSuaChuaRepository,
});

const mapDuplicateCodeError = (error) => {
  if (Number(error?.statusCode) !== 409) return error;

  const message = String(error?.message || '');
  if (!message.toLowerCase().includes('ma_dvsc')) return error;

  return new AppError('Mã đơn vị sửa chữa đã tồn tại (ma_dvsc)', 409);
};

const create = async (actor, payload, context = {}) => {
  try {
    return await baseService.create(actor, payload, context);
  } catch (error) {
    throw mapDuplicateCodeError(error);
  }
};

const update = async (actor, id, payload, context = {}) => {
  try {
    return await baseService.update(actor, id, payload, context);
  } catch (error) {
    throw mapDuplicateCodeError(error);
  }
};

module.exports = {
  ...baseService,
  create,
  update,
};
