const { createMasterDataRepository } = require('./masterData.repositoryFactory');

module.exports = createMasterDataRepository({
  tableName: 'tinh_trang_kiem_ke',
  idField: 'tinh_trang_kiem_ke_id',
  searchableFields: ['ma_tinh_trang', 'ten_tinh_trang', 'mo_ta'],
  listFields: [
    'tinh_trang_kiem_ke_id',
    'ma_tinh_trang',
    'ten_tinh_trang',
    'mo_ta',
    'is_active',
  ],
  detailFields: [
    'tinh_trang_kiem_ke_id',
    'ma_tinh_trang',
    'ten_tinh_trang',
    'mo_ta',
    'is_active',
  ],
  insertFields: [
    'ma_tinh_trang',
    'ten_tinh_trang',
    'mo_ta',
    'is_active',
  ],
  updateFields: [
    'ma_tinh_trang',
    'ten_tinh_trang',
    'mo_ta',
  ],
  uniqueFields: ['ma_tinh_trang'],
  sortColumnMap: {
    tinh_trang_kiem_ke_id: 'tinh_trang_kiem_ke_id',
    ma_tinh_trang: 'ma_tinh_trang',
    ten_tinh_trang: 'ten_tinh_trang',
  },
  defaultSortBy: 'tinh_trang_kiem_ke_id',
  hasUpdatedAt: false,
  hasIsActive: true,
});
