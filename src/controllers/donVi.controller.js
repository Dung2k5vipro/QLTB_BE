const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const donViService = require('../services/donVi.service');

const getDonVi = asyncHandler(async (req, res) => {
  const result = await donViService.getDonViList(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách đơn vị thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getOptions = asyncHandler(async (req, res) => {
  const options = await donViService.getDonViOptions(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách đơn vị options thành công',
    data: options,
  });
});

const getDonViById = asyncHandler(async (req, res) => {
  const donVi = await donViService.getDonViById(req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết đơn vị thành công',
    data: donVi,
  });
});

const createDonVi = asyncHandler(async (req, res) => {
  const createdDonVi = await donViService.createDonVi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tạo đơn vị thành công',
    data: createdDonVi,
  });
});

const updateDonVi = asyncHandler(async (req, res) => {
  const updatedDonVi = await donViService.updateDonVi(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật đơn vị thành công',
    data: updatedDonVi,
  });
});

const updateDonViStatus = asyncHandler(async (req, res) => {
  const result = await donViService.updateDonViStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.changed ? 'Cập nhật trạng thái đơn vị thành công' : 'Trạng thái đơn vị không thay đổi',
    data: result.donVi,
  });
});

module.exports = {
  getDonVi,
  getOptions,
  getDonViById,
  createDonVi,
  updateDonVi,
  updateDonViStatus,
};



