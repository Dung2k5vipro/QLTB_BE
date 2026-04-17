const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const baoHongService = require('../services/baoHong.service');

const createPhieuBaoHong = asyncHandler(async (req, res) => {
  const created = await baoHongService.createPhieuBaoHong(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tạo phiếu báo hỏng thành công',
    data: created,
  });
});

const getPhieuBaoHongList = asyncHandler(async (req, res) => {
  const result = await baoHongService.getPhieuBaoHongList(req.user, req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách phiếu báo hỏng thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getPhieuBaoHongDetail = asyncHandler(async (req, res) => {
  const detail = await baoHongService.getPhieuBaoHongDetail(req.user, req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết phiếu báo hỏng thành công',
    data: detail,
  });
});

const tiepNhanPhieuBaoHong = asyncHandler(async (req, res) => {
  const updated = await baoHongService.tiepNhanPhieuBaoHong(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Tiếp nhận phiếu báo hỏng thành công',
    data: updated,
  });
});

const capNhatXuLyPhieuBaoHong = asyncHandler(async (req, res) => {
  const updated = await baoHongService.capNhatXuLyPhieuBaoHong(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật xử lý thành công',
    data: updated,
  });
});

const hoanThanhPhieuBaoHong = asyncHandler(async (req, res) => {
  const updated = await baoHongService.hoanThanhPhieuBaoHong(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Hoàn thành phiếu báo hỏng thành công',
    data: updated,
  });
});

const tuChoiPhieuBaoHong = asyncHandler(async (req, res) => {
  const updated = await baoHongService.tuChoiPhieuBaoHong(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Từ chđi phiếu báo hỏng thành công',
    data: updated,
  });
});

const huyPhieuBaoHong = asyncHandler(async (req, res) => {
  const updated = await baoHongService.huyPhieuBaoHong(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Hủy phiếu báo hỏng thành công',
    data: updated,
  });
});

const getNhatKyBaoTriList = asyncHandler(async (req, res) => {
  const result = await baoHongService.getNhatKyBaoTriList(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách nhật ký bảo trì thành công',
    data: result.items,
    meta: result.pagination,
  });
});

module.exports = {
  createPhieuBaoHong,
  getPhieuBaoHongList,
  getPhieuBaoHongDetail,
  tiepNhanPhieuBaoHong,
  capNhatXuLyPhieuBaoHong,
  hoanThanhPhieuBaoHong,
  tuChoiPhieuBaoHong,
  huyPhieuBaoHong,
  getNhatKyBaoTriList,
};

