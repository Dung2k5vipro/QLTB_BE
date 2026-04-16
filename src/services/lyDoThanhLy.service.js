const { createMasterDataService } = require('./masterData.serviceFactory');
const lyDoThanhLyRepository = require('../repositories/lyDoThanhLy.repository');

module.exports = createMasterDataService({
  moduleName: 'LY_DO_THANH_LY',
  entityName: 'ly_do_thanh_ly',
  idField: 'ly_do_thanh_ly_id',
  displayField: 'ten_ly_do',
  uniqueFields: ['ma_ly_do'],
  repository: lyDoThanhLyRepository,
});
