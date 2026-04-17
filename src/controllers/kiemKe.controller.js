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
    message: 'T�o phi�u ki�m k� th�nh c�ng',
    data: created,
  });
});

const getPhieuKiemKeList = asyncHandler(async (req, res) => {
  const result = await kiemKeService.getPhieuKiemKeList(req.query);

  return sendSuccess(res, {
    message: 'L�y danh s�ch phi�u ki�m k� th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getPhieuKiemKeDetail = asyncHandler(async (req, res) => {
  const detail = await kiemKeService.getPhieuKiemKeDetail(req.params.id);

  return sendSuccess(res, {
    message: 'L�y chi ti�t phi�u ki�m k� th�nh c�ng',
    data: detail,
  });
});

const updatePhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.updatePhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'C�p nh�t phi�u ki�m k� th�nh c�ng',
    data: updated,
  });
});

const chuyenTrangThaiPhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.chuyenTrangThaiPhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Chuy�n tr�ng th�i phi�u ki�m k� th�nh c�ng',
    data: updated,
  });
});

const xacNhanPhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.xacNhanPhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'X�c nh�n phi�u ki�m k� th�nh c�ng',
    data: updated,
  });
});

const huyPhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.huyPhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'H�y phi�u ki�m k� th�nh c�ng',
    data: updated,
  });
});

const hoanTatPhieuKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.hoanTatPhieuKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Ho�n t�t phi�u ki�m k� th�nh c�ng',
    data: updated,
  });
});

const getChiTietKiemKeList = asyncHandler(async (req, res) => {
  const result = await kiemKeService.getChiTietKiemKeList(req.params.id, req.query);

  return sendSuccess(res, {
    message: 'L�y danh s�ch chi ti�t ki�m k� th�nh c�ng',
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
    message: 'C�p nh�t chi ti�t ki�m k� th�nh c�ng',
    data: updated,
  });
});

const bulkUpdateChiTietKiemKe = asyncHandler(async (req, res) => {
  const updated = await kiemKeService.bulkUpdateChiTietKiemKe(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'C�p nh�t h�ng lo�t chi ti�t ki�m k� th�nh c�ng',
    data: updated,
  });
});

const getPhieuKiemKeHistory = asyncHandler(async (req, res) => {
  const result = await kiemKeService.getPhieuKiemKeHistory(req.params.id, req.query);

  return sendSuccess(res, {
    message: 'L�y l�ch s� ki�m k� th�nh c�ng',
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
  xacNhanPhieuKiemKe,
  huyPhieuKiemKe,
  hoanTatPhieuKiemKe,
  getChiTietKiemKeList,
  updateChiTietKiemKe,
  bulkUpdateChiTietKiemKe,
  getPhieuKiemKeHistory,
};

