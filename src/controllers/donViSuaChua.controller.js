const { createMasterDataController } = require('./masterData.controllerFactory');
const donViSuaChuaService = require('../services/donViSuaChua.service');

const controller = createMasterDataController({
  service: donViSuaChuaService,
  messages: {
    list: 'L?y danh s?ch ??n v? s?a ch?a th?nh c?ng',
    detail: 'L?y chi ti?t ??n v? s?a ch?a th?nh c?ng',
    create: 'T?o ??n v? s?a ch?a th?nh c?ng',
    update: 'C?p nh?t ??n v? s?a ch?a th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i ??n v? s?a ch?a th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i ??n v? s?a ch?a kh?ng thay ??i',
  },
});

module.exports = {
  getDonViSuaChua: controller.getList,
  getDonViSuaChuaById: controller.getDetail,
  createDonViSuaChua: controller.create,
  updateDonViSuaChua: controller.update,
  updateDonViSuaChuaStatus: controller.updateStatus,
};


