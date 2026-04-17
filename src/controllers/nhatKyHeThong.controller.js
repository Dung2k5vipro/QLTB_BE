const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const nhatKyHeThongService = require('../services/nhatKyHeThong.service');

const getNhatKyHeThongList = asyncHandler(async (req, res) => {
  const result = await nhatKyHeThongService.getNhatKyHeThongList(req.user, req.query);

  return sendSuccess(res, {
    message: 'Lấy danh sách nhật ký hệ thống thành công',
    data: result.items,
    meta: result.pagination,
  });
});

const getNhatKyHeThongDetail = asyncHandler(async (req, res) => {
  const detail = await nhatKyHeThongService.getNhatKyHeThongDetail(req.user, req.params.id);

  return sendSuccess(res, {
    message: 'Lấy chi tiết nhật ký hệ thống thành công',
    data: detail,
  });
});

module.exports = {
  getNhatKyHeThongList,
  getNhatKyHeThongDetail,
};
