const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const baoTriController = require('../controllers/baoTri.controller');
const baoTriValidation = require('../validations/baoTri.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN'];
const WRITE_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI'];

router.use(authMiddleware);

router.post(
  '/tiep-nhan',
  authorizeRoles(...WRITE_ROLES),
  validate(baoTriValidation.tiepNhanBaoTriThuCong),
  baoTriController.tiepNhanBaoTriThuCong,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(baoTriValidation.createNhatKyBaoTri),
  baoTriController.createNhatKyBaoTri,
);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(baoTriValidation.getNhatKyBaoTriListQuery),
  baoTriController.getNhatKyBaoTriList,
);

router.get(
  '/thiet-bi/:thietBiId',
  authorizeRoles(...READ_ROLES),
  validate(baoTriValidation.thietBiIdParam),
  validate(baoTriValidation.getLichSuTheoThietBiQuery),
  baoTriController.getLichSuBaoTriTheoThietBi,
);

router.get(
  '/phieu-bao-hong/:phieuBaoHongId',
  authorizeRoles(...READ_ROLES),
  validate(baoTriValidation.phieuBaoHongIdParam),
  validate(baoTriValidation.getDanhSachTheoPhieuBaoHongQuery),
  baoTriController.getDanhSachBaoTriTheoPhieuBaoHong,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(baoTriValidation.nhatKyBaoTriIdParam),
  baoTriController.getNhatKyBaoTriDetail,
);

router.put(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(baoTriValidation.nhatKyBaoTriIdParam),
  validate(baoTriValidation.updateNhatKyBaoTri),
  baoTriController.updateNhatKyBaoTri,
);

router.patch(
  '/:id/hoan-thanh',
  authorizeRoles(...WRITE_ROLES),
  validate(baoTriValidation.nhatKyBaoTriIdParam),
  validate(baoTriValidation.completeNhatKyBaoTri),
  baoTriController.completeNhatKyBaoTri,
);

module.exports = router;
