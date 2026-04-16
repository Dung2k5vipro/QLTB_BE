const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const authValidation = require('../validations/auth.validation');

const router = express.Router();

router.post('/bootstrap-admin', validate(authValidation.bootstrapAdmin), authController.bootstrapAdmin);
router.post('/login', validate(authValidation.login), authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.post('/logout', authMiddleware, authController.logout);
router.patch('/change-password', authMiddleware, validate(authValidation.changePassword), authController.changePassword);

module.exports = router;
