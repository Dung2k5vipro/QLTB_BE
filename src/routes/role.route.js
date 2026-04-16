const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const roleController = require('../controllers/role.controller');

const router = express.Router();

router.get('/', authMiddleware, roleController.getRoles);

module.exports = router;
