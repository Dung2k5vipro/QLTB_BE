const { createMasterDataController } = require('./masterData.controllerFactory');
const donViSuaChuaService = require('../services/donViSuaChua.service');

const controller = createMasterDataController({
  service: donViSuaChuaService,
  messages: {
    list: 'Lay danh sach don vi sua chua thanh cong',
    detail: 'Lay chi tiet don vi sua chua thanh cong',
    create: 'Tao don vi sua chua thanh cong',
    update: 'Cap nhat don vi sua chua thanh cong',
    updateStatus: 'Cap nhat trang thai don vi sua chua thanh cong',
    statusUnchanged: 'Trang thai don vi sua chua khong thay doi',
  },
});

module.exports = {
  getDonViSuaChua: controller.getList,
  getDonViSuaChuaById: controller.getDetail,
  createDonViSuaChua: controller.create,
  updateDonViSuaChua: controller.update,
  updateDonViSuaChuaStatus: controller.updateStatus,
};
