const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const nhatKyHeThongController = require('../controllers/nhatKyHeThong.controller');
const nhatKyHeThongValidation = require('../validations/nhatKyHeThong.validation');

const router = express.Router();
const VIEW_ROLES = ['ADMIN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...VIEW_ROLES),
  validate(nhatKyHeThongValidation.getNhatKyHeThongListQuery),
  nhatKyHeThongController.getNhatKyHeThongList,
);

router.get(
  '/:id',
  authorizeRoles(...VIEW_ROLES),
  validate(nhatKyHeThongValidation.nhatKyHeThongIdParam),
  nhatKyHeThongController.getNhatKyHeThongDetail,
);

module.exports = router;
