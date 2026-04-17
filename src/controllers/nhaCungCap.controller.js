const { createMasterDataController } = require('./masterData.controllerFactory');
const nhaCungCapService = require('../services/nhaCungCap.service');

const controller = createMasterDataController({
  service: nhaCungCapService,
  messages: {
    list: 'L?y danh s?ch nh? cung c?p th?nh c?ng',
    detail: 'L?y chi ti?t nh? cung c?p th?nh c?ng',
    create: 'T?o nh? cung c?p th?nh c?ng',
    update: 'C?p nh?t nh? cung c?p th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i nh? cung c?p th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i nh? cung c?p kh?ng thay ??i',
  },
});

module.exports = {
  getNhaCungCap: controller.getList,
  getNhaCungCapById: controller.getDetail,
  createNhaCungCap: controller.create,
  updateNhaCungCap: controller.update,
  updateNhaCungCapStatus: controller.updateStatus,
};


