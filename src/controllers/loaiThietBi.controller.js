const { createMasterDataController } = require('./masterData.controllerFactory');
const loaiThietBiService = require('../services/loaiThietBi.service');

const controller = createMasterDataController({
  service: loaiThietBiService,
  messages: {
    list: 'Lấy danh sách loại thiết bị thành công',
    detail: 'Lấy chi tiết loại thiết bị thành công',
    create: 'Tạo loại thiết bị thành công',
    update: 'Cập nhật loại thiết bị thành công',
    updateStatus: 'Cập nhật trạng thái loại thiết bị thành công',
    statusUnchanged: 'Trạng thái loại thiết bị không thay đổi',
  },
});

module.exports = {
  getLoaiThietBi: controller.getList,
  getLoaiThietBiById: controller.getDetail,
  createLoaiThietBi: controller.create,
  updateLoaiThietBi: controller.update,
  updateLoaiThietBiStatus: controller.updateStatus,
};



