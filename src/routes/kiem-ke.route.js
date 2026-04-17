const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const kiemKeController = require('../controllers/kiemKe.controller');
const kiemKeValidation = require('../validations/kiemKe.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'NGUOI_DUYET', 'GIAO_VIEN'];
const WRITE_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI'];
const CONFIRM_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI'];
const COMPLETE_ROLES = ['ADMIN', 'NGUOI_DUYET'];

router.use(authMiddleware);

router.post(
  '/phieu-kiem-ke',
  authorizeRoles(...WRITE_ROLES),
  validate(kiemKeValidation.createPhieuKiemKe),
  kiemKeController.createPhieuKiemKe,
);

router.get(
  '/phieu-kiem-ke',
  authorizeRoles(...READ_ROLES),
  validate(kiemKeValidation.getPhieuKiemKeListQuery),
  kiemKeController.getPhieuKiemKeList,
);

router.get(
  '/phieu-kiem-ke/:id/chi-tiet',
  authorizeRoles(...READ_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.getChiTietKiemKeListQuery),
  kiemKeController.getChiTietKiemKeList,
);

router.patch(
  '/phieu-kiem-ke/:id/chi-tiet/:chi_tiet_id',
  authorizeRoles(...WRITE_ROLES),
  validate(kiemKeValidation.phieuAndChiTietIdParam),
  validate(kiemKeValidation.updateChiTietKiemKe),
  kiemKeController.updateChiTietKiemKe,
);

router.patch(
  '/phieu-kiem-ke/:id/chi-tiet',
  authorizeRoles(...WRITE_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.bulkUpdateChiTietKiemKe),
  kiemKeController.bulkUpdateChiTietKiemKe,
);

router.get(
  '/phieu-kiem-ke/:id/lich-su',
  authorizeRoles(...READ_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.getPhieuKiemKeHistoryQuery),
  kiemKeController.getPhieuKiemKeHistory,
);

router.get(
  '/phieu-kiem-ke/:id',
  authorizeRoles(...READ_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  kiemKeController.getPhieuKiemKeDetail,
);

router.patch(
  '/phieu-kiem-ke/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.updatePhieuKiemKe),
  kiemKeController.updatePhieuKiemKe,
);

router.patch(
  '/phieu-kiem-ke/:id/trang-thai',
  authorizeRoles(...WRITE_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.chuyenTrangThaiPhieuKiemKe),
  kiemKeController.chuyenTrangThaiPhieuKiemKe,
);

router.patch(
  '/phieu-kiem-ke/:id/xac-nhan',
  authorizeRoles(...CONFIRM_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.xacNhanPhieuKiemKe),
  kiemKeController.xacNhanPhieuKiemKe,
);

router.patch(
  '/phieu-kiem-ke/:id/huy',
  authorizeRoles(...WRITE_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.huyPhieuKiemKe),
  kiemKeController.huyPhieuKiemKe,
);

router.patch(
  '/phieu-kiem-ke/:id/hoan-tat',
  authorizeRoles(...COMPLETE_ROLES),
  validate(kiemKeValidation.phieuKiemKeIdParam),
  validate(kiemKeValidation.hoanTatPhieuKiemKe),
  kiemKeController.hoanTatPhieuKiemKe,
);

module.exports = router;

