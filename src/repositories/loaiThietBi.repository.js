const { createMasterDataRepository } = require('./masterData.repositoryFactory');

module.exports = createMasterDataRepository({
  tableName: 'loai_thiet_bi',
  idField: 'loai_thiet_bi_id',
  searchableFields: ['ma_loai', 'ma_viet_tat', 'ten_loai', 'mo_ta'],
  listFields: [
    'loai_thiet_bi_id',
    'ma_loai',
    'ma_viet_tat',
    'ten_loai',
    'mo_ta',
    'is_active',
    'created_at',
    'updated_at',
  ],
  detailFields: [
    'loai_thiet_bi_id',
    'ma_loai',
    'ma_viet_tat',
    'ten_loai',
    'mo_ta',
    'is_active',
    'created_at',
    'updated_at',
  ],
  insertFields: [
    'ma_loai',
    'ma_viet_tat',
    'ten_loai',
    'mo_ta',
    'is_active',
  ],
  updateFields: [
    'ma_loai',
    'ma_viet_tat',
    'ten_loai',
    'mo_ta',
  ],
  uniqueFields: [
    'ma_loai',
    'ma_viet_tat',
  ],
  sortColumnMap: {
    created_at: 'created_at',
    updated_at: 'updated_at',
    ma_loai: 'ma_loai',
    ma_viet_tat: 'ma_viet_tat',
    ten_loai: 'ten_loai',
  },
  defaultSortBy: 'created_at',
  hasUpdatedAt: true,
  hasIsActive: true,
});
