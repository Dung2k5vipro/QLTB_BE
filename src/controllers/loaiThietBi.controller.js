const { createMasterDataController } = require('./masterData.controllerFactory');
const loaiThietBiService = require('../services/loaiThietBi.service');

const controller = createMasterDataController({
  service: loaiThietBiService,
  messages: {
    list: 'L?y danh s?ch loai thi?t b? th?nh c?ng',
    detail: 'L?y chi ti?t loai thi?t b? th?nh c?ng',
    create: 'T?o loai thi?t b? th?nh c?ng',
    update: 'C?p nh?t loai thi?t b? th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i loai thi?t b? th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i loai thi?t b? kh?ng thay ??i',
  },
});

module.exports = {
  getLoaiThietBi: controller.getList,
  getLoaiThietBiById: controller.getDetail,
  createLoaiThietBi: controller.create,
  updateLoaiThietBi: controller.update,
  updateLoaiThietBiStatus: controller.updateStatus,
};


