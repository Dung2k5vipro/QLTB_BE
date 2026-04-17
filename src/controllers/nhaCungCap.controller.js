const { createMasterDataController } = require('./masterData.controllerFactory');
const nhaCungCapService = require('../services/nhaCungCap.service');

const controller = createMasterDataController({
  service: nhaCungCapService,
  messages: {
    list: 'Lấy danh sách nhà cung cấp thành công',
    detail: 'Lấy chi tiết nhà cung cấp thành công',
    create: 'Tạo nhà cung cấp thành công',
    update: 'Cập nhật nhà cung cấp thành công',
    updateStatus: 'Cập nhật trạng thái nhà cung cấp thành công',
    statusUnchanged: 'Trạng thái nhà cung cấp không thay đổi',
  },
});

module.exports = {
  getNhaCungCap: controller.getList,
  getNhaCungCapById: controller.getDetail,
  createNhaCungCap: controller.create,
  updateNhaCungCap: controller.update,
  updateNhaCungCapStatus: controller.updateStatus,
};



