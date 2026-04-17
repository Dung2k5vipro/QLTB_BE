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
    message: 'T?o thi?t b? th?nh c?ng',
    data: createdDevice,
  });
});

const getDevices = asyncHandler(async (req, res) => {
  const result = await thietBiService.getDevices(req.query);

  return sendSuccess(res, {
    message: 'L?y danh s?ch thi?t b? th?nh c?ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getDeviceById = asyncHandler(async (req, res) => {
  const device = await thietBiService.getDeviceById(req.params.id);

  return sendSuccess(res, {
    message: 'L?y chi ti?t thi?t b? th?nh c?ng',
    data: device,
  });
});

const updateDevice = asyncHandler(async (req, res) => {
  const device = await thietBiService.updateDevice(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'C?p nh?t thi?t b? th?nh c?ng',
    data: device,
  });
});

const updateDeviceStatus = asyncHandler(async (req, res) => {
  const result = await thietBiService.updateDeviceStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.changed ? 'C?p nh?t tr?ng th?i thi?t b? th?nh c?ng' : 'Tr?ng th?i thi?t b? kh?ng thay ??i',
    data: result.device,
  });
});

const capPhatThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.capPhatThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cấp phát thiết b�9 thành công',
    data: result,
  });
});

const banGiaoThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.banGiaoThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Bàn giao thiết b�9 thành công',
    data: result,
  });
});

const dieuChuyenThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.dieuChuyenThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Điều chuyỒn thiết b�9 thành công',
    data: result,
  });
});

const thuHoiThietBi = asyncHandler(async (req, res) => {
  const result = await thietBiService.thuHoiThietBi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Thu h�i thiết b�9 thành công',
    data: result,
  });
});

const getTransferHistory = asyncHandler(async (req, res) => {
  const result = await thietBiService.getTransferHistory(req.query);

  return sendSuccess(res, {
    message: 'Lấy l�9ch sử cấp phát, bàn giao, �iều chuyỒn, thu h�i thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getDeviceStatusHistory = asyncHandler(async (req, res) => {
  const history = await thietBiService.getDeviceStatusHistory(req.params.id);

  return sendSuccess(res, {
    message: 'L?y l?ch s? tr?ng th?i thi?t b? th?nh c?ng',
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


