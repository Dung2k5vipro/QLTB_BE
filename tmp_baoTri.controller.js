const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const baoTriService = require('../services/baoTri.service');

const tiepNhanBaoTriThuCong = asyncHandler(async (req, res) => {
  const created = await baoTriService.tiepNhanBaoTriThuCong(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tiếp nhận bảo trì thủ công thành công',
    data: created,
  });
});

const createNhatKyBaoTri = asyncHandler(async (req, res) => {
  const created = await baoTriService.createNhatKyBaoTri(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tạo nhật ký bảo trì/sửa chữa thành công',
    data: created,
  });
});

const getNhatKyBaoTriList = asyncHandler(async (req, res) => {
  const result = await baoTriService.getNhatKyBaoTriList(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách nhật ký bảo trì/sửa chữa thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getNhatKyBaoTriDetail = asyncHandler(async (req, res) => {
  const detail = await baoTriService.getNhatKyBaoTriDetail(req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết nhật ký bảo trì/sửa chữa thành công',
    data: detail,
  });
});

const updateNhatKyBaoTri = asyncHandler(async (req, res) => {
  const updated = await baoTriService.updateNhatKyBaoTri(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật nhật ký bảo trì/sửa chữa thành công',
    data: updated,
  });
});

const completeNhatKyBaoTri = asyncHandler(async (req, res) => {
  const completed = await baoTriService.completeNhatKyBaoTri(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Hoàn tất bảo trì/sửa chữa thành công',
    data: completed,
  });
});

const getLichSuBaoTriTheoThietBi = asyncHandler(async (req, res) => {
  const result = await baoTriService.getLichSuBaoTriTheoThietBi(req.params.thietBiId, req.query);

  return sendSuccess(res, {
    message: 'Lấy lịch sử bảo trì theo thiết bị thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getDanhSachBaoTriTheoPhieuBaoHong = asyncHandler(async (req, res) => {
  const result = await baoTriService.getDanhSachBaoTriTheoPhieuBaoHong(
    req.params.phieuBaoHongId,
    req.query,
  );

  return sendSuccess(res, {
    message: 'Lấy danh sách bảo trì theo phiếu báo hỏng thành công',
    data: result.items,
    meta: result.pagination,
  });
});

module.exports = {
  tiepNhanBaoTriThuCong,
  createNhatKyBaoTri,
  getNhatKyBaoTriList,
  getNhatKyBaoTriDetail,
  updateNhatKyBaoTri,
  completeNhatKyBaoTri,
  getLichSuBaoTriTheoThietBi,
  getDanhSachBaoTriTheoPhieuBaoHong,
};

