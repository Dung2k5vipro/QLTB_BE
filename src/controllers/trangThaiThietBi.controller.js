const { createMasterDataController } = require('./masterData.controllerFactory');
const trangThaiThietBiService = require('../services/trangThaiThietBi.service');

const controller = createMasterDataController({
  service: trangThaiThietBiService,
  messages: {
    list: 'Lay danh sach trang thai thiet bi thanh cong',
    detail: 'Lay chi tiet trang thai thiet bi thanh cong',
    create: 'Tao trang thai thiet bi thanh cong',
    update: 'Cap nhat trang thai thiet bi thanh cong',
    updateStatus: 'Cap nhat trang thai kich hoat trang thai thiet bi thanh cong',
    statusUnchanged: 'Trang thai kich hoat khong thay doi',
  },
});

module.exports = {
  getTrangThaiThietBi: controller.getList,
  getTrangThaiThietBiById: controller.getDetail,
  createTrangThaiThietBi: controller.create,
  updateTrangThaiThietBi: controller.update,
  updateTrangThaiThietBiStatus: controller.updateStatus,
};
