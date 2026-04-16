const { createMasterDataService } = require('./masterData.serviceFactory');
const hangSanXuatRepository = require('../repositories/hangSanXuat.repository');

module.exports = createMasterDataService({
  moduleName: 'HANG_SAN_XUAT',
  entityName: 'hang_san_xuat',
  idField: 'hang_san_xuat_id',
  displayField: 'ten_hang',
  uniqueFields: ['ma_hang'],
  repository: hangSanXuatRepository,
});
