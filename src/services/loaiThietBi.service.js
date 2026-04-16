const { createMasterDataService } = require('./masterData.serviceFactory');
const loaiThietBiRepository = require('../repositories/loaiThietBi.repository');

module.exports = createMasterDataService({
  moduleName: 'LOAI_THIET_BI',
  entityName: 'loai_thiet_bi',
  idField: 'loai_thiet_bi_id',
  displayField: 'ten_loai',
  uniqueFields: ['ma_loai', 'ma_viet_tat'],
  repository: loaiThietBiRepository,
});
