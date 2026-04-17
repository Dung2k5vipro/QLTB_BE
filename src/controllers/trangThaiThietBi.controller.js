const { createMasterDataController } = require('./masterData.controllerFactory');
const trangThaiThietBiService = require('../services/trangThaiThietBi.service');

const controller = createMasterDataController({
  service: trangThaiThietBiService,
  messages: {
    list: 'L?y danh s?ch tr?ng th?i thi?t b? th?nh c?ng',
    detail: 'L?y chi ti?t tr?ng th?i thi?t b? th?nh c?ng',
    create: 'T?o tr?ng th?i thi?t b? th?nh c?ng',
    update: 'C?p nh?t tr?ng th?i thi?t b? th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i kich hoat tr?ng th?i thi?t b? th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i kich hoat kh?ng thay ??i',
  },
});

module.exports = {
  getTrangThaiThietBi: controller.getList,
  getTrangThaiThietBiById: controller.getDetail,
  createTrangThaiThietBi: controller.create,
  updateTrangThaiThietBi: controller.update,
  updateTrangThaiThietBiStatus: controller.updateStatus,
};


