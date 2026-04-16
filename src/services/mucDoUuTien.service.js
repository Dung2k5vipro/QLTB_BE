const { createMasterDataService } = require('./masterData.serviceFactory');
const mucDoUuTienRepository = require('../repositories/mucDoUuTien.repository');

module.exports = createMasterDataService({
  moduleName: 'MUC_DO_UU_TIEN',
  entityName: 'muc_do_uu_tien',
  idField: 'muc_do_uu_tien_id',
  displayField: 'ten_muc_do',
  uniqueFields: ['ma_muc_do'],
  repository: mucDoUuTienRepository,
});
