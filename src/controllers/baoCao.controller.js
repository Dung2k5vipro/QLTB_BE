const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const baoCaoService = require('../services/baoCao.service');

const getBaoCaoThietBiTheoLoai = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiTheoLoai(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o t�ng s� thi�t b� theo lo�i th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiTheoDonVi = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiTheoDonVi(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o t�ng s� thi�t b� theo �n v� th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiTheoTrangThai = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiTheoTrangThai(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o thi�t b� theo tr�ng th�i th�nh c�ng',
    data: result.items,
  });
});

const getBaoCaoThietBiSapHetBaoHanh = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiSapHetBaoHanh(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o thi�t b� s�p h�t b�o h�nh th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiHongHoacBaoTri = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiHongHoacBaoTri(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o thi�t b� h�ng ho�c ang b�o tr� th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoChiPhiSuaChuaTheoThang = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoChiPhiSuaChuaTheoThang(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o chi ph� s�a ch�a theo th�ng th�nh c�ng',
    data: result.items,
  });
});

const getBaoCaoChiPhiSuaChuaTheoQuy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoChiPhiSuaChuaTheoQuy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o chi ph� s�a ch�a theo qu� th�nh c�ng',
    data: result.items,
  });
});

const getBaoCaoChiPhiSuaChuaTheoNam = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoChiPhiSuaChuaTheoNam(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o chi ph� s�a ch�a theo nm th�nh c�ng',
    data: result.items,
  });
});

const getBaoCaoLichSuDieuChuyen = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoLichSuDieuChuyen(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o l�ch s� i�u chuy�n thi�t b� th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoKetQuaKiemKeTheoKy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoKetQuaKiemKeTheoKy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o k�t qu� ki�m k� theo k� th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiDeXuatThanhLy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiDeXuatThanhLy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o thi�t b� � xu�t thanh l� th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getBaoCaoThietBiDaThanhLy = asyncHandler(async (req, res) => {
  const result = await baoCaoService.getBaoCaoThietBiDaThanhLy(req.user, req.query, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'L�y b�o c�o thi�t b� � thanh l� th�nh c�ng',
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
