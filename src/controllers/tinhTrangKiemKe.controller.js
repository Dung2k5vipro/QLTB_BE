const { createMasterDataController } = require('./masterData.controllerFactory');
const tinhTrangKiemKeService = require('../services/tinhTrangKiemKe.service');

const controller = createMasterDataController({
  service: tinhTrangKiemKeService,
  messages: {
    list: 'L?y danh s?ch t?nh tr?ng ki?m k? th?nh c?ng',
    detail: 'L?y chi ti?t t?nh tr?ng ki?m k? th?nh c?ng',
    create: 'T?o t?nh tr?ng ki?m k? th?nh c?ng',
    update: 'C?p nh?t t?nh tr?ng ki?m k? th?nh c?ng',
    updateStatus: 'C?p nh?t tr?ng th?i t?nh tr?ng ki?m k? th?nh c?ng',
    statusUnchanged: 'Tr?ng th?i t?nh tr?ng ki?m k? kh?ng thay ??i',
  },
});

module.exports = {
  getTinhTrangKiemKe: controller.getList,
  getTinhTrangKiemKeById: controller.getDetail,
  createTinhTrangKiemKe: controller.create,
  updateTinhTrangKiemKe: controller.update,
  updateTinhTrangKiemKeStatus: controller.updateStatus,
};


