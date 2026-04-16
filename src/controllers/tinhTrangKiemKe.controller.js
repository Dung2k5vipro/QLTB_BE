const { createMasterDataController } = require('./masterData.controllerFactory');
const tinhTrangKiemKeService = require('../services/tinhTrangKiemKe.service');

const controller = createMasterDataController({
  service: tinhTrangKiemKeService,
  messages: {
    list: 'Lay danh sach tinh trang kiem ke thanh cong',
    detail: 'Lay chi tiet tinh trang kiem ke thanh cong',
    create: 'Tao tinh trang kiem ke thanh cong',
    update: 'Cap nhat tinh trang kiem ke thanh cong',
    updateStatus: 'Cap nhat trang thai tinh trang kiem ke thanh cong',
    statusUnchanged: 'Trang thai tinh trang kiem ke khong thay doi',
  },
});

module.exports = {
  getTinhTrangKiemKe: controller.getList,
  getTinhTrangKiemKeById: controller.getDetail,
  createTinhTrangKiemKe: controller.create,
  updateTinhTrangKiemKe: controller.update,
  updateTinhTrangKiemKeStatus: controller.updateStatus,
};
