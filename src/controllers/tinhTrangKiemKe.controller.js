const { createMasterDataController } = require('./masterData.controllerFactory');
const tinhTrangKiemKeService = require('../services/tinhTrangKiemKe.service');

const controller = createMasterDataController({
  service: tinhTrangKiemKeService,
  messages: {
    list: 'Lấy danh sách tình trạng kiểm kê thành công',
    detail: 'Lấy chi tiết tình trạng kiểm kê thành công',
    create: 'Tạo tình trạng kiểm kê thành công',
    update: 'Cập nhật tình trạng kiểm kê thành công',
    updateStatus: 'Cập nhật trạng thái tình trạng kiểm kê thành công',
    statusUnchanged: 'Trạng thái tình trạng kiểm kê không thay đổi',
  },
});

module.exports = {
  getTinhTrangKiemKe: controller.getList,
  getTinhTrangKiemKeById: controller.getDetail,
  createTinhTrangKiemKe: controller.create,
  updateTinhTrangKiemKe: controller.update,
  updateTinhTrangKiemKeStatus: controller.updateStatus,
};



