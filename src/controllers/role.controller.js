const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');
const roleService = require('../services/role.service');

const getRoles = asyncHandler(async (req, res) => {
  const result = await roleService.getRoleList(req.query);

  return sendSuccess(res, {
    message: 'L�y danh s�ch vai tr� th�nh c�ng',
    data: result.items,
    meta: result.pagination,
  });
});

const getRoleById = asyncHandler(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);

  return sendSuccess(res, {
    message: 'L�y chi ti�t vai tr� th�nh c�ng',
    data: role,
  });
});

const createRole = asyncHandler(async (req, res) => {
  const createdRole = await roleService.createRole(req.user, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'T�o vai tr� th�nh c�ng',
    data: createdRole,
  });
});

const updateRole = asyncHandler(async (req, res) => {
  const updatedRole = await roleService.updateRole(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: 'C�p nh�t vai tr� th�nh c�ng',
    data: updatedRole,
  });
});

const updateRoleStatus = asyncHandler(async (req, res) => {
  const result = await roleService.updateRoleStatus(req.user, req.params.id, req.body, {
    ipAddress: getRequestIp(req),
  });

  return sendSuccess(res, {
    message: result.changed ? 'C�p nh�t tr�ng th�i vai tr� th�nh c�ng' : 'Tr�ng th�i vai tr� kh�ng thay �i',
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


