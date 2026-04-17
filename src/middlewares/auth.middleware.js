const jwt = require('jsonwebtoken');

const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const jwtConfig = require('../configs/jwt.config');
const userRepository = require('../repositories/user.repository');

const extractBearerToken = (authorizationHeader = '') => {
  if (typeof authorizationHeader !== 'string') return null;
  if (!authorizationHeader.toLowerCase().startsWith('bearer ')) return null;

  const token = authorizationHeader.slice(7).trim();
  return token || null;
};

const authMiddleware = asyncHandler(async (req, _res, next) => {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError('Thiếu token xác thực', 401);
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token đã hết hạn', 401);
    }

    throw new AppError('Token không hợp lệ', 401);
  }

  const nguoiDungId = Number(decodedToken.nguoi_dung_id);
  if (!Number.isInteger(nguoiDungId) || nguoiDungId <= 0) {
    throw new AppError('Token payload không hợp lệ', 401);
  }

  const user = await userRepository.findById(nguoiDungId);
  if (!user) {
    throw new AppError('Người dùng không tồn tại', 401);
  }

  if (String(user.trang_thai_tai_khoan || '').toUpperCase() !== 'ACTIVE') {
    throw new AppError('Tài khoản không còn hiệu lực', 403);
  }

  req.user = user;
  req.token = token;
  req.tokenPayload = decodedToken;
  return next();
});

module.exports = authMiddleware;
