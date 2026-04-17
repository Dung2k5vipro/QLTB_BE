const AppError = require('../utils/appError');
const nhatKyHeThongRepository = require('../repositories/nhatKyHeThong.repository');

const normalizeRole = (user) => {
  return String(
    user?.ma_vai_tro
    || user?.ten_vai_tro
    || user?.vai_tro
    || user?.role
    || '',
  ).trim().toUpperCase();
};

const ensureCanViewSystemLog = (actor) => {
  if (normalizeRole(actor) === 'ADMIN') return;
  throw new AppError('Bạn không có quyền xem nhật ký hệ thống', 403);
};

const parseJsonSafely = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;

  const normalized = value.trim();
  if (!normalized) return null;

  try {
    return JSON.parse(normalized);
  } catch (_error) {
    return value;
  }
};

const normalizeLogRow = (row) => {
  if (!row) return row;

  return {
    ...row,
    du_lieu_cu: parseJsonSafely(row.du_lieu_cu),
    du_lieu_moi: parseJsonSafely(row.du_lieu_moi),
  };
};

const getNhatKyHeThongList = async (actor, query) => {
  ensureCanViewSystemLog(actor);

  const [items, totalItems] = await Promise.all([
    nhatKyHeThongRepository.findNhatKyHeThong(query),
    nhatKyHeThongRepository.countNhatKyHeThong(query),
  ]);

  return {
    items: items.map(normalizeLogRow),
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit) || 1,
    },
  };
};

const getNhatKyHeThongDetail = async (actor, nhatKyId) => {
  ensureCanViewSystemLog(actor);

  const log = await nhatKyHeThongRepository.findNhatKyHeThongById(nhatKyId);
  if (!log) {
    throw new AppError('Không tìm thấy nhật ký hệ thống', 404);
  }

  return normalizeLogRow(log);
};

module.exports = {
  getNhatKyHeThongList,
  getNhatKyHeThongDetail,
};
