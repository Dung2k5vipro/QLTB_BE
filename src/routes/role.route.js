const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const roleController = require('../controllers/role.controller');
const roleValidation = require('../validations/role.validation');

const router = express.Router();
const ADMIN_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...ADMIN_ROLES),
  validate(roleValidation.getRoleQuery),
  roleController.getRoles,
);

router.get(
  '/:id',
  authorizeRoles(...ADMIN_ROLES),
  validate(roleValidation.roleIdParam),
  roleController.getRoleById,
);

router.post(
  '/',
  authorizeRoles(...ADMIN_ROLES),
  validate(roleValidation.createRole),
  roleController.createRole,
);

router.patch(
  '/:id',
  authorizeRoles(...ADMIN_ROLES),
  validate(roleValidation.roleIdParam),
  validate(roleValidation.updateRole),
  roleController.updateRole,
);

router.patch(
  '/:id/status',
  authorizeRoles(...ADMIN_ROLES),
  validate(roleValidation.roleIdParam),
  validate(roleValidation.updateRoleStatus),
  roleController.updateRoleStatus,
);

module.exports = router;


