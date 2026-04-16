const express = require('express');
const { pool } = require('../configs/db.config');

const router = express.Router();

router.get('/', (_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

router.get('/db', async (_req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');

    return res.status(200).json({
      success: true,
      message: 'Database connection is healthy',
      data: rows[0],
    });
  } catch (error) {
    error.status = 503;
    error.message = `Database unavailable: ${error.message}`;
    return next(error);
  }
});

module.exports = router;
