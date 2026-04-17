const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getRequestIp } = require('../utils/request');

const createMasterDataController = ({
  service,
  messages,
}) => {
  const getList = asyncHandler(async (req, res) => {
    const result = await service.getList(req.query);

    return sendSuccess(res, {
      message: messages.list,
      data: result.items,
      meta: result.pagination,
    });
  });

  const getDetail = asyncHandler(async (req, res) => {
    const item = await service.getDetail(req.params.id);

    return sendSuccess(res, {
      message: messages.detail,
      data: item,
    });
  });

  const create = asyncHandler(async (req, res) => {
    const item = await service.create(req.user, req.body, {
      ipAddress: getRequestIp(req),
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: messages.create,
      data: item,
    });
  });

  const update = asyncHandler(async (req, res) => {
    const item = await service.update(req.user, req.params.id, req.body, {
      ipAddress: getRequestIp(req),
    });

    return sendSuccess(res, {
      message: messages.update,
      data: item,
    });
  });

  const updateStatus = asyncHandler(async (req, res) => {
    const result = await service.updateStatus(req.user, req.params.id, req.body, {
      ipAddress: getRequestIp(req),
    });

    return sendSuccess(res, {
      message: result.changed ? messages.updateStatus : messages.statusUnchanged,
      data: result.item,
    });
  });

  return {
    getList,
    getDetail,
    create,
    update,
    updateStatus,
  };
};

module.exports = {
  createMasterDataController,
};

