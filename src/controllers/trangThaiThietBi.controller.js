const { createMasterDataController } = require('./masterData.controllerFactory');
const trangThaiThietBiService = require('../services/trangThaiThietBi.service');

const controller = createMasterDataController({
  service: trangThaiThietBiService,
  messages: {
    list: 'Lấy danh sách trạng thái thiết bị thành công',
    detail: 'Lấy chi tiết trạng thái thiết bị thành công',
    create: 'Tạo trạng thái thiết bị thành công',
    update: 'Cập nhật trạng thái thiết bị thành công',
    updateStatus: 'Cập nhật trạng thái kích hoạt trạng thái thiết bị thành công',
    statusUnchanged: 'Trạng thái kích hoạt không thay đổi',
  },
});

module.exports = {
  getTrangThaiThietBi: controller.getList,
  getTrangThaiThietBiById: controller.getDetail,
  createTrangThaiThietBi: controller.create,
  updateTrangThaiThietBi: controller.update,
  updateTrangThaiThietBiStatus: controller.updateStatus,
};



