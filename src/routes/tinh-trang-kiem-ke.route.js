const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const tinhTrangKiemKeController = require('../controllers/tinhTrangKiemKe.controller');
const tinhTrangKiemKeValidation = require('../validations/tinhTrangKiemKe.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(tinhTrangKiemKeValidation.getTinhTrangKiemKeQuery),
  tinhTrangKiemKeController.getTinhTrangKiemKe,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(tinhTrangKiemKeValidation.tinhTrangKiemKeIdParam),
  tinhTrangKiemKeController.getTinhTrangKiemKeById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(tinhTrangKiemKeValidation.createTinhTrangKiemKe),
  tinhTrangKiemKeController.createTinhTrangKiemKe,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(tinhTrangKiemKeValidation.tinhTrangKiemKeIdParam),
  validate(tinhTrangKiemKeValidation.updateTinhTrangKiemKe),
  tinhTrangKiemKeController.updateTinhTrangKiemKe,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(tinhTrangKiemKeValidation.tinhTrangKiemKeIdParam),
  validate(tinhTrangKiemKeValidation.updateTinhTrangKiemKeStatus),
  tinhTrangKiemKeController.updateTinhTrangKiemKeStatus,
);

module.exports = router;


