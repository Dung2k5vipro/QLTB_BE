const { createMasterDataService } = require('./masterData.serviceFactory');
const trangThaiThietBiRepository = require('../repositories/trangThaiThietBi.repository');

module.exports = createMasterDataService({
  moduleName: 'TRANG_THAI_THIET_BI',
  entityName: 'trang_thai_thiet_bi',
  idField: 'trang_thai_thiet_bi_id',
  displayField: 'ten_trang_thai',
  uniqueFields: ['ma_trang_thai'],
  repository: trangThaiThietBiRepository,
});
