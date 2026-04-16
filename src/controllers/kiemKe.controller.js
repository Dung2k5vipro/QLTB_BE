const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const kiemKeService = require('../services/kiemKe.service');

const createPhieuKiemKe = asyncHandler(async (req, res) => {
  const created = await kiemKeService.createPhieuKiemKe(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tạo phiếu kiểm kê thành công',
    data: created,
  });
});

const getPhieuKiemKeList = asyncHandler(async (req, res) => {
  const result = await kiemKeService.getPhieuKiemKeList(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách phiếu kiểm kê thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getPhieuKiemKeDetail = asyncHandler(async (req, res) => {
  const detail = await kiemKeService.getPhieuKiemKeDetail(req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết phiếu kiểm kê thành công',
    data: detail,
  });
});

const updatePhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.updatePhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật phiếu kiểm kê thành công',
    data: updated,
  });
});

const chuyenTrangThaiPhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.chuyenTrangThaiPhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Chuyển trạng thái phiếu kiểm kê thành công',
    data: updated,
  });
});

const huyPhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.huyPhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Hủy phiếu kiểm kê thành công',
    data: updated,
  });
});

const hoanTatPhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.hoanTatPhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Hoàn tất phiếu kiểm kê thành công',
    data: updated,
  });
});

const getChiTietKiemKeList = asyncHandler(async (req, res) => {
  const result = await kiemKeService.getChiTietKiemKeList(req.params.id, req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách chi tiết kiểm kê thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const updateChiTietKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.updateChiTietKiemKe(
    req.user,
    req.params.id,
    req.params.chi_tiet_id,
    req.body,
    {
      ipAddress: getRequestIp(req),
    },
  );

  return sendSuccess(res, {
    message: 'Cập nhật chi tiết kiểm kê thành công',
    data: updated,
  });
});

const bulkUpdateChiTietKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.bulkUpdateChiTietKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật hàng loạt chi tiết kiểm kê thành công',
    data: updated,
  });
});

const getPhieuKiemKeHistory = asyncHandler(async (req, res) => {
  const result = await kiemKeService.getPhieuKiemKeHistory(req.params.id, req.query);

  return sendSuccess(res, {
    message: 'Lấy lịch sử kiểm kê thành công',
    data: result.items,
    meta: result.pagination,
  });
});

module.exports = {
  createPhieuKiemKe,
  getPhieuKiemKeList,
  getPhieuKiemKeDetail,
  updatePhieuKiemKe,
  chuyenTrangThaiPhieuKiemKe,
  huyPhieuKiemKe,
  hoanTatPhieuKiemKe,
  getChiTietKiemKeList,
  updateChiTietKiemKe,
  bulkUpdateChiTietKiemKe,
  getPhieuKiemKeHistory,
};
