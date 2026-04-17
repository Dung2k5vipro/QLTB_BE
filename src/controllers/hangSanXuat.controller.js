const { createMasterDataController } = require('./masterData.controllerFactory');
const hangSanXuatService = require('../services/hangSanXuat.service');

const controller = createMasterDataController({
  service: hangSanXuatService,
  messages: {
    list: 'L?y danh s?ch h?ng s?n xu?t th?nh c?ng',
    detail: 'L?y chi ti?t h?ng s?n xu?t th?nh c?ng',
    create: 'T?o h?ng s?n xu?t th?nh c?ng',
    update: 'C?p nh?t h?ng s?n xu?t th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i h?ng s?n xu?t th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i h?ng s?n xu?t kh?ng thay ??i',
  },
});

module.exports = {
  getHangSanXuat: controller.getList,
  getHangSanXuatById: controller.getDetail,
  createHangSanXuat: controller.create,
  updateHangSanXuat: controller.update,
  updateHangSanXuatStatus: controller.updateStatus,
};


