const { createMasterDataController } = require('./masterData.controllerFactory');
const mucDoUuTienService = require('../services/mucDoUuTien.service');

const controller = createMasterDataController({
  service: mucDoUuTienService,
  messages: {
    list: 'L?y danh s?ch m?c ?? ?u ti?n th?nh c?ng',
    detail: 'L?y chi ti?t m?c ?? ?u ti?n th?nh c?ng',
    create: 'T?o m?c ?? ?u ti?n th?nh c?ng',
    update: 'C?p nh?t m?c ?? ?u ti?n th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i m?c ?? ?u ti?n th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i m?c ?? ?u ti?n kh?ng thay ??i',
  },
});

module.exports = {
  getMucDoUuTien: controller.getList,
  getMucDoUuTienById: controller.getDetail,
  createMucDoUuTien: controller.create,
  updateMucDoUuTien: controller.update,
  updateMucDoUuTienStatus: controller.updateStatus,
};


