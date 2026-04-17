const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const lyDoThanhLyController = require('../controllers/lyDoThanhLy.controller');
const lyDoThanhLyValidation = require('../validations/lyDoThanhLy.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(lyDoThanhLyValidation.getLyDoThanhLyQuery),
  lyDoThanhLyController.getLyDoThanhLy,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(lyDoThanhLyValidation.lyDoThanhLyIdParam),
  lyDoThanhLyController.getLyDoThanhLyById,
);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(lyDoThanhLyValidation.createLyDoThanhLy),
  lyDoThanhLyController.createLyDoThanhLy,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(lyDoThanhLyValidation.lyDoThanhLyIdParam),
  validate(lyDoThanhLyValidation.updateLyDoThanhLy),
  lyDoThanhLyController.updateLyDoThanhLy,
);

router.patch(
  '/:id/status',
  authorizeRoles(...WRITE_ROLES),
  validate(lyDoThanhLyValidation.lyDoThanhLyIdParam),
  validate(lyDoThanhLyValidation.updateLyDoThanhLyStatus),
  lyDoThanhLyController.updateLyDoThanhLyStatus,
);

module.exports = router;


