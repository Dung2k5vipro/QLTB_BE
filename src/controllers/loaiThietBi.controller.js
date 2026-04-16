const { createMasterDataController } = require('./masterData.controllerFactory');
const loaiThietBiService = require('../services/loaiThietBi.service');

const controller = createMasterDataController({
  service: loaiThietBiService,
  messages: {
    list: 'Lay danh sach loai thiet bi thanh cong',
    detail: 'Lay chi tiet loai thiet bi thanh cong',
    create: 'Tao loai thiet bi thanh cong',
    update: 'Cap nhat loai thiet bi thanh cong',
    updateStatus: 'Cap nhat trang thai loai thiet bi thanh cong',
    statusUnchanged: 'Trang thai loai thiet bi khong thay doi',
  },
});

module.exports = {
  getLoaiThietBi: controller.getList,
  getLoaiThietBiById: controller.getDetail,
  createLoaiThietBi: controller.create,
  updateLoaiThietBi: controller.update,
  updateLoaiThietBiStatus: controller.updateStatus,
};
