const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const baoCaoService = require('../services/baoCao.service');

const getBaoCaoThietBiTheoLoai = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiTheoLoai(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo tổng số thiết bị theo loại thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiTheoDonVi = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiTheoDonVi(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo tổng số thiết bị theo đơn vị thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiTheoTrangThai = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiTheoTrangThai(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo thiết bị theo trạng thái thành công',
    data: result.items,
  });
});

const getBaoCaoThietBiSapHetBaoHanh = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiSapHetBaoHanh(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo thiết bị sắp hết bảo hành thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiHongHoacBaoTri = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiHongHoacBaoTri(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo thiết bị hỏng hoặc đang bảo trì thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoChiPhiSuaChuaTheoThang = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoChiPhiSuaChuaTheoThang(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo chi phí sửa chữa theo tháng thành công',
    data: result.items,
  });
});

const getBaoCaoChiPhiSuaChuaTheoQuy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoChiPhiSuaChuaTheoQuy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo chi phí sửa chữa theo quý thành công',
    data: result.items,
  });
});

const getBaoCaoChiPhiSuaChuaTheoNam = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoChiPhiSuaChuaTheoNam(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo chi phí sửa chữa theo năm thành công',
    data: result.items,
  });
});

const getBaoCaoLichSuDieuChuyen = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoLichSuDieuChuyen(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo lịch sử điều chuyển thiết bị thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoKetQuaKiemKeTheoKy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoKetQuaKiemKeTheoKy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo kết quả kiểm kê theo kỳ thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiDeXuatThanhLy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiDeXuatThanhLy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo thiết bị đề xuất thanh lý thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiDaThanhLy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiDaThanhLy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Lấy báo cáo thiết bị đã thanh lý thành công',
    data: result.items,
    meta: result.pagination,
  });
});

module.exports = {
  getBaoCaoThietBiTheoLoai,
  getBaoCaoThietBiTheoDonVi,
  getBaoCaoThietBiTheoTrangThai,
  getBaoCaoThietBiSapHetBaoHanh,
  getBaoCaoThietBiHongHoacBaoTri,
  getBaoCaoChiPhiSuaChuaTheoThang,
  getBaoCaoChiPhiSuaChuaTheoQuy,
  getBaoCaoChiPhiSuaChuaTheoNam,
  getBaoCaoLichSuDieuChuyen,
  getBaoCaoKetQuaKiemKeTheoKy,
  getBaoCaoThietBiDeXuatThanhLy,
  getBaoCaoThietBiDaThanhLy,
};
