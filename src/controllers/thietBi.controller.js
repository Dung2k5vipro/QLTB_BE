const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const thietBiService = require('../services/thietBi.service');

const createDevice = asyncHandler(async (req, res) => {
  const createdDevice = await thietBiService.createDevice(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tạo thiết bị thành công',
    data: createdDevice,
  });
});

const getDevices = asyncHandler(async (req, res) => {
  const result = await thietBiService.getDevices(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách thiết bị thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getDeviceById = asyncHandler(async (req, res) => {
  const device = await thietBiService.getDeviceById(req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết thiết bị thành công',
    data: device,
  });
});

const updateDevice = asyncHandler(async (req, res) => {
  const device = await thietBiService.updateDevice(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật thiết bị thành công',
    data: device,
  });
});

const updateDeviceStatus = asyncHandler(async (req, res) => {
  const result = await thietBiService.updateDeviceStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.changed ? 'Cập nhật trạng thái thiết bị thành công' : 'Trạng thái thiết bị không thay đổi',
    data: result.device,
  });
});

const capPhatThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.capPhatThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cấp phát thiết bị thành công',
    data: result,
  });
});

const banGiaoThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.banGiaoThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Bàn giao thiết bị thành công',
    data: result,
  });
});

const dieuChuyenThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.dieuChuyenThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Điều chuyển thiết bị thành công',
    data: result,
  });
});

const thuHoiThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.thuHoiThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Thu hồi thiết bị thành công',
    data: result,
  });
});

const getTransferHistory = asyncHandler(async (req, res) => {
  const result = await thietBiService.getTransferHistory(req.query);

  return sendSuccess(res, {
    message: 'Lấy lịch sử cấp phát, bàn giao, điều chuyển, thu hồi thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getDeviceStatusHistory = asyncHandler(async (req, res) => {
  const history = await thietBiService.getDeviceStatusHistory(req.params.id);

  return sendSuccess(res, {
    message: 'Lấy lịch sử trạng thái thiết bị thành công',
    data: history,
  });
});

module.exports = {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  updateDeviceStatus,
  capPhatThietBi,
  banGiaoThietBi,
  dieuChuyenThietBi,
  thuHoiThietBi,
  getTransferHistory,
  getDeviceStatusHistory,
};



