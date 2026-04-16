const {
  requireObject,
  assertOnlyAllowedKeys,
  ensureAtLeastOneField,
  toNonEmptyString,
  toNullableString,
  parseCommonListQuery,
  buildIdParamValidator,
  buildStatusBodyValidator,
} = require('./common.validation');

const ALLOWED_SORT_FIELDS = ['ly_do_thanh_ly_id', 'ma_ly_do', 'ten_ly_do'];
const ALLOWED_CREATE_FIELDS = ['ma_ly_do', 'ten_ly_do', 'mo_ta'];
const ALLOWED_UPDATE_FIELDS = [...ALLOWED_CREATE_FIELDS];

const lyDoThanhLyIdParam = buildIdParamValidator('id');

const getLyDoThanhLyQuery = {
  query: (query) => {
    return parseCommonListQuery(query, {
      allowedSortFields: ALLOWED_SORT_FIELDS,
      defaultSortBy: 'ly_do_thanh_ly_id',
    });
  },
};

const createLyDoThanhLy = {
  body: (body) => {
    requireObject(body, 'Body khong hop le');
    assertOnlyAllowedKeys(body, ALLOWED_CREATE_FIELDS);

    return {
      ma_ly_do: toNonEmptyString(body.ma_ly_do, 'ma_ly_do', 50, { toUpperCase: true }),
      ten_ly_do: toNonEmptyString(body.ten_ly_do, 'ten_ly_do', 150),
      mo_ta: toNullableString(body.mo_ta, 'mo_ta', 255),
      is_active: 1,
    };
  },
};

const updateLyDoThanhLy = {
  body: (body) => {
    requireObject(body, 'Body khong hop le');
    assertOnlyAllowedKeys(body, ALLOWED_UPDATE_FIELDS);
    ensureAtLeastOneField(body, ALLOWED_UPDATE_FIELDS, 'Can it nhat 1 truong de cap nhat');

    const payload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'ma_ly_do')) {
      payload.ma_ly_do = toNonEmptyString(body.ma_ly_do, 'ma_ly_do', 50, { toUpperCase: true });
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ten_ly_do')) {
      payload.ten_ly_do = toNonEmptyString(body.ten_ly_do, 'ten_ly_do', 150);
    }
    if (Object.prototype.hasOwnProperty.call(body, 'mo_ta')) {
      payload.mo_ta = toNullableString(body.mo_ta, 'mo_ta', 255);
    }

    return payload;
  },
};

const updateLyDoThanhLyStatus = buildStatusBodyValidator();

module.exports = {
  lyDoThanhLyIdParam,
  getLyDoThanhLyQuery,
  createLyDoThanhLy,
  updateLyDoThanhLy,
  updateLyDoThanhLyStatus,
};
