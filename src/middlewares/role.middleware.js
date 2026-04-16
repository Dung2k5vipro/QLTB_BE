const AppError = require('../utils/appError');
const { getRequestIp } = require('../utils/request');
const { writeAuditLog } = require('../services/auditLog.service');

const normalizeRole = (roleName) => String(roleName || '').trim().toUpperCase();

const getCurrentRole = (req) => {
  return normalizeRole(req?.user?.ma_vai_tro || req?.user?.ten_vai_tro || req?.user?.vai_tro || req?.user?.role);
};

const writeForbiddenLog = (req, note) => {
  const routePath = req?.originalUrl || req?.url || '';
  writeAuditLog({
    nguoi_dung_id: req?.user?.nguoi_dung_id || null,
    module: 'AUTHZ',
    hanh_dong: 'FORBIDDEN',
    entity_name: 'route',
    entity_id: null,
    ghi_chu: routePath ? `${note} | Route: ${routePath}` : note,
    ip_address: getRequestIp(req),
  });
};

const authorizeRoles = (...roles) => {
  const allowedRoles = roles.map(normalizeRole).filter(Boolean);

  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError('Chưa xác thực', 401);
    }

    const currentRole = getCurrentRole(req);
    if (!currentRole || !allowedRoles.includes(currentRole)) {
      writeForbiddenLog(req, `Role ${currentRole || 'UNKNOWN'} khong duoc truy cap`);
      throw new AppError('Bạn không có quyền truy cập', 403);
    }

    return next();
  };
};

const authorizeSelfOrAdmin = (paramKey = 'id') => {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError('Chưa xác thực', 401);
    }

    const currentRole = getCurrentRole(req);
    if (currentRole === 'ADMIN') {
      return next();
    }

    const selfId = Number(req.user.nguoi_dung_id);
    const targetId = Number(req.params[paramKey]);

    if (Number.isInteger(selfId) && Number.isInteger(targetId) && selfId === targetId) {
      return next();
    }

    writeForbiddenLog(req, `User ${selfId} khong duoc truy cap tai nguyen ${targetId}`);
    throw new AppError('Bạn không có quyền truy cập', 403);
  };
};

module.exports = {
  authorizeRoles,
  authorizeSelfOrAdmin,
};
