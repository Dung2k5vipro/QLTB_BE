const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const roleService = require('../services/role.service');

const getRoles = asyncHandler(async (req, res) => {
  const result = await roleService.getRoleList(req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách vai trò thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết vai trò thành công',
    data: role,
  });
});

const createRole = asyncHandler(async (req, res) => {
  const createdRole = await roleService.createRole(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Tạo vai trò thành công',
    data: createdRole,
  });
});

const updateRole = asyncHandler(async (req, res) => {
  const updatedRole = await roleService.updateRole(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'Cập nhật vai trò thành công',
    data: updatedRole,
  });
});

const updateRoleStatus = asyncHandler(async (req, res) => {
  const result = await roleService.updateRoleStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.changed ? 'Cập nhật trạng thái vai trò thành công' : 'Trạng thái vai trò không thay đổi',
    data: result.role,
  });
});

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  updateRoleStatus,
};
