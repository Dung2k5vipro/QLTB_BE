const { createMasterDataController } = require('./masterData.controllerFactory');
const donViSuaChuaService = require('../services/donViSuaChua.service');

const controller = createMasterDataController({
  service: donViSuaChuaService,
  messages: {
    list: 'Lấy danh sách đơn vị sửa chữa thành công',
    detail: 'Lấy chi tiết đơn vị sửa chữa thành công',
    create: 'Tạo đơn vị sửa chữa thành công',
    update: 'Cập nhật đơn vị sửa chữa thành công',
    updateStatus: 'Cập nhật trạng thái đơn vị sửa chữa thành công',
    statusUnchanged: 'Trạng thái đơn vị sửa chữa không thay đổi',
  },
});

module.exports = {
  getDonViSuaChua: controller.getList,
  getDonViSuaChuaById: controller.getDetail,
  createDonViSuaChua: controller.create,
  updateDonViSuaChua: controller.update,
  updateDonViSuaChuaStatus: controller.updateStatus,
};



