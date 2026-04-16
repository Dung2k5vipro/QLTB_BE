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
    throw new AppError('Thieu token xac thuc', 401);
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm],
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token da het han', 401);
    }

    throw new AppError('Token khong hop le', 401);
  }

  const nguoiDungId = Number(decodedToken.nguoi_dung_id);
  if (!Number.isInteger(nguoiDungId) || nguoiDungId <= 0) {
    throw new AppError('Token payload khong hop le', 401);
  }

  const user = await userRepository.findById(nguoiDungId);
  if (!user) {
    throw new AppError('Nguoi dung khong ton tai', 401);
  }

  if (String(user.trang_thai_tai_khoan || '').toUpperCase() !== 'ACTIVE') {
    throw new AppError('Tai khoan khong con hieu luc', 403);
  }

  req.user = user;
  req.token = token;
  req.tokenPayload = decodedToken;
  return next();
});

module.exports = authMiddleware;
