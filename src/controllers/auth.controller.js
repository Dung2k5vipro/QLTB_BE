const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const authService = require('../services/auth.service');

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Đăng nhập thành công',
    data: result,
  });
});

const bootstrapAdmin = asyncHandler(async (req, res) => {
  const result = await authService.bootstrapAdmin(req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Khởi tạo admin thành công',
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.nguoi_dung_id);

  return sendSuccess(res, {
    message: 'Lấy thông tin người dùng thành công',
    data: user,
  });
});

const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.message,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user.nguoi_dung_id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.message,
  });
});

module.exports = {
  bootstrapAdmin,
  login,
  getMe,
  logout,
  changePassword,
};


