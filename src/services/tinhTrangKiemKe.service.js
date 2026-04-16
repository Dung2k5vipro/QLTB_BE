const { createMasterDataService } = require('./masterData.serviceFactory');
const tinhTrangKiemKeRepository = require('../repositories/tinhTrangKiemKe.repository');

module.exports = createMasterDataService({
  moduleName: 'TINH_TRANG_KIEM_KE',
  entityName: 'tinh_trang_kiem_ke',
  idField: 'tinh_trang_kiem_ke_id',
  displayField: 'ten_tinh_trang',
  uniqueFields: ['ma_tinh_trang'],
  repository: tinhTrangKiemKeRepository,
});
