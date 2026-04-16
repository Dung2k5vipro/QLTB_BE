const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const roleService = require('../services/role.service');

const getRoles = asyncHandler(async (_req, res) => {
  const roles = await roleService.getRoles();

  return sendSuccess(res, {
    message: 'Lay danh sach vai tro thanh cong',
    data: roles,
  });
});

module.exports = {
  getRoles,
};
