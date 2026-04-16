const { createMasterDataService } = require('./masterData.serviceFactory');
const nhaCungCapRepository = require('../repositories/nhaCungCap.repository');

module.exports = createMasterDataService({
  moduleName: 'NHA_CUNG_CAP',
  entityName: 'nha_cung_cap',
  idField: 'nha_cung_cap_id',
  displayField: 'ten_ncc',
  uniqueFields: ['ma_ncc'],
  repository: nhaCungCapRepository,
});
