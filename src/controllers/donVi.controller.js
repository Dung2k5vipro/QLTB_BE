const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const donViService = require('../services/donVi.service');

const getDonVi = asyncHandler(async (req, res) => {
  const result = await donViService.getDonViList(req.query);

  return sendSuccess(res, {
    message: 'L?y danh s?ch ??n v? th?nh c?ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getOptions = asyncHandler(async (req, res) => {
  const options = await donViService.getDonViOptions(req.query);

  return sendSuccess(res, {
    message: 'L?y danh s?ch ??n v? options th?nh c?ng',
    data: options,
  });
});

const getDonViById = asyncHandler(async (req, res) => {
  const donVi = await donViService.getDonViById(req.params.id);

  return sendSuccess(res, {
    message: 'L?y chi ti?t ??n v? th?nh c?ng',
    data: donVi,
  });
});

const createDonVi = asyncHandler(async (req, res) => {
  const createdDonVi = await donViService.createDonVi(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'T?o ??n v? th?nh c?ng',
    data: createdDonVi,
  });
});

const updateDonVi = asyncHandler(async (req, res) => {
  const updatedDonVi = await donViService.updateDonVi(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'C?p nh?t ??n v? th?nh c?ng',
    data: updatedDonVi,
  });
});

const updateDonViStatus = asyncHandler(async (req, res) => {
  const result = await donViService.updateDonViStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.changed ? 'C?p nh?t tr?ng th?i ??n v? th?nh c?ng' : 'Tr?ng th?i ??n v? kh?ng thay ??i',
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


