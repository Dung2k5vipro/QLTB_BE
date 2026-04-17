const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const dashboardController = require('../controllers/dashboard.controller');
const dashboardValidation = require('../validations/dashboard.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'NGUOI_DUYET', 'KE_TOAN', 'GIAO_VIEN'];

router.use(authMiddleware);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(dashboardValidation.getTongQuanQuery),
  dashboardController.getTongQuanDashboard,
);

router.get(
  '/tong-quan',
  authorizeRoles(...READ_ROLES),
  validate(dashboardValidation.getTongQuanQuery),
  dashboardController.getTongQuanDashboard,
);

module.exports = router;
