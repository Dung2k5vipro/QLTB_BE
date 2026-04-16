const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const nhaCungCapController = require('../controllers/nhaCungCap.controller');
const nhaCungCapValidation = require('../validations/nhaCungCap.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(nhaCungCapValidation.getNhaCungCapQuery),
  nhaCungCapController.getNhaCungCap,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(nhaCungCapValidation.nhaCungCapIdParam),
  nhaCungCapController.getNhaCungCapById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(nhaCungCapValidation.createNhaCungCap),
  nhaCungCapController.createNhaCungCap,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(nhaCungCapValidation.nhaCungCapIdParam),
  validate(nhaCungCapValidation.updateNhaCungCap),
  nhaCungCapController.updateNhaCungCap,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(nhaCungCapValidation.nhaCungCapIdParam),
  validate(nhaCungCapValidation.updateNhaCungCapStatus),
  nhaCungCapController.updateNhaCungCapStatus,
);

module.exports = router;
