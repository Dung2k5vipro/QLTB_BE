const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const donViController = require('../controllers/donVi.controller');
const donViValidation = require('../validations/donVi.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(donViValidation.getDonViQuery),
  donViController.getDonVi,
);

router.get(
  '/options',
  authorizeRoles(...READ_ROLES),
  validate(donViValidation.getDonViOptionsQuery),
  donViController.getOptions,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(donViValidation.donViIdParam),
  donViController.getDonViById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(donViValidation.createDonVi),
  donViController.createDonVi,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(donViValidation.donViIdParam),
  validate(donViValidation.updateDonVi),
  donViController.updateDonVi,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(donViValidation.donViIdParam),
  validate(donViValidation.updateDonViStatus),
  donViController.updateDonViStatus,
);

module.exports = router;


