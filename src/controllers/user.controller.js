const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const userService = require('../services/user.service');

const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await userService.getMyProfile(req.user.nguoi_dung_id);

  return sendSuccess(res, {
    message: 'Lay ho so thanh cong',
    data: profile,
  });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await userService.updateMyProfile(req.user.nguoi_dung_id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cap nhat ho so thanh cong',
    data: profile,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getUsers(req.query);

  return sendSuccess(res, {
    message: 'Lay danh sach tai khoan thanh cong',
    data: result.items,
    meta: result.pagination,
  });
});

const createUser = asyncHandler(async (req, res) => {
  const createdUser = await userService.createUser(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tao tai khoan thanh cong',
    data: createdUser,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return sendSuccess(res, {
    message: 'Lay chi tiet tai khoan thanh cong',
    data: user,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cap nhat tai khoan thanh cong',
    data: user,
  });
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await userService.updateUserStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cap nhat trang thai tai khoan thanh cong',
    data: user,
  });
});

const resetUserPassword = asyncHandler(async (req, res) => {
  const result = await userService.resetUserPassword(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.message,
  });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getUsers,
  createUser,
  getUserById,
  updateUser,
  updateUserStatus,
  resetUserPassword,
};
