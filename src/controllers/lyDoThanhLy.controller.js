const { createMasterDataController } = require('./masterData.controllerFactory');
const lyDoThanhLyService = require('../services/lyDoThanhLy.service');

const controller = createMasterDataController({
  service: lyDoThanhLyService,
  messages: {
    list: 'Lay danh sach ly do thanh ly thanh cong',
    detail: 'Lay chi tiet ly do thanh ly thanh cong',
    create: 'Tao ly do thanh ly thanh cong',
    update: 'Cap nhat ly do thanh ly thanh cong',
    updateStatus: 'Cap nhat trang thai ly do thanh ly thanh cong',
    statusUnchanged: 'Trang thai ly do thanh ly khong thay doi',
  },
});

module.exports = {
  getLyDoThanhLy: controller.getList,
  getLyDoThanhLyById: controller.getDetail,
  createLyDoThanhLy: controller.create,
  updateLyDoThanhLy: controller.update,
  updateLyDoThanhLyStatus: controller.updateStatus,
};
