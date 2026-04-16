const { createMasterDataRepository } = require('./masterData.repositoryFactory');

module.exports = createMasterDataRepository({
  tableName: 'ly_do_thanh_ly',
  idField: 'ly_do_thanh_ly_id',
  searchableFields: ['ma_ly_do', 'ten_ly_do', 'mo_ta'],
  listFields: [
    'ly_do_thanh_ly_id',
    'ma_ly_do',
    'ten_ly_do',
    'mo_ta',
    'is_active',
  ],
  detailFields: [
    'ly_do_thanh_ly_id',
    'ma_ly_do',
    'ten_ly_do',
    'mo_ta',
    'is_active',
  ],
  insertFields: [
    'ma_ly_do',
    'ten_ly_do',
    'mo_ta',
    'is_active',
  ],
  updateFields: [
    'ma_ly_do',
    'ten_ly_do',
    'mo_ta',
  ],
  uniqueFields: ['ma_ly_do'],
  sortColumnMap: {
    ly_do_thanh_ly_id: 'ly_do_thanh_ly_id',
    ma_ly_do: 'ma_ly_do',
    ten_ly_do: 'ten_ly_do',
  },
  defaultSortBy: 'ly_do_thanh_ly_id',
  hasUpdatedAt: false,
  hasIsActive: true,
});
