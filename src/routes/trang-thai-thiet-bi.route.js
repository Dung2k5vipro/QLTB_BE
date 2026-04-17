const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const trangThaiThietBiController = require('../controllers/trangThaiThietBi.controller');
const trangThaiThietBiValidation = require('../validations/trangThaiThietBi.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(trangThaiThietBiValidation.getTrangThaiThietBiQuery),
  trangThaiThietBiController.getTrangThaiThietBi,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(trangThaiThietBiValidation.trangThaiThietBiIdParam),
  trangThaiThietBiController.getTrangThaiThietBiById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(trangThaiThietBiValidation.createTrangThaiThietBi),
  trangThaiThietBiController.createTrangThaiThietBi,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(trangThaiThietBiValidation.trangThaiThietBiIdParam),
  validate(trangThaiThietBiValidation.updateTrangThaiThietBi),
  trangThaiThietBiController.updateTrangThaiThietBi,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(trangThaiThietBiValidation.trangThaiThietBiIdParam),
  validate(trangThaiThietBiValidation.updateTrangThaiThietBiStatus),
  trangThaiThietBiController.updateTrangThaiThietBiStatus,
);

module.exports = router;


