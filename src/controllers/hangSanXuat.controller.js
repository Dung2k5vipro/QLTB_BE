const { createMasterDataController } = require('./masterData.controllerFactory');
const hangSanXuatService = require('../services/hangSanXuat.service');

const controller = createMasterDataController({
  service: hangSanXuatService,
  messages: {
    list: 'Lay danh sach hang san xuat thanh cong',
    detail: 'Lay chi tiet hang san xuat thanh cong',
    create: 'Tao hang san xuat thanh cong',
    update: 'Cap nhat hang san xuat thanh cong',
    updateStatus: 'Cap nhat trang thai hang san xuat thanh cong',
    statusUnchanged: 'Trang thai hang san xuat khong thay doi',
  },
});

module.exports = {
  getHangSanXuat: controller.getList,
  getHangSanXuatById: controller.getDetail,
  createHangSanXuat: controller.create,
  updateHangSanXuat: controller.update,
  updateHangSanXuatStatus: controller.updateStatus,
};
