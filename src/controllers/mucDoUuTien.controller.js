const { createMasterDataController } = require('./masterData.controllerFactory');
const mucDoUuTienService = require('../services/mucDoUuTien.service');

const controller = createMasterDataController({
  service: mucDoUuTienService,
  messages: {
    list: 'Lấy danh sách mức độ ưu tiên thành công',
    detail: 'Lấy chi tiết mức độ ưu tiên thành công',
    create: 'Tạo mức độ ưu tiên thành công',
    update: 'Cập nhật mức độ ưu tiên thành công',
    updateStatus: 'Cập nhật trạng thái mức độ ưu tiên thành công',
    statusUnchanged: 'Trạng thái mức độ ưu tiên không thay đổi',
  },
});

module.exports = {
  getMucDoUuTien: controller.getList,
  getMucDoUuTienById: controller.getDetail,
  createMucDoUuTien: controller.create,
  updateMucDoUuTien: controller.update,
  updateMucDoUuTienStatus: controller.updateStatus,
};



