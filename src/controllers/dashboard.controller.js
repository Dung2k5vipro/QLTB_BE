const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const dashboardService = require('../services/dashboard.service');

const getTongQuanDashboard = asyncHandler(async (req, res) => {
  const result = await dashboardService.getTongQuanDashboard(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy dữ liệu dashboard tổng quan thành công',
    data: result,
  });
});

module.exports = {
  getTongQuanDashboard,
};
