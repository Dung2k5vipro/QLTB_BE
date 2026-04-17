const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const thanhLyService = require('../services/thanhLy.service');

const createPhieuThanhLy = asyncHandler(async (req, res) => {
  const created = await thanhLyService.createPhieuThanhLy(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tạo phiếu thanh lý thành công',
    data: created,
  });
});

const getPhieuThanhLyList = asyncHandler(async (req, res) => {
  const result = await thanhLyService.getPhieuThanhLyList(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách phiếu thanh lý thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getPhieuThanhLyDetail = asyncHandler(async (req, res) => {
  const detail = await thanhLyService.getPhieuThanhLyDetail(req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết phiếu thanh lý thành công',
    data: detail,
  });
});

const updatePhieuThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.updatePhieuThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật phiếu thanh lý thành công',
    data: updated,
  });
});

const getChiTietThanhLyList = asyncHandler(async (req, res) => {
  const result = await thanhLyService.getChiTietThanhLyList(req.params.id, req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách chi tiết thanh lý thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const addChiTietThanhLy = asyncHandler(async (req, res) => {
  const added = await thanhLyService.addChiTietThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Thêm chi tiết thanh lý thành công',
    data: added,
  });
});

const updateChiTietThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.updateChiTietThanhLy(
    req.user,
    req.params.id,
    req.params.chi_tiet_id,
    req.body,
    {
      ipAddress: getRequestIp(req),
    },
  );

  return sendSuccess(res, {
    message: 'Cập nhật chi tiết thanh lý thành công',
    data: updated,
  });
});

const deleteChiTietThanhLy = asyncHandler(async (req, res) => {
  const deleted = await thanhLyService.deleteChiTietThanhLy(
    req.user,
    req.params.id,
    req.params.chi_tiet_id,
    {
      ipAddress: getRequestIp(req),
    },
  );

  return sendSuccess(res, {
    message: 'Xóa chi tiết thanh lý thành công',
    data: deleted,
  });
});

const guiDuyetPhieuThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.guiDuyetPhieuThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Gửi duyệt phiếu thanh lý thành công',
    data: updated,
  });
});

const duyetPhieuThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.duyetPhieuThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Duyệt phiếu thanh lý thành công',
    data: updated,
  });
});

const tuChoiPhieuThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.tuChoiPhieuThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Từ chối phiếu thanh lý thành công',
    data: updated,
  });
});

const hoanTatPhieuThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.hoanTatPhieuThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Hoàn tất phiếu thanh lý thành công',
    data: updated,
  });
});

const huyPhieuThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.huyPhieuThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Hủy phiếu thanh lý thành công',
    data: updated,
  });
});

const chuyenTrangThaiPhieuThanhLy = asyncHandler(async (req, res) => {
  const updated = await thanhLyService.chuyenTrangThaiPhieuThanhLy(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Chuyển trạng thái phiếu thanh lý thành công',
    data: updated,
  });
});

const getPhieuThanhLyHistory = asyncHandler(async (req, res) => {
  const result = await thanhLyService.getPhieuThanhLyHistory(req.params.id, req.query);

  return sendSuccess(res, {
    message: 'Lấy lịch sử phiếu thanh lý thành công',
    data: result.items,
    meta: result.pagination,
  });
});

module.exports = {
  createPhieuThanhLy,
  getPhieuThanhLyList,
  getPhieuThanhLyDetail,
  updatePhieuThanhLy,
  getChiTietThanhLyList,
  addChiTietThanhLy,
  updateChiTietThanhLy,
  deleteChiTietThanhLy,
  guiDuyetPhieuThanhLy,
  duyetPhieuThanhLy,
  tuChoiPhieuThanhLy,
  hoanTatPhieuThanhLy,
  huyPhieuThanhLy,
  chuyenTrangThaiPhieuThanhLy,
  getPhieuThanhLyHistory,
};
