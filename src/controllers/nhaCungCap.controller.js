const { createMasterDataController } = require('./masterData.controllerFactory');
const nhaCungCapService = require('../services/nhaCungCap.service');

const controller = createMasterDataController({
  service: nhaCungCapService,
  messages: {
    list: 'Lay danh sach nha cung cap thanh cong',
    detail: 'Lay chi tiet nha cung cap thanh cong',
    create: 'Tao nha cung cap thanh cong',
    update: 'Cap nhat nha cung cap thanh cong',
    updateStatus: 'Cap nhat trang thai nha cung cap thanh cong',
    statusUnchanged: 'Trang thai nha cung cap khong thay doi',
  },
});

module.exports = {
  getNhaCungCap: controller.getList,
  getNhaCungCapById: controller.getDetail,
  createNhaCungCap: controller.create,
  updateNhaCungCap: controller.update,
  updateNhaCungCapStatus: controller.updateStatus,
};
