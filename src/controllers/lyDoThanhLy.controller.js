const { createMasterDataController } = require('./masterData.controllerFactory');
const lyDoThanhLyService = require('../services/lyDoThanhLy.service');

const controller = createMasterDataController({
  service: lyDoThanhLyService,
  messages: {
    list: 'Lấy danh sách lý do thanh lý thành công',
    detail: 'Lấy chi tiết lý do thanh lý thành công',
    create: 'Tạo lý do thanh lý thành công',
    update: 'Cập nhật lý do thanh lý thành công',
    updateStatus: 'Cập nhật trạng thái lý do thanh lý thành công',
    statusUnchanged: 'Trạng thái lý do thanh lý không thay đổi',
  },
});

module.exports = {
  getLyDoThanhLy: controller.getList,
  getLyDoThanhLyById: controller.getDetail,
  createLyDoThanhLy: controller.create,
  updateLyDoThanhLy: controller.update,
  updateLyDoThanhLyStatus: controller.updateStatus,
};



