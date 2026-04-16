const { createMasterDataRepository } = require('./masterData.repositoryFactory');

module.exports = createMasterDataRepository({
  tableName: 'muc_do_uu_tien',
  idField: 'muc_do_uu_tien_id',
  searchableFields: ['ma_muc_do', 'ten_muc_do', 'mo_ta'],
  listFields: [
    'muc_do_uu_tien_id',
    'ma_muc_do',
    'ten_muc_do',
    'muc_do_so',
    'mo_ta',
    'is_active',
  ],
  detailFields: [
    'muc_do_uu_tien_id',
    'ma_muc_do',
    'ten_muc_do',
    'muc_do_so',
    'mo_ta',
    'is_active',
  ],
  insertFields: [
    'ma_muc_do',
    'ten_muc_do',
    'muc_do_so',
    'mo_ta',
    'is_active',
  ],
  updateFields: [
    'ma_muc_do',
    'ten_muc_do',
    'muc_do_so',
    'mo_ta',
  ],
  uniqueFields: ['ma_muc_do'],
  sortColumnMap: {
    muc_do_uu_tien_id: 'muc_do_uu_tien_id',
    ma_muc_do: 'ma_muc_do',
    ten_muc_do: 'ten_muc_do',
    muc_do_so: 'muc_do_so',
  },
  defaultSortBy: 'muc_do_so',
  hasUpdatedAt: false,
  hasIsActive: true,
});
