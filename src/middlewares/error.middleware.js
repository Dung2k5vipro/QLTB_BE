const { repairUtf8Mojibake, deepRepairUtf8 } = require('../utils/text');

const errorMiddleware = (err, _req, res, _next) => {
  const statusCode = Number(err?.status || err?.statusCode) || 500;
  const message = repairUtf8Mojibake(err?.message || 'Lỗi máy chủ nội bộ');

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    details: deepRepairUtf8(err?.details) || undefined,
  });
};

module.exports = errorMiddleware;
