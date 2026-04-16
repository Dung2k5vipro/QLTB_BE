const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  return res.status(200).json({
    success: true,
    module: 'dashboard',
    message: 'Dashboard route is ready',
  });
});

module.exports = router;
