const { repairUtf8Mojibake, deepRepairUtf8 } = require('./text');

const sendSuccess = (res, { statusCode = 200, message = 'Thành công', data, meta } = {}) => {
  const payload = {
    success: true,
    message: repairUtf8Mojibake(message),
  };

  if (data !== undefined) {
    payload.data = deepRepairUtf8(data);
  }

  if (meta !== undefined) {
    payload.meta = deepRepairUtf8(meta);
  }

  return res.status(statusCode).json(payload);
};

module.exports = {
  sendSuccess,
};
