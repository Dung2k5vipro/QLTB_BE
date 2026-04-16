const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const hangSanXuatController = require('../controllers/hangSanXuat.controller');
const hangSanXuatValidation = require('../validations/hangSanXuat.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(hangSanXuatValidation.getHangSanXuatQuery),
  hangSanXuatController.getHangSanXuat,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(hangSanXuatValidation.hangSanXuatIdParam),
  hangSanXuatController.getHangSanXuatById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(hangSanXuatValidation.createHangSanXuat),
  hangSanXuatController.createHangSanXuat,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(hangSanXuatValidation.hangSanXuatIdParam),
  validate(hangSanXuatValidation.updateHangSanXuat),
  hangSanXuatController.updateHangSanXuat,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(hangSanXuatValidation.hangSanXuatIdParam),
  validate(hangSanXuatValidation.updateHangSanXuatStatus),
  hangSanXuatController.updateHangSanXuatStatus,
);

module.exports = router;
