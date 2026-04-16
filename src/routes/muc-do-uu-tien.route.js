const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const mucDoUuTienController = require('../controllers/mucDoUuTien.controller');
const mucDoUuTienValidation = require('../validations/mucDoUuTien.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(mucDoUuTienValidation.getMucDoUuTienQuery),
  mucDoUuTienController.getMucDoUuTien,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(mucDoUuTienValidation.mucDoUuTienIdParam),
  mucDoUuTienController.getMucDoUuTienById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(mucDoUuTienValidation.createMucDoUuTien),
  mucDoUuTienController.createMucDoUuTien,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(mucDoUuTienValidation.mucDoUuTienIdParam),
  validate(mucDoUuTienValidation.updateMucDoUuTien),
  mucDoUuTienController.updateMucDoUuTien,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(mucDoUuTienValidation.mucDoUuTienIdParam),
  validate(mucDoUuTienValidation.updateMucDoUuTienStatus),
  mucDoUuTienController.updateMucDoUuTienStatus,
);

module.exports = router;
