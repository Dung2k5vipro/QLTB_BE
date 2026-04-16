const { createMasterDataController } = require('./masterData.controllerFactory');
const mucDoUuTienService = require('../services/mucDoUuTien.service');

const controller = createMasterDataController({
  service: mucDoUuTienService,
  messages: {
    list: 'Lay danh sach muc do uu tien thanh cong',
    detail: 'Lay chi tiet muc do uu tien thanh cong',
    create: 'Tao muc do uu tien thanh cong',
    update: 'Cap nhat muc do uu tien thanh cong',
    updateStatus: 'Cap nhat trang thai muc do uu tien thanh cong',
    statusUnchanged: 'Trang thai muc do uu tien khong thay doi',
  },
});

module.exports = {
  getMucDoUuTien: controller.getList,
  getMucDoUuTienById: controller.getDetail,
  createMucDoUuTien: controller.create,
  updateMucDoUuTien: controller.update,
  updateMucDoUuTienStatus: controller.updateStatus,
};
