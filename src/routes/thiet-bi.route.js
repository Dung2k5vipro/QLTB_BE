const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const thietBiController = require('../controllers/thietBi.controller');
const thietBiValidation = require('../validations/thietBi.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'GIAO_VIEN', 'NGUOI_DUYET', 'KE_TOAN'];
const WRITE_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI'];
const TRANSFER_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI'];

router.use(authMiddleware);

router.post(
  '/',
  authorizeRoles(...WRITE_ROLES),
  validate(thietBiValidation.createDevice),
  thietBiController.createDevice,
);

router.get(
  '/',
  authorizeRoles(...READ_ROLES),
  validate(thietBiValidation.getDevicesQuery),
  thietBiController.getDevices,
);

router.post(
  '/cap-phat',
  authorizeRoles(...TRANSFER_ROLES),
  validate(thietBiValidation.capPhat),
  thietBiController.capPhatThietBi,
);

router.post(
  '/ban-giao',
  authorizeRoles(...TRANSFER_ROLES),
  validate(thietBiValidation.banGiao),
  thietBiController.banGiaoThietBi,
);

router.post(
  '/dieu-chuyen',
  authorizeRoles(...TRANSFER_ROLES),
  validate(thietBiValidation.dieuChuyen),
  thietBiController.dieuChuyenThietBi,
);

router.post(
  '/thu-hoi',
  authorizeRoles(...TRANSFER_ROLES),
  validate(thietBiValidation.thuHoi),
  thietBiController.thuHoiThietBi,
);

router.get(
  '/lich-su',
  authorizeRoles(...TRANSFER_ROLES),
  validate(thietBiValidation.getTransferHistory),
  thietBiController.getTransferHistory,
);

router.get(
  '/:id',
  authorizeRoles(...READ_ROLES),
  validate(thietBiValidation.getDeviceById),
  thietBiController.getDeviceById,
);

router.patch(
  '/:id',
  authorizeRoles(...WRITE_ROLES),
  validate(thietBiValidation.getDeviceById),
  validate(thietBiValidation.updateDevice),
  thietBiController.updateDevice,
);

router.patch(
  '/:id/trang-thai',
  authorizeRoles(...WRITE_ROLES),
  validate(thietBiValidation.getDeviceById),
  validate(thietBiValidation.updateDeviceStatus),
  thietBiController.updateDeviceStatus,
);

router.get(
  '/:id/lich-su-trang-thai',
  authorizeRoles(...READ_ROLES),
  validate(thietBiValidation.getDeviceStatusHistory),
  thietBiController.getDeviceStatusHistory,
);

module.exports = router;
