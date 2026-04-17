const { createMasterDataController } = require('./masterData.controllerFactory');
const lyDoThanhLyService = require('../services/lyDoThanhLy.service');

const controller = createMasterDataController({
  service: lyDoThanhLyService,
  messages: {
    list: 'L?y danh s?ch l? do thanh l? th?nh c?ng',
    detail: 'L?y chi ti?t l? do thanh l? th?nh c?ng',
    create: 'T?o l? do thanh l? th?nh c?ng',
    update: 'C?p nh?t l? do thanh l? th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i l? do thanh l? th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i l? do thanh l? kh?ng thay ??i',
  },
});

module.exports = {
  getLyDoThanhLy: controller.getList,
  getLyDoThanhLyById: controller.getDetail,
  createLyDoThanhLy: controller.create,
  updateLyDoThanhLy: controller.update,
  updateLyDoThanhLyStatus: controller.updateStatus,
};


