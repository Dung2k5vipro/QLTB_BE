const { createMasterDataService } = require('./masterData.serviceFactory');
const donViSuaChuaRepository = require('../repositories/donViSuaChua.repository');

module.exports = createMasterDataService({
  moduleName: 'DON_VI_SUA_CHUA',
  entityName: 'don_vi_sua_chua',
  idField: 'don_vi_sua_chua_id',
  displayField: 'ten_dvsc',
  uniqueFields: ['ma_dvsc'],
  repository: donViSuaChuaRepository,
});
