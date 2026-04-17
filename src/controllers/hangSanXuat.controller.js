const { createMasterDataController } = require('./masterData.controllerFactory');
const hangSanXuatService = require('../services/hangSanXuat.service');

const controller = createMasterDataController({
  service: hangSanXuatService,
  messages: {
    list: 'Lấy danh sách hãng sản xuất thành công',
    detail: 'Lấy chi tiết hãng sản xuất thành công',
    create: 'Tạo hãng sản xuất thành công',
    update: 'Cập nhật hãng sản xuất thành công',
    updateStatus: 'Cập nhật trạng thái hãng sản xuất thành công',
    statusUnchanged: 'Trạng thái hãng sản xuất không thay đổi',
  },
});

module.exports = {
  getHangSanXuat: controller.getList,
  getHangSanXuatById: controller.getDetail,
  createHangSanXuat: controller.create,
  updateHangSanXuat: controller.update,
  updateHangSanXuatStatus: controller.updateStatus,
};
