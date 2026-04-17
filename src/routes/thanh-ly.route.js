const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const thanhLyController = require('../controllers/thanhLy.controller');
const thanhLyValidation = require('../validations/thanhLy.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI'];
const APPROVE_ROLES = ['ADMIN', 'NGUOI_DUYET'];
const COMPLETE_ROLES = ['ADMIN', 'NGUOI_DUYET'];
const CANCEL_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'NGUOI_DUYET'];

router.use(authMiddleware);

router.post(
  '/phieu-thanh-ly',
  authorizeRoles(...WRITE_ROLES),
  validate(thanhLyValidation.createPhieuThanhLy),
  thanhLyController.createPhieuThanhLy,
);

router.get(
  '/phieu-thanh-ly',
  authorizeRoles(...READ_ROLES),
  validate(thanhLyValidation.getPhieuThanhLyListQuery),
  thanhLyController.getPhieuThanhLyList,
);

router.get(
  '/phieu-thanh-ly/:id/chi-tiet',
  authorizeRoles(...READ_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.getChiTietThanhLyListQuery),
  thanhLyController.getChiTietThanhLyList,
);

router.post(
  '/phieu-thanh-ly/:id/chi-tiet',
  authorizeRoles(...WRITE_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.addChiTietThanhLy),
  thanhLyController.addChiTietThanhLy,
);

router.patch(
  '/phieu-thanh-ly/:id/chi-tiet/:chi_tiet_id',
  authorizeRoles(...WRITE_ROLES),
  validate(thanhLyValidation.phieuAndChiTietIdParam),
  validate(thanhLyValidation.updateChiTietThanhLy),
  thanhLyController.updateChiTietThanhLy,
);

router.delete(
  '/phieu-thanh-ly/:id/chi-tiet/:chi_tiet_id',
  authorizeRoles(...WRITE_ROLES),
  validate(thanhLyValidation.phieuAndChiTietIdParam),
  thanhLyController.deleteChiTietThanhLy,
);

router.get(
  '/phieu-thanh-ly/:id/lich-su',
  authorizeRoles(...READ_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.getPhieuThanhLyHistoryQuery),
  thanhLyController.getPhieuThanhLyHistory,
);

router.get(
  '/phieu-thanh-ly/:id',
  authorizeRoles(...READ_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  thanhLyController.getPhieuThanhLyDetail,
);

router.patch(
  '/phieu-thanh-ly/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.updatePhieuThanhLy),
  thanhLyController.updatePhieuThanhLy,
);

router.patch(
  '/phieu-thanh-ly/:id/gui-duyet',
  authorizeRoles(...WRITE_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.guiDuyetPhieuThanhLy),
  thanhLyController.guiDuyetPhieuThanhLy,
);

router.patch(
  '/phieu-thanh-ly/:id/duyet',
  authorizeRoles(...APPROVE_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.duyetPhieuThanhLy),
  thanhLyController.duyetPhieuThanhLy,
);

router.patch(
  '/phieu-thanh-ly/:id/tu-choi',
  authorizeRoles(...APPROVE_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.tuChoiPhieuThanhLy),
  thanhLyController.tuChoiPhieuThanhLy,
);

router.patch(
  '/phieu-thanh-ly/:id/hoan-tat',
  authorizeRoles(...COMPLETE_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.hoanTatPhieuThanhLy),
  thanhLyController.hoanTatPhieuThanhLy,
);

router.patch(
  '/phieu-thanh-ly/:id/huy',
  authorizeRoles(...CANCEL_ROLES),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.huyPhieuThanhLy),
  thanhLyController.huyPhieuThanhLy,
);

router.patch(
  '/phieu-thanh-ly/:id/trang-thai',
  authorizeRoles('ADMIN', 'NHAN_VIEN_THIET_BI', 'NGUOI_DUYET'),
  validate(thanhLyValidation.phieuThanhLyIdParam),
  validate(thanhLyValidation.chuyenTrangThaiPhieuThanhLy),
  thanhLyController.chuyenTrangThaiPhieuThanhLy,
);

module.exports = router;

