const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const baoHongController = require('../controllers/baoHong.controller');
const baoHongValidation = require('../validations/baoHong.validation');

const router = express.Router();

const PHIEU_READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN'];
const PHIEU_WRITE_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN'];
const PROCESS_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI'];

router.use(authMiddleware);

router.post(
  '/phieu-bao-hong',
  authorizeRoles(...PHIEU_WRITE_ROLES),
  validate(baoHongValidation.createPhieuBaoHong),
  baoHongController.createPhieuBaoHong,
);

router.get(
  '/phieu-bao-hong',
  authorizeRoles(...PHIEU_READ_ROLES),
  validate(baoHongValidation.getPhieuBaoHongList),
  baoHongController.getPhieuBaoHongList,
);

router.get(
  '/phieu-bao-hong/:id',
  authorizeRoles(...PHIEU_READ_ROLES),
  validate(baoHongValidation.phieuBaoHongIdParam),
  baoHongController.getPhieuBaoHongDetail,
);

router.patch(
  '/phieu-bao-hong/:id/tiep-nhan',
  authorizeRoles(...PROCESS_ROLES),
  validate(baoHongValidation.phieuBaoHongIdParam),
  validate(baoHongValidation.tiepNhanPhieuBaoHong),
  baoHongController.tiepNhanPhieuBaoHong,
);

router.patch(
  '/phieu-bao-hong/:id/cap-nhat-xu-ly',
  authorizeRoles(...PROCESS_ROLES),
  validate(baoHongValidation.phieuBaoHongIdParam),
  validate(baoHongValidation.capNhatXuLyPhieuBaoHong),
  baoHongController.capNhatXuLyPhieuBaoHong,
);

router.patch(
  '/phieu-bao-hong/:id/hoan-thanh',
  authorizeRoles(...PROCESS_ROLES),
  validate(baoHongValidation.phieuBaoHongIdParam),
  validate(baoHongValidation.hoanThanhPhieuBaoHong),
  baoHongController.hoanThanhPhieuBaoHong,
);

router.patch(
  '/phieu-bao-hong/:id/tu-choi',
  authorizeRoles(...PROCESS_ROLES),
  validate(baoHongValidation.phieuBaoHongIdParam),
  validate(baoHongValidation.tuChoiPhieuBaoHong),
  baoHongController.tuChoiPhieuBaoHong,
);

router.patch(
  '/phieu-bao-hong/:id/huy',
  authorizeRoles(...PROCESS_ROLES),
  validate(baoHongValidation.phieuBaoHongIdParam),
  validate(baoHongValidation.huyPhieuBaoHong),
  baoHongController.huyPhieuBaoHong,
);

router.get(
  '/nhat-ky-bao-tri',
  authorizeRoles(...PROCESS_ROLES),
  validate(baoHongValidation.getNhatKyBaoTriList),
  baoHongController.getNhatKyBaoTriList,
);

module.exports = router;
