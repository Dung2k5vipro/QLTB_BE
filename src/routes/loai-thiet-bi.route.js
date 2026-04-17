const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const loaiThietBiController = require('../controllers/loaiThietBi.controller');
const loaiThietBiValidation = require('../validations/loaiThietBi.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(loaiThietBiValidation.getLoaiThietBiQuery),
  loaiThietBiController.getLoaiThietBi,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(loaiThietBiValidation.loaiThietBiIdParam),
  loaiThietBiController.getLoaiThietBiById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(loaiThietBiValidation.createLoaiThietBi),
  loaiThietBiController.createLoaiThietBi,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(loaiThietBiValidation.loaiThietBiIdParam),
  validate(loaiThietBiValidation.updateLoaiThietBi),
  loaiThietBiController.updateLoaiThietBi,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(loaiThietBiValidation.loaiThietBiIdParam),
  validate(loaiThietBiValidation.updateLoaiThietBiStatus),
  loaiThietBiController.updateLoaiThietBiStatus,
);

module.exports = router;


