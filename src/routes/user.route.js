const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const userController = require('../controllers/user.controller');
const userValidation = require('../validations/user.validation');
const { authorizeRoles } = require('../middlewares/role.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', userController.getMyProfile);
router.patch('/me', validate(userValidation.updateMyProfile), userController.updateMyProfile);

router.get('/', authorizeRoles('ADMIN'), validate(userValidation.getUsersQuery), userController.getUsers);
router.post('/', authorizeRoles('ADMIN'), validate(userValidation.createUser), userController.createUser);

router.get('/:id', authorizeRoles('ADMIN'), validate(userValidation.userIdParam), userController.getUserById);
router.patch('/:id', authorizeRoles('ADMIN'), validate(userValidation.userIdParam), validate(userValidation.updateUser), userController.updateUser);
router.patch('/:id/status', authorizeRoles('ADMIN'), validate(userValidation.userIdParam), validate(userValidation.updateUserStatus), userController.updateUserStatus);
router.patch('/:id/reset-password', authorizeRoles('ADMIN'), validate(userValidation.userIdParam), validate(userValidation.resetUserPassword), userController.resetUserPassword);

module.exports = router;


