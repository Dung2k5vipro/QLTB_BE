const { repairUtf8Mojibake } = require('./text');

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(repairUtf8Mojibake(message || 'Lỗi máy chủ nội bộ'));
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = AppError;
