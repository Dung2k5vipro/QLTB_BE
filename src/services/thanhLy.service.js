const AppError = require('../utils/appError');
const { writeAuditLog } = require('./auditLog.service');
const thanhLyRepository = require('../repositories/thanhLy.repository');

const MODULE_NAME = 'THANH_LY';
const ENTITY_NAME = 'phieu_thanh_ly';
const MAX_CREATE_CODE_RETRIES = 5;

const PHIEU_TRANG_THAI = {
  NHAP: 'NHAP',
  CHO_DUYET: 'CHO_DUYET',
  DA_DUYET: 'DA_DUYET',
  TU_CHOI: 'TU_CHOI',
  HOAN_TAT: 'HOAN_TAT',
  HUY: 'HUY',
};

const OPEN_BAO_HONG_STATUSES = ['CHO_XU_LY', 'DA_TIEP_NHAN', 'DANG_XU_LY', 'CHO_LINH_KIEN'];
const OPEN_KIEM_KE_STATUSES = ['NHAP', 'DANG_KIEM_KE', 'CHO_XAC_NHAN'];
const OPEN_THANH_LY_STATUSES = ['NHAP', 'CHO_DUYET', 'DA_DUYET'];

const hasOwn = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined;
};

const normalizeRole = (user) => {
  return String(
    user?.ma_vai_tro
    || user?.ten_vai_tro
    || user?.vai_tro
    || user?.role
    || '',
  ).trim().toUpperCase();
};

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
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

const isDisposedStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('THANHLY') || name.includes('THANHLY');
};

const isMysqlDuplicateKeyError = (error) => {
  return Number(error?.errno) === 1062 || String(error?.code || '').toUpperCase() === 'ER_DUP_ENTRY';
};

const isMaPhieuDuplicateError = (error) => {
  const message = String(error?.sqlMessage || error?.message || '').toLowerCase();
  return message.includes('ma_phieu');
};

const isChiTietDuplicateError = (error) => {
  const message = String(error?.sqlMessage || error?.message || '').toLowerCase();
  return message.includes('uq_cttl_phieu_tb') || message.includes('phieu_thanh_ly_id');
};

const mapDuplicateDatabaseError = (error) => {
  if (!isMysqlDuplicateKeyError(error)) return error;

  if (isMaPhieuDuplicateError(error)) {
    return new AppError('Mã phiếu thanh lý bị trùng, vui lòng thử lại', 409);
  }
  if (isChiTietDuplicateError(error)) {
    return new AppError('Thiết bị đã tđn tại trong cùng phiếu thanh lý', 409);
  }

  return new AppError('Dữ liệu bị trùng với bản ghi khác', 409);
};

const generateMaPhieuThanhLy = () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const timePart = [
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
    String(now.getMilliseconds()).padStart(3, '0'),
  ].join('');
  const randomPart = String(Math.floor(100 + Math.random() * 900));

  return `PTL-${datePart}-${timePart}${randomPart}`;
};

const appendCancelReasonToNote = ({ currentNote, reason, extraNote }) => {
  const parts = [];

  if (currentNote && String(currentNote).trim()) parts.push(String(currentNote).trim());
  if (reason && String(reason).trim()) parts.push(`Lý do hủy: ${String(reason).trim()}`);
  if (extraNote && String(extraNote).trim()) parts.push(String(extraNote).trim());

  return parts.length ? parts.join('\n') : null;
};

const buildChiTietSummary = (chiTietList = []) => {
  const tongThietBi = Number(chiTietList.length || 0);
  const tongChiPhi = chiTietList.reduce((acc, item) => {
    return acc + Number(item?.chi_phi_sua_chua_da_phat_sinh || 0);
  }, 0);
  const tongThuHoi = chiTietList.reduce((acc, item) => {
    return acc + Number(item?.gia_tri_thu_hoi_du_kien || 0);
  }, 0);

  return {
    tong_thiet_bi: tongThietBi,
    tong_chi_phi_sua_chua_da_phat_sinh: tongChiPhi,
    tong_gia_tri_thu_hoi_du_kien: tongThuHoi,
  };
};

const ensurePhieuExists = async (phieuThanhLyId, options = {}) => {
  const phieu = await thanhLyRepository.findPhieuThanhLyById(phieuThanhLyId, options);
  if (!phieu) {
    throw new AppError('Không tìm thấy phiếu thanh lý', 404);
  }
  return phieu;
};

const ensureLyDoThanhLyExists = async (lyDoThanhLyId, options = {}) => {
  const lyDo = await thanhLyRepository.findLyDoThanhLyById(lyDoThanhLyId, options);
  if (!lyDo) {
    throw new AppError('ly_do_thanh_ly_id không hợp lệ!', 400);
  }
  if (Number(lyDo.is_active) !== 1) {
    throw new AppError('Lý do thanh lý đang không hoạt đđ"ng', 400);
  }
  return lyDo;
};

const ensureDeviceExists = async (thietBiId, options = {}) => {
  const device = await thanhLyRepository.findDeviceById(thietBiId, options);
  if (!device) {
    throw new AppError('Không tìm thấy thiết bị', 404);
  }
  return device;
};

const ensureApprovePermission = (actor) => {
  const role = normalizeRole(actor);
  if (role === 'ADMIN' || role === 'NGUOI_DUYET') return;
  throw new AppError('Bạn không có quyền duyệt phiếu thanh lý', 403);
};

const ensureCompletePermission = (actor) => {
  const role = normalizeRole(actor);
  if (role === 'ADMIN' || role === 'NGUOI_DUYET') return;
  throw new AppError('Bạn không có quyền hoàn tất phiếu thanh lý', 403);
};

const ensureCancelPermission = (actor, phieu) => {
  const role = normalizeRole(actor);
  if (role === 'ADMIN' || role === 'NGUOI_DUYET') return;

  if (role === 'NHAN_VIEN_THIET_BI') {
    if (Number(phieu.nguoi_tao_id) === Number(actor?.nguoi_dung_id)) return;
    throw new AppError('Bạn chđ0 được hủy phiếu do chính bạn tạo', 403);
  }

  throw new AppError('Bạn không có quyền hủy phiếu thanh lý', 403);
};

const ensureTransitionAllowed = (currentStatus, targetStatus) => {
  const allowedTransitions = {
    [PHIEU_TRANG_THAI.NHAP]: [PHIEU_TRANG_THAI.CHO_DUYET, PHIEU_TRANG_THAI.HUY],
    [PHIEU_TRANG_THAI.CHO_DUYET]: [PHIEU_TRANG_THAI.DA_DUYET, PHIEU_TRANG_THAI.TU_CHOI, PHIEU_TRANG_THAI.HUY],
    [PHIEU_TRANG_THAI.DA_DUYET]: [PHIEU_TRANG_THAI.HOAN_TAT],
    [PHIEU_TRANG_THAI.TU_CHOI]: [],
    [PHIEU_TRANG_THAI.HOAN_TAT]: [],
    [PHIEU_TRANG_THAI.HUY]: [],
  };

  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new AppError(`Không thỒ chuyỒn trạng thái từ ${currentStatus} sang ${targetStatus}`, 400);
  }
};

const ensurePhieuNotClosed = (phieu) => {
  if (phieu.trang_thai === PHIEU_TRANG_THAI.HOAN_TAT || phieu.trang_thai === PHIEU_TRANG_THAI.HUY) {
    throw new AppError('Phiếu đã hoàn tất hoặc đã hủy, không thỒ thao tác', 400);
  }
};

const ensureEditablePhieu = (phieu) => {
  ensurePhieuNotClosed(phieu);
  if (phieu.trang_thai !== PHIEU_TRANG_THAI.NHAP) {
    throw new AppError('Chđ0 được cập nhật phiếu khi trạng thái là NHAP', 400);
  }
};

const ensureEditableChiTiet = (phieu) => {
  ensurePhieuNotClosed(phieu);
  if (phieu.trang_thai !== PHIEU_TRANG_THAI.NHAP) {
    throw new AppError('Chđ0 được cập nhật chi tiết khi phiếu đx trạng thái NHAP', 400);
  }
};

const ensureDeviceNotDisposed = (device) => {
  if (isDisposedStatus(device)) {
    throw new AppError('Thiết bị đã thanh lý, không thỒ thêm vào phiếu thanh lý', 400);
  }
};

const ensureDeviceNotBusy = async (thietBiId, { connection, excludePhieuThanhLyId = null } = {}) => {
  const openBaoHong = await thanhLyRepository.findOpenBaoHongByDeviceId(thietBiId, {
    connection,
    openStatuses: OPEN_BAO_HONG_STATUSES,
  });
  if (openBaoHong) {
    throw new AppError(`Thiết bị đang có phiếu báo hỏng dđx dang (${openBaoHong.ma_phieu})`, 400);
  }

  const openKiemKe = await thanhLyRepository.findOpenKiemKeByDeviceId(thietBiId, {
    connection,
    openStatuses: OPEN_KIEM_KE_STATUSES,
  });
  if (openKiemKe) {
    throw new AppError(`Thiết bị đang có phiếu kiểm kê dđx dang (${openKiemKe.ma_phieu})`, 400);
  }

  const openThanhLy = await thanhLyRepository.findOpenThanhLyByDeviceId(thietBiId, {
    connection,
    excludePhieuThanhLyId,
    openStatuses: OPEN_THANH_LY_STATUSES,
  });
  if (openThanhLy) {
    throw new AppError(`Thiết bị đang có phiếu thanh lý dđx dang (${openThanhLy.ma_phieu})`, 400);
  }
};

const ensureChiTietDevicesNotDuplicate = (items) => {
  const seen = new Set();
  for (const item of items) {
    const deviceId = Number(item.thiet_bi_id);
    if (seen.has(deviceId)) {
      throw new AppError('Không được trùng thiết bị trong cùng phiếu thanh lý', 400);
    }
    seen.add(deviceId);
  }
};

const validateChiTietItems = async (items, { connection, excludePhieuThanhLyId = null } = {}) => {
  for (const item of items) {
    await ensureLyDoThanhLyExists(item.ly_do_thanh_ly_id, { connection });
    const device = await ensureDeviceExists(item.thiet_bi_id, { connection, forUpdate: true });
    ensureDeviceNotDisposed(device);
    await ensureDeviceNotBusy(item.thiet_bi_id, { connection, excludePhieuThanhLyId });
  }
};

const resolveDisposedStatus = async (connection) => {
  const statuses = await thanhLyRepository.findTrangThaiThietBiList({
    connection,
    activeOnly: true,
  });

  const disposed = statuses.find(isDisposedStatus);
  if (!disposed) {
    throw new AppError('Không tìm thấy trạng thái thiết bị "Đã thanh lý"', 500);
  }

  return disposed;
};

const createPhieuThanhLy = async (actor, payload, context = {}) => {
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const now = new Date();
    let createdPhieuId = null;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_CREATE_CODE_RETRIES; attempt += 1) {
      try {
        createdPhieuId = await thanhLyRepository.createPhieuThanhLy({
          ma_phieu: generateMaPhieuThanhLy(),
          nguoi_tao_id: actor.nguoi_dung_id,
          ngay_de_xuat: payload.ngay_de_xuat || now,
          trang_thai: PHIEU_TRANG_THAI.NHAP,
          ghi_chu: payload.ghi_chu ?? null,
        }, { connection });
        break;
      } catch (error) {
        if (isMysqlDuplicateKeyError(error) && isMaPhieuDuplicateError(error)) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    if (!createdPhieuId) {
      throw lastError || new AppError('Không thỒ sinh mã phiếu thanh lý, vui lòng thử lại', 500);
    }

    if (payload.chi_tiet && payload.chi_tiet.length) {
      ensureChiTietDevicesNotDuplicate(payload.chi_tiet);
      await validateChiTietItems(payload.chi_tiet, {
        connection,
        excludePhieuThanhLyId: createdPhieuId,
      });

      const rows = payload.chi_tiet.map((item) => ({
        phieu_thanh_ly_id: createdPhieuId,
        thiet_bi_id: item.thiet_bi_id,
        ly_do_thanh_ly_id: item.ly_do_thanh_ly_id,
        tinh_trang_hien_tai: item.tinh_trang_hien_tai ?? null,
        chi_phi_sua_chua_da_phat_sinh: item.chi_phi_sua_chua_da_phat_sinh ?? 0,
        gia_tri_thu_hoi_du_kien: item.gia_tri_thu_hoi_du_kien ?? 0,
        ghi_chu: item.ghi_chu ?? null,
      }));
      await thanhLyRepository.createChiTietThanhLyBatch(rows, { connection });
    }

    const createdPhieu = await ensurePhieuExists(createdPhieuId, { connection });
    const chiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(createdPhieuId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'CREATE_PHIEU_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: createdPhieuId,
      du_lieu_moi: {
        ...createdPhieu,
        thong_ke: buildChiTietSummary(chiTiet),
      },
      ghi_chu: `Tạo phiếu thanh lý ${createdPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      ...createdPhieu,
      chi_tiet: chiTiet,
      thong_ke: buildChiTietSummary(chiTiet),
    };
  } catch (error) {
    await connection.rollback();
    throw mapDuplicateDatabaseError(error);
  } finally {
    connection.release();
  }
};

const getPhieuThanhLyList = async (query) => {
  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    thanhLyRepository.findPhieuThanhLyList(normalizedQuery),
    thanhLyRepository.countPhieuThanhLy(normalizedQuery),
  ]);

  return {
    items,
    pagination: {
      page: normalizedQuery.page,
      limit: normalizedQuery.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / normalizedQuery.limit) || 1,
    },
  };
};

const getPhieuThanhLyDetail = async (phieuThanhLyId) => {
  const phieu = await ensurePhieuExists(phieuThanhLyId);
  const chiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(phieuThanhLyId);

  return {
    ...phieu,
    chi_tiet: chiTiet,
    thong_ke: buildChiTietSummary(chiTiet),
  };
};

const updatePhieuThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    ensureEditablePhieu(currentPhieu);

    await thanhLyRepository.updatePhieuThanhLyById(phieuThanhLyId, payload, { connection });

    const updatedPhieu = await ensurePhieuExists(phieuThanhLyId, { connection });
    const chiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(phieuThanhLyId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'UPDATE_PHIEU_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: phieuThanhLyId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: updatedPhieu,
      ghi_chu: `Cập nhật phiếu thanh lý ${updatedPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      ...updatedPhieu,
      chi_tiet: chiTiet,
      thong_ke: buildChiTietSummary(chiTiet),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getChiTietThanhLyList = async (phieuThanhLyId, query) => {
  await ensurePhieuExists(phieuThanhLyId);

  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    thanhLyRepository.findChiTietThanhLyByPhieuId(phieuThanhLyId, normalizedQuery),
    thanhLyRepository.countChiTietThanhLyByPhieuId(phieuThanhLyId, normalizedQuery),
  ]);

  return {
    items,
    pagination: {
      page: normalizedQuery.page,
      limit: normalizedQuery.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / normalizedQuery.limit) || 1,
    },
  };
};

const addChiTietThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const phieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    ensureEditableChiTiet(phieu);

    ensureChiTietDevicesNotDuplicate(payload.items);

    const currentChiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    const existingDeviceSet = new Set(currentChiTiet.map((item) => Number(item.thiet_bi_id)));

    for (const item of payload.items) {
      if (existingDeviceSet.has(Number(item.thiet_bi_id))) {
        throw new AppError(`Thiết bị ${item.thiet_bi_id} đã tđn tại trong phiếu thanh lý`, 409);
      }
    }

    await validateChiTietItems(payload.items, {
      connection,
      excludePhieuThanhLyId: phieuThanhLyId,
    });

    const rows = payload.items.map((item) => ({
      phieu_thanh_ly_id: phieuThanhLyId,
      thiet_bi_id: item.thiet_bi_id,
      ly_do_thanh_ly_id: item.ly_do_thanh_ly_id,
      tinh_trang_hien_tai: item.tinh_trang_hien_tai ?? null,
      chi_phi_sua_chua_da_phat_sinh: item.chi_phi_sua_chua_da_phat_sinh ?? 0,
      gia_tri_thu_hoi_du_kien: item.gia_tri_thu_hoi_du_kien ?? 0,
      ghi_chu: item.ghi_chu ?? null,
    }));
    await thanhLyRepository.createChiTietThanhLyBatch(rows, { connection });

    const allChiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(phieuThanhLyId, { connection });
    const addedDeviceSet = new Set(payload.items.map((item) => Number(item.thiet_bi_id)));
    const addedItems = allChiTiet.filter((item) => addedDeviceSet.has(Number(item.thiet_bi_id)));

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'ADD_CHI_TIET_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: phieuThanhLyId,
      du_lieu_moi: {
        so_luong_them: addedItems.length,
        items: addedItems,
      },
      ghi_chu: `Thêm ${addedItems.length} chi tiết vào phiếu ${phieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      so_luong_them: addedItems.length,
      items: addedItems,
      thong_ke: buildChiTietSummary(allChiTiet),
    };
  } catch (error) {
    await connection.rollback();
    throw mapDuplicateDatabaseError(error);
  } finally {
    connection.release();
  }
};

const updateChiTietThanhLy = async (
  actor,
  phieuThanhLyId,
  chiTietThanhLyId,
  payload,
  context = {},
) => {
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const phieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    ensureEditableChiTiet(phieu);

    const currentChiTiet = await thanhLyRepository.findChiTietThanhLyById(
      phieuThanhLyId,
      chiTietThanhLyId,
      { connection, forUpdate: true },
    );
    if (!currentChiTiet) {
      throw new AppError('Không tìm thấy chi tiết thanh lý', 404);
    }

    const nextThietBiId = hasOwn(payload, 'thiet_bi_id')
      ? Number(payload.thiet_bi_id)
      : Number(currentChiTiet.thiet_bi_id);
    const nextLyDoId = hasOwn(payload, 'ly_do_thanh_ly_id')
      ? Number(payload.ly_do_thanh_ly_id)
      : Number(currentChiTiet.ly_do_thanh_ly_id);

    await ensureLyDoThanhLyExists(nextLyDoId, { connection });

    const allChiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    const duplicated = allChiTiet.find((item) => {
      return Number(item.chi_tiet_thanh_ly_id) !== Number(chiTietThanhLyId)
        && Number(item.thiet_bi_id) === nextThietBiId;
    });
    if (duplicated) {
      throw new AppError('Thiết bị đã tđn tại trong phiếu thanh lý', 409);
    }

    if (hasOwn(payload, 'thiet_bi_id')) {
      const device = await ensureDeviceExists(nextThietBiId, { connection, forUpdate: true });
      ensureDeviceNotDisposed(device);
      await ensureDeviceNotBusy(nextThietBiId, {
        connection,
        excludePhieuThanhLyId: phieuThanhLyId,
      });
    }

    await thanhLyRepository.updateChiTietThanhLyById(chiTietThanhLyId, payload, { connection });
    const updatedChiTiet = await thanhLyRepository.findChiTietThanhLyById(phieuThanhLyId, chiTietThanhLyId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'UPDATE_CHI_TIET_THANH_LY',
      entity_name: 'chi_tiet_thanh_ly',
      entity_id: chiTietThanhLyId,
      du_lieu_cu: currentChiTiet,
      du_lieu_moi: updatedChiTiet,
      ghi_chu: `Cập nhật chi tiết #${chiTietThanhLyId} của phiếu ${phieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return updatedChiTiet;
  } catch (error) {
    await connection.rollback();
    throw mapDuplicateDatabaseError(error);
  } finally {
    connection.release();
  }
};

const deleteChiTietThanhLy = async (
  actor,
  phieuThanhLyId,
  chiTietThanhLyId,
  context = {},
) => {
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const phieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    ensureEditableChiTiet(phieu);

    const currentChiTiet = await thanhLyRepository.findChiTietThanhLyById(
      phieuThanhLyId,
      chiTietThanhLyId,
      { connection, forUpdate: true },
    );
    if (!currentChiTiet) {
      throw new AppError('Không tìm thấy chi tiết thanh lý', 404);
    }

    await thanhLyRepository.deleteChiTietThanhLyById(phieuThanhLyId, chiTietThanhLyId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'DELETE_CHI_TIET_THANH_LY',
      entity_name: 'chi_tiet_thanh_ly',
      entity_id: chiTietThanhLyId,
      du_lieu_cu: currentChiTiet,
      ghi_chu: `Xóa chi tiết #${chiTietThanhLyId} khỏi phiếu ${phieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      chi_tiet_thanh_ly_id: Number(chiTietThanhLyId),
      phieu_thanh_ly_id: Number(phieuThanhLyId),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const guiDuyetPhieuThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });

    if (currentPhieu.trang_thai !== PHIEU_TRANG_THAI.NHAP) {
      throw new AppError('Chđ0 được gửi duyđ!t khi phiếu đx trạng thái NHAP', 400);
    }

    const chiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    if (!chiTiet.length) {
      throw new AppError('Phiếu thanh lý phải có ít nhất 1 thiết bị trưđ:c khi gửi duyđ!t', 400);
    }

    await validateChiTietItems(chiTiet, {
      connection,
      excludePhieuThanhLyId: phieuThanhLyId,
    });

    const updatePayload = {
      trang_thai: PHIEU_TRANG_THAI.CHO_DUYET,
    };
    if (hasOwn(payload, 'ghi_chu')) {
      updatePayload.ghi_chu = payload.ghi_chu;
    }

    await thanhLyRepository.updatePhieuThanhLyById(phieuThanhLyId, updatePayload, { connection });
    const updatedPhieu = await ensurePhieuExists(phieuThanhLyId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'GUI_DUYET_PHIEU_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: phieuThanhLyId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: updatedPhieu,
      ghi_chu: `Gửi duyđ!t phiếu thanh lý ${updatedPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return updatedPhieu;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const duyetPhieuThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  ensureApprovePermission(actor);
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });

    if (currentPhieu.trang_thai !== PHIEU_TRANG_THAI.CHO_DUYET) {
      throw new AppError('Chđ0 được duyđ!t khi phiếu đx trạng thái CHO_DUYET', 400);
    }

    const now = new Date();
    const updatePayload = {
      trang_thai: PHIEU_TRANG_THAI.DA_DUYET,
      nguoi_duyet_id: actor.nguoi_dung_id,
      ngay_duyet: now,
      ly_do_tu_choi: null,
    };
    if (hasOwn(payload, 'ghi_chu')) {
      updatePayload.ghi_chu = payload.ghi_chu;
    }

    await thanhLyRepository.updatePhieuThanhLyById(phieuThanhLyId, updatePayload, { connection });
    const updatedPhieu = await ensurePhieuExists(phieuThanhLyId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'DUYET_PHIEU_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: phieuThanhLyId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: updatedPhieu,
      ghi_chu: `Duyđ!t phiếu thanh lý ${updatedPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return updatedPhieu;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const tuChoiPhieuThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  ensureApprovePermission(actor);
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });

    if (currentPhieu.trang_thai !== PHIEU_TRANG_THAI.CHO_DUYET) {
      throw new AppError('Chđ0 được từ chđi khi phiếu đx trạng thái CHO_DUYET', 400);
    }

    const now = new Date();
    await thanhLyRepository.updatePhieuThanhLyById(phieuThanhLyId, {
      trang_thai: PHIEU_TRANG_THAI.TU_CHOI,
      nguoi_duyet_id: actor.nguoi_dung_id,
      ngay_duyet: now,
      ly_do_tu_choi: payload.ly_do_tu_choi,
      ghi_chu: hasOwn(payload, 'ghi_chu') ? payload.ghi_chu : currentPhieu.ghi_chu,
    }, { connection });
    const updatedPhieu = await ensurePhieuExists(phieuThanhLyId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'TU_CHOI_PHIEU_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: phieuThanhLyId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: updatedPhieu,
      ghi_chu: `Từ chđi phiếu thanh lý ${updatedPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return updatedPhieu;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const hoanTatPhieuThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  ensureCompletePermission(actor);
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });

    if (currentPhieu.trang_thai !== PHIEU_TRANG_THAI.DA_DUYET) {
      throw new AppError('Chđ0 được hoàn tất khi phiếu đx trạng thái DA_DUYET', 400);
    }

    const chiTiet = await thanhLyRepository.findAllChiTietThanhLyByPhieuId(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });
    if (!chiTiet.length) {
      throw new AppError('Phiếu thanh lý chưa có chi tiết thiết bị', 400);
    }

    const disposedStatus = await resolveDisposedStatus(connection);

    const syncResults = [];
    for (const item of chiTiet) {
      const device = await ensureDeviceExists(item.thiet_bi_id, {
        connection,
        forUpdate: true,
      });

      if (isDisposedStatus(device)) {
        syncResults.push({
          thiet_bi_id: device.thiet_bi_id,
          ma_tai_san: device.ma_tai_san,
          da_cap_nhat: false,
          canh_bao: 'Thiết bị đã đx trạng thái Đã thanh lý',
        });
        continue;
      }

      await thanhLyRepository.updateDeviceById(device.thiet_bi_id, {
        trang_thai_thiet_bi_id: disposedStatus.trang_thai_thiet_bi_id,
        tinh_trang_hien_tai: `Đã thanh lý theo phiếu ${currentPhieu.ma_phieu}`,
        updated_by: actor.nguoi_dung_id,
      }, { connection });

      await thanhLyRepository.createDeviceStatusHistory({
        thiet_bi_id: device.thiet_bi_id,
        tu_trang_thai_id: device.trang_thai_thiet_bi_id,
        den_trang_thai_id: disposedStatus.trang_thai_thiet_bi_id,
        loai_nguon_phat_sinh: 'PHIEU_THANH_LY_HOAN_TAT',
        nguon_phat_sinh_id: phieuThanhLyId,
        ly_do: `Hoàn tất phiếu thanh lý ${currentPhieu.ma_phieu}`,
        changed_by: actor.nguoi_dung_id,
      }, { connection });

      syncResults.push({
        thiet_bi_id: device.thiet_bi_id,
        ma_tai_san: device.ma_tai_san,
        da_cap_nhat: true,
        canh_bao: null,
      });
    }

    const now = new Date();
    await thanhLyRepository.updatePhieuThanhLyById(phieuThanhLyId, {
      trang_thai: PHIEU_TRANG_THAI.HOAN_TAT,
      nguoi_hoan_tat_id: actor.nguoi_dung_id,
      ngay_hoan_tat: now,
      ghi_chu: hasOwn(payload, 'ghi_chu') ? payload.ghi_chu : currentPhieu.ghi_chu,
    }, { connection });
    const updatedPhieu = await ensurePhieuExists(phieuThanhLyId, { connection });

    await connection.commit();

    const canhBao = syncResults
      .filter((item) => item.canh_bao)
      .map((item) => ({
        thiet_bi_id: item.thiet_bi_id,
        ma_tai_san: item.ma_tai_san,
        noi_dung: item.canh_bao,
      }));

    const dongBo = {
      tong_thiet_bi: syncResults.length,
      da_cap_nhat: syncResults.filter((item) => item.da_cap_nhat).length,
      giu_nguyen: syncResults.filter((item) => !item.da_cap_nhat).length,
      canh_bao: canhBao,
    };

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'HOAN_TAT_PHIEU_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: phieuThanhLyId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: {
        ...updatedPhieu,
        dong_bo: dongBo,
      },
      ghi_chu: `Hoàn tất phiếu thanh lý ${updatedPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      ...updatedPhieu,
      thong_ke: buildChiTietSummary(chiTiet),
      dong_bo: dongBo,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const huyPhieuThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  const connection = await thanhLyRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuThanhLyId, {
      connection,
      forUpdate: true,
    });

    ensureCancelPermission(actor, currentPhieu);
    ensureTransitionAllowed(currentPhieu.trang_thai, PHIEU_TRANG_THAI.HUY);

    const mergedNote = appendCancelReasonToNote({
      currentNote: currentPhieu.ghi_chu,
      reason: payload.ly_do_huy,
      extraNote: payload.ghi_chu,
    });

    await thanhLyRepository.updatePhieuThanhLyById(phieuThanhLyId, {
      trang_thai: PHIEU_TRANG_THAI.HUY,
      ly_do_tu_choi: `Lý do hủy: ${payload.ly_do_huy}`,
      ghi_chu: mergedNote,
    }, { connection });
    const updatedPhieu = await ensurePhieuExists(phieuThanhLyId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'HUY_PHIEU_THANH_LY',
      entity_name: ENTITY_NAME,
      entity_id: phieuThanhLyId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: updatedPhieu,
      ghi_chu: `Hủy phiếu thanh lý ${updatedPhieu.ma_phieu}: ${payload.ly_do_huy}`,
      ip_address: context.ipAddress,
    });

    return updatedPhieu;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const chuyenTrangThaiPhieuThanhLy = async (actor, phieuThanhLyId, payload, context = {}) => {
  const target = payload.trang_thai;

  if (target === PHIEU_TRANG_THAI.CHO_DUYET) {
    return guiDuyetPhieuThanhLy(actor, phieuThanhLyId, { ghi_chu: payload.ghi_chu }, context);
  }
  if (target === PHIEU_TRANG_THAI.DA_DUYET) {
    return duyetPhieuThanhLy(actor, phieuThanhLyId, { ghi_chu: payload.ghi_chu }, context);
  }
  if (target === PHIEU_TRANG_THAI.TU_CHOI) {
    return tuChoiPhieuThanhLy(actor, phieuThanhLyId, {
      ly_do_tu_choi: payload.ly_do_tu_choi,
      ghi_chu: payload.ghi_chu,
    }, context);
  }
  if (target === PHIEU_TRANG_THAI.HOAN_TAT) {
    return hoanTatPhieuThanhLy(actor, phieuThanhLyId, { ghi_chu: payload.ghi_chu }, context);
  }
  if (target === PHIEU_TRANG_THAI.HUY) {
    return huyPhieuThanhLy(actor, phieuThanhLyId, {
      ly_do_huy: payload.ly_do_huy,
      ghi_chu: payload.ghi_chu,
    }, context);
  }

  throw new AppError('Không hđ trợ chuyỒn về trạng thái này bằng API', 400);
};

const getPhieuThanhLyHistory = async (phieuThanhLyId, query) => {
  await ensurePhieuExists(phieuThanhLyId);

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;

  const [items, totalItems] = await Promise.all([
    thanhLyRepository.findNhatKyByPhieuId(phieuThanhLyId, { page, limit }),
    thanhLyRepository.countNhatKyByPhieuId(phieuThanhLyId),
  ]);

  return {
    items: items.map((item) => ({
      ...item,
      du_lieu_cu: parseJsonSafely(item.du_lieu_cu),
      du_lieu_moi: parseJsonSafely(item.du_lieu_moi),
    })),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit) || 1,
    },
  };
};

module.exports = {
  createPhieuThanhLy,
  getPhieuThanhLyList,
  getPhieuThanhLyDetail,
  updatePhieuThanhLy,
  getChiTietThanhLyList,
  addChiTietThanhLy,
  updateChiTietThanhLy,
  deleteChiTietThanhLy,
  guiDuyetPhieuThanhLy,
  duyetPhieuThanhLy,
  tuChoiPhieuThanhLy,
  hoanTatPhieuThanhLy,
  huyPhieuThanhLy,
  chuyenTrangThaiPhieuThanhLy,
  getPhieuThanhLyHistory,
};



