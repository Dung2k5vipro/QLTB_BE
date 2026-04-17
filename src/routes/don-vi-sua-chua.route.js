const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const donViSuaChuaController = require('../controllers/donViSuaChua.controller');
const donViSuaChuaValidation = require('../validations/donViSuaChua.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(donViSuaChuaValidation.getDonViSuaChuaQuery),
  donViSuaChuaController.getDonViSuaChua,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(donViSuaChuaValidation.donViSuaChuaIdParam),
  donViSuaChuaController.getDonViSuaChuaById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(donViSuaChuaValidation.createDonViSuaChua),
  donViSuaChuaController.createDonViSuaChua,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(donViSuaChuaValidation.donViSuaChuaIdParam),
  validate(donViSuaChuaValidation.updateDonViSuaChua),
  donViSuaChuaController.updateDonViSuaChua,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(donViSuaChuaValidation.donViSuaChuaIdParam),
  validate(donViSuaChuaValidation.updateDonViSuaChuaStatus),
  donViSuaChuaController.updateDonViSuaChuaStatus,
);

module.exports = router;


