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
    message: 'Ti�p nh�n b�o tr� th� c�ng th�nh c�ng',
    data: created,
  });
});

const createNhatKyBaoTri = asyncHandler(async (req, res) => {
  const created = await baoTriService.createNhatKyBaoTri(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'T�o nh�t k� b�o tr�/s�a ch�a th�nh c�ng',
    data: created,
  });
});

const getNhatKyBaoTriList = asyncHandler(async (req, res) => {
  const result = await baoTriService.getNhatKyBaoTriList(req.query);

  return sendSuccess(res, {
    message: 'L�y danh s�ch nh�t k� b�o tr�/s�a ch�a th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getNhatKyBaoTriDetail = asyncHandler(async (req, res) => {
  const detail = await baoTriService.getNhatKyBaoTriDetail(req.params.id);

  return sendSuccess(res, {
    message: 'L�y chi ti�t nh�t k� b�o tr�/s�a ch�a th�nh c�ng',
    data: detail,
  });
});

const updateNhatKyBaoTri = asyncHandler(async (req, res) => {
  const updated = await baoTriService.updateNhatKyBaoTri(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'C�p nh�t nh�t k� b�o tr�/s�a ch�a th�nh c�ng',
    data: updated,
  });
});

const completeNhatKyBaoTri = asyncHandler(async (req, res) => {
  const completed = await baoTriService.completeNhatKyBaoTri(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Ho�n t�t b�o tr�/s�a ch�a th�nh c�ng',
    data: completed,
  });
});

const getLichSuBaoTriTheoThietBi = asyncHandler(async (req, res) => {
  const result = await baoTriService.getLichSuBaoTriTheoThietBi(req.params.thietBiId, req.query);

  return sendSuccess(res, {
    message: 'L�y l�ch s� b�o tr� theo thi�t b� th�nh c�ng',
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
    message: 'L�y danh s�ch b�o tr� theo phi�u b�o h�ng th�nh c�ng',
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

