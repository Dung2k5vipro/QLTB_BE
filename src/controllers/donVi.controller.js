const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const donViService = require('../services/donVi.service');

const getDonVi = asyncHandler(async (req, res) => {
  const result = await donViService.getDonViList(req.query);

  return sendSuccess(res, {
    message: 'Lay danh sach don vi thanh cong',
    data: result.items,
    meta: result.pagination,
  });
});

const getOptions = asyncHandler(async (req, res) => {
  const options = await donViService.getDonViOptions(req.query);

  return sendSuccess(res, {
    message: 'Lay danh sach don vi options thanh cong',
    data: options,
  });
});

const getDonViById = asyncHandler(async (req, res) => {
  const donVi = await donViService.getDonViById(req.params.id);

  return sendSuccess(res, {
    message: 'Lay chi tiet don vi thanh cong',
    data: donVi,
  });
});

const createDonVi = asyncHandler(async (req, res) => {
  const createdDonVi = await donViService.createDonVi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tao don vi thanh cong',
    data: createdDonVi,
  });
});

const updateDonVi = asyncHandler(async (req, res) => {
  const updatedDonVi = await donViService.updateDonVi(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cap nhat don vi thanh cong',
    data: updatedDonVi,
  });
});

const updateDonViStatus = asyncHandler(async (req, res) => {
  const result = await donViService.updateDonViStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.changed ? 'Cap nhat trang thai don vi thanh cong' : 'Trang thai don vi khong thay doi',
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
