const AppError = require('../utils/appError');
const { writeAuditLog } = require('./auditLog.service');
const kiemKeRepository = require('../repositories/kiemKe.repository');

const MODULE_NAME = 'KIEM_KE';
const ENTITY_NAME = 'phieu_kiem_ke';
const MAX_CREATE_CODE_RETRIES = 5;

const PHIEU_TRANG_THAI = {
  NHAP: 'NHAP',
  DANG_KIEM_KE: 'DANG_KIEM_KE',
  CHO_XAC_NHAN: 'CHO_XAC_NHAN',
  HOAN_TAT: 'HOAN_TAT',
  HUY: 'HUY',
};

const LOAI_PHAM_VI = {
  TOAN_TRUONG: 'TOAN_TRUONG',
  THEO_DON_VI: 'THEO_DON_VI',
};

const ALLOWED_TRANSITIONS = {
  [PHIEU_TRANG_THAI.NHAP]: [PHIEU_TRANG_THAI.DANG_KIEM_KE, PHIEU_TRANG_THAI.HUY],
  [PHIEU_TRANG_THAI.DANG_KIEM_KE]: [PHIEU_TRANG_THAI.CHO_XAC_NHAN, PHIEU_TRANG_THAI.HUY],
  [PHIEU_TRANG_THAI.CHO_XAC_NHAN]: [PHIEU_TRANG_THAI.HOAN_TAT, PHIEU_TRANG_THAI.HUY],
  [PHIEU_TRANG_THAI.HOAN_TAT]: [],
  [PHIEU_TRANG_THAI.HUY]: [],
};

const CHI_TIET_EDITABLE_STATES = [PHIEU_TRANG_THAI.NHAP, PHIEU_TRANG_THAI.DANG_KIEM_KE];
const ACTIVE_ACCOUNT_STATUS = 'ACTIVE';
const DEFAULT_TINH_TRANG_PRIORITY_CODES = [
  'CHUA_KIEM_KE',
  'CHUA_KIEMKE',
  'CHUA_CO_KET_QUA',
  'CHO_KIEM_KE',
  'TOT_DAT',
];

const hasOwn = (obj, key) => {
  return Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined;
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

const isMysqlDuplicateKeyError = (error) => {
  return Number(error?.errno) === 1062 || String(error?.code || '').toUpperCase() === 'ER_DUP_ENTRY';
};

const isMaPhieuDuplicateError = (error) => {
  const message = String(error?.sqlMessage || error?.message || '').toLowerCase();
  return message.includes('ma_phieu');
};

const isChiTietPhieuThietBiDuplicateError = (error) => {
  const message = String(error?.sqlMessage || error?.message || '').toLowerCase();
  return message.includes('uq_ctkk_phieu_thiet_bi') || message.includes('phieu_kiem_ke_id');
};

const isDisposedStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('THANHLY') || name.includes('THANHLY');
};

const isBrokenStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('HONGNANG') || name.includes('HONGNANG');
};

const isLostStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('MATTHIEU') || name.includes('MATTHIEU');
};

const isInUseStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('DANGSUDUNG') || name.includes('DANGSUDUNG');
};

const isMaintenanceStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('BAOTRI') || name.includes('BAOTRI');
};

const normalizeInventoryStatusCode = (maTinhTrang) => {
  return normalizeText(maTinhTrang);
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

const generateMaPhieuKiemKe = () => {
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

  return `PKK-${datePart}-${timePart}${randomPart}`;
};

const buildThongKeChiTiet = (chiTietList) => {
  const tongThietBi = Number(chiTietList.length || 0);
  const daKiemKe = chiTietList.filter((item) => {
    return Boolean(item?.tinh_trang_kiem_ke_id && item?.nguoi_kiem_ke_id && item?.thoi_gian_kiem_ke);
  }).length;

  return {
    tong_thiet_bi: tongThietBi,
    da_kiem_ke: daKiemKe,
    chua_kiem_ke: Math.max(tongThietBi - daKiemKe, 0),
  };
};

const ensurePhieuExists = async (phieuKiemKeId, options = {}) => {
  const phieu = await kiemKeRepository.findPhieuKiemKeById(phieuKiemKeId, options);
  if (!phieu) {
    throw new AppError('Không tìm thấy phiếu kiểm kê', 404);
  }
  return phieu;
};

const ensureDonViExists = async (donViId, options = {}) => {
  if (donViId === null || donViId === undefined) return null;

  const donVi = await kiemKeRepository.findDonViById(donViId, options);
  if (!donVi) {
    throw new AppError('Đơn vị không tồn tại', 400);
  }
  if (Number(donVi.is_active) !== 1) {
    throw new AppError('Đơn vị đang không hoạt động', 400);
  }

  return donVi;
};

const ensureNguoiDungExists = async (nguoiDungId, options = {}) => {
  if (nguoiDungId === null || nguoiDungId === undefined) return null;

  const nguoiDung = await kiemKeRepository.findNguoiDungById(nguoiDungId, options);
  if (!nguoiDung) {
    throw new AppError('Người dùng không tồn tại', 400);
  }
  if (String(nguoiDung.trang_thai_tai_khoan || '').toUpperCase() !== ACTIVE_ACCOUNT_STATUS) {
    throw new AppError('Người dùng đang không hoạt động', 400);
  }

  return nguoiDung;
};

const ensureTinhTrangKiemKeExists = async (tinhTrangKiemKeId, options = {}) => {
  const tinhTrang = await kiemKeRepository.findTinhTrangKiemKeById(tinhTrangKiemKeId, options);
  if (!tinhTrang) {
    throw new AppError('tinh_trang_kiem_ke_id không hợp lệ', 400);
  }
  if (Number(tinhTrang.is_active) !== 1) {
    throw new AppError('Tình trạng kiểm kê đang không hoạt động', 400);
  }
  return tinhTrang;
};

const ensureTransitionAllowed = (currentStatus, nextStatus) => {
  const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedStatuses.includes(nextStatus)) {
    throw new AppError(`Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`, 400);
  }
};

const ensureEditablePhieu = (phieu) => {
  if (phieu.trang_thai === PHIEU_TRANG_THAI.HOAN_TAT || phieu.trang_thai === PHIEU_TRANG_THAI.HUY) {
    throw new AppError('Phiếu kiểm kê đã hoàn tất hoặc đã hủy, không thể thao tác', 400);
  }
};

const ensureChiTietEditable = (phieu) => {
  if (!CHI_TIET_EDITABLE_STATES.includes(phieu.trang_thai)) {
    throw new AppError('Chỉ được cập nhật chi tiết khi phiếu ở trạng thái NHAP hoặc DANG_KIEM_KE', 400);
  }
};

const resolveDefaultTinhTrangKiemKe = async (connection) => {
  for (const code of DEFAULT_TINH_TRANG_PRIORITY_CODES) {
    const row = await kiemKeRepository.findTinhTrangKiemKeByCode(code, { connection });
    if (row && Number(row.is_active) === 1) {
      return row;
    }
  }

  const activeList = await kiemKeRepository.findActiveTinhTrangKiemKeList({ connection });
  if (!activeList.length) {
    throw new AppError('Chưa cấu hình tình trạng kiểm kê hoạt động trong hệ thống', 500);
  }
  return activeList[0];
};

const resolveTrangThaiThietBiBundle = async (connection) => {
  const statuses = await kiemKeRepository.findTrangThaiThietBiList({
    connection,
    activeOnly: true,
  });

  return {
    inUseStatus: statuses.find(isInUseStatus) || null,
    brokenStatus: statuses.find(isBrokenStatus) || null,
    lostStatus: statuses.find(isLostStatus) || null,
    disposedStatus: statuses.find(isDisposedStatus) || null,
    maintenanceStatus: statuses.find(isMaintenanceStatus) || null,
  };
};

const appendCancelReasonToNote = ({ currentNote, reason, extraNote }) => {
  const parts = [];

  if (currentNote && String(currentNote).trim()) parts.push(String(currentNote).trim());
  if (reason && String(reason).trim()) parts.push(`Lý do hủy: ${String(reason).trim()}`);
  if (extraNote && String(extraNote).trim()) parts.push(String(extraNote).trim());

  if (!parts.length) return null;
  return parts.join('\n');
};

const resolvePhieuScope = (currentPhieu, payload) => {
  const nextLoaiPhamVi = hasOwn(payload, 'loai_pham_vi')
    ? payload.loai_pham_vi
    : currentPhieu.loai_pham_vi;

  let nextDonViId;
  if (hasOwn(payload, 'don_vi_id')) {
    nextDonViId = payload.don_vi_id;
  } else if (nextLoaiPhamVi === LOAI_PHAM_VI.THEO_DON_VI) {
    nextDonViId = currentPhieu.don_vi_id;
  } else {
    nextDonViId = null;
  }

  if (nextLoaiPhamVi === LOAI_PHAM_VI.THEO_DON_VI && !nextDonViId) {
    throw new AppError('don_vi_id là bắt buộc khi loai_pham_vi = THEO_DON_VI', 400);
  }

  return {
    loai_pham_vi: nextLoaiPhamVi,
    don_vi_id: nextLoaiPhamVi === LOAI_PHAM_VI.THEO_DON_VI ? nextDonViId : null,
  };
};

const filterValidDevicesForInventory = (devices) => {
  return devices.filter((device) => !isDisposedStatus(device));
};

const mapDuplicateDatabaseError = (error) => {
  if (!isMysqlDuplicateKeyError(error)) return error;

  if (isMaPhieuDuplicateError(error)) {
    return new AppError('Mã phiếu kiểm kê bị trùng, vui lòng thử lại', 409);
  }
  if (isChiTietPhieuThietBiDuplicateError(error)) {
    return new AppError('Đã có thiết bị bị trùng trong danh sách kiểm kê của phiếu', 409);
  }

  return new AppError('Dữ liệu bị trùng với bản ghi khác', 409);
};

const applySingleChiTietUpdate = async ({
  connection,
  actor,
  phieu,
  phieuKiemKeId,
  chiTietKiemKeId,
  payload,
}) => {
  const currentChiTiet = await kiemKeRepository.findChiTietKiemKeById(
    phieuKiemKeId,
    chiTietKiemKeId,
    {
      connection,
      forUpdate: true,
    },
  );
  if (!currentChiTiet) {
    throw new AppError('Không tìm thấy chi tiết kiểm kê', 404);
  }

  ensureChiTietEditable(phieu);

  let finalTinhTrang = null;
  if (hasOwn(payload, 'tinh_trang_kiem_ke_id')) {
    finalTinhTrang = await ensureTinhTrangKiemKeExists(payload.tinh_trang_kiem_ke_id, { connection });
  } else {
    finalTinhTrang = await ensureTinhTrangKiemKeExists(currentChiTiet.tinh_trang_kiem_ke_id, { connection });
  }

  const finalTinhTrangCode = normalizeInventoryStatusCode(finalTinhTrang.ma_tinh_trang);
  const isSaiViTri = finalTinhTrangCode.includes('SAIVITRI');

  if (hasOwn(payload, 'don_vi_thuc_te_id') && payload.don_vi_thuc_te_id !== null) {
    await ensureDonViExists(payload.don_vi_thuc_te_id, { connection });
    if (!isSaiViTri) {
      throw new AppError('Chỉ được nhập don_vi_thuc_te_id khi tình trạng kiểm kê là SAI_VI_TRI', 400);
    }
  }

  if (hasOwn(payload, 'nguoi_kiem_ke_id') && payload.nguoi_kiem_ke_id !== null) {
    await ensureNguoiDungExists(payload.nguoi_kiem_ke_id, { connection });
  }

  const updatePayload = {};

  if (hasOwn(payload, 'tinh_trang_kiem_ke_id')) {
    updatePayload.tinh_trang_kiem_ke_id = payload.tinh_trang_kiem_ke_id;
  }

  if (hasOwn(payload, 'don_vi_thuc_te_id')) {
    updatePayload.don_vi_thuc_te_id = payload.don_vi_thuc_te_id;
  } else if (!isSaiViTri && currentChiTiet.don_vi_thuc_te_id) {
    updatePayload.don_vi_thuc_te_id = null;
  }

  if (hasOwn(payload, 'ghi_chu')) {
    updatePayload.ghi_chu = payload.ghi_chu;
  }

  if (hasOwn(payload, 'nguoi_kiem_ke_id')) {
    updatePayload.nguoi_kiem_ke_id = payload.nguoi_kiem_ke_id;
  }
  if (hasOwn(payload, 'thoi_gian_kiem_ke')) {
    updatePayload.thoi_gian_kiem_ke = payload.thoi_gian_kiem_ke;
  }

  const isUpdatingResult = hasOwn(payload, 'tinh_trang_kiem_ke_id')
    || hasOwn(payload, 'don_vi_thuc_te_id')
    || hasOwn(payload, 'ghi_chu');

  if (isUpdatingResult && !hasOwn(updatePayload, 'nguoi_kiem_ke_id') && !currentChiTiet.nguoi_kiem_ke_id) {
    updatePayload.nguoi_kiem_ke_id = Number(actor.nguoi_dung_id);
  }
  if (isUpdatingResult && !hasOwn(updatePayload, 'thoi_gian_kiem_ke') && !currentChiTiet.thoi_gian_kiem_ke) {
    updatePayload.thoi_gian_kiem_ke = new Date();
  }

  await kiemKeRepository.updateChiTietKiemKeById(currentChiTiet.chi_tiet_kiem_ke_id, updatePayload, {
    connection,
  });

  const updatedChiTiet = await kiemKeRepository.findChiTietKiemKeById(
    phieuKiemKeId,
    currentChiTiet.chi_tiet_kiem_ke_id,
    { connection },
  );

  return {
    oldData: currentChiTiet,
    newData: updatedChiTiet,
  };
};

const syncDeviceFromChiTiet = async ({
  connection,
  actor,
  phieu,
  chiTiet,
  statusBundle,
}) => {
  const device = await kiemKeRepository.findDeviceById(chiTiet.thiet_bi_id, {
    connection,
    forUpdate: true,
  });
  if (!device) {
    return {
      thiet_bi_id: chiTiet.thiet_bi_id,
      ma_tai_san: chiTiet.ma_tai_san || null,
      da_cap_nhat: false,
      canh_bao: 'Thiết bị không còn tồn tại để đồng bộ',
    };
  }

  const maTinhTrang = normalizeInventoryStatusCode(chiTiet.ma_tinh_trang);
  const currentStatus = {
    trang_thai_thiet_bi_id: device.trang_thai_thiet_bi_id,
    ma_trang_thai: device.ma_trang_thai,
    ten_trang_thai: device.ten_trang_thai,
  };

  let targetStatus = null;
  if (maTinhTrang.includes('HONG')) {
    targetStatus = statusBundle.brokenStatus;
  } else if (maTinhTrang.includes('THIEUMAT') || maTinhTrang.includes('MATTHIEU')) {
    targetStatus = statusBundle.lostStatus;
  } else if (maTinhTrang.includes('TOTDAT')) {
    if ((isBrokenStatus(currentStatus) || isLostStatus(currentStatus) || isMaintenanceStatus(currentStatus)) && statusBundle.inUseStatus) {
      targetStatus = statusBundle.inUseStatus;
    }
  }

  const updatePayload = {
    updated_by: Number(actor.nguoi_dung_id),
  };
  let hasUpdate = false;
  let warning = null;

  if (targetStatus) {
    if (Number(targetStatus.trang_thai_thiet_bi_id) !== Number(device.trang_thai_thiet_bi_id)) {
      updatePayload.trang_thai_thiet_bi_id = Number(targetStatus.trang_thai_thiet_bi_id);
      hasUpdate = true;
    }
  } else if (maTinhTrang.includes('HONG')) {
    warning = 'Không tìm thấy trạng thái thiết bị tương ứng cho kết quả HỎNG';
  } else if (maTinhTrang.includes('THIEUMAT') || maTinhTrang.includes('MATTHIEU')) {
    warning = 'Không tìm thấy trạng thái thiết bị tương ứng cho kết quả THIẾU/MẤT';
  }

  if (maTinhTrang.includes('SAIVITRI')) {
    if (chiTiet.don_vi_thuc_te_id) {
      if (Number(chiTiet.don_vi_thuc_te_id) !== Number(device.don_vi_hien_tai_id || 0)) {
        updatePayload.don_vi_hien_tai_id = Number(chiTiet.don_vi_thuc_te_id);
        hasUpdate = true;
      }
    } else {
      warning = warning || 'Thiết bị có kết quả SAI_VI_TRI nhưng thiếu don_vi_thuc_te_id';
    }
  }

  if (chiTiet.ten_tinh_trang) {
    updatePayload.tinh_trang_hien_tai = `Kết quả kiểm kê: ${chiTiet.ten_tinh_trang}`;
    hasUpdate = true;
  }

  if (!hasUpdate) {
    return {
      thiet_bi_id: device.thiet_bi_id,
      ma_tai_san: device.ma_tai_san,
      da_cap_nhat: false,
      canh_bao: warning,
    };
  }

  await kiemKeRepository.updateDeviceById(device.thiet_bi_id, updatePayload, { connection });

  if (
    hasOwn(updatePayload, 'trang_thai_thiet_bi_id')
    && Number(updatePayload.trang_thai_thiet_bi_id) !== Number(device.trang_thai_thiet_bi_id)
  ) {
    await kiemKeRepository.createDeviceStatusHistory({
      thiet_bi_id: device.thiet_bi_id,
      tu_trang_thai_id: device.trang_thai_thiet_bi_id,
      den_trang_thai_id: updatePayload.trang_thai_thiet_bi_id,
      loai_nguon_phat_sinh: 'KIEM_KE',
      nguon_phat_sinh_id: phieu.phieu_kiem_ke_id,
      ly_do: `Đồng bộ sau kiểm kê phiếu ${phieu.ma_phieu}`,
      changed_by: actor.nguoi_dung_id,
    }, { connection });
  }

  return {
    thiet_bi_id: device.thiet_bi_id,
    ma_tai_san: device.ma_tai_san,
    da_cap_nhat: true,
    canh_bao: warning,
  };
};

const createPhieuKiemKe = async (actor, payload, context = {}) => {
  const connection = await kiemKeRepository.getConnection();

  try {
    await connection.beginTransaction();

    if (payload.loai_pham_vi === LOAI_PHAM_VI.THEO_DON_VI) {
      await ensureDonViExists(payload.don_vi_id, { connection });
    }

    const devicesInScope = await kiemKeRepository.findDevicesForScope(
      {
        loai_pham_vi: payload.loai_pham_vi,
        don_vi_id: payload.don_vi_id ?? null,
      },
      { connection, forUpdate: true },
    );
    const validDevices = filterValidDevicesForInventory(devicesInScope);
    if (!validDevices.length) {
      throw new AppError('Không có thiết bị hợp lệ trong phạm vi kiểm kê', 400);
    }

    const defaultTinhTrang = await resolveDefaultTinhTrangKiemKe(connection);

    let createdPhieuId = null;
    let lastCreateError = null;
    for (let attempt = 1; attempt <= MAX_CREATE_CODE_RETRIES; attempt += 1) {
      try {
        createdPhieuId = await kiemKeRepository.createPhieuKiemKe({
          ma_phieu: generateMaPhieuKiemKe(),
          ten_dot_kiem_ke: payload.ten_dot_kiem_ke,
          loai_pham_vi: payload.loai_pham_vi,
          don_vi_id: payload.loai_pham_vi === LOAI_PHAM_VI.THEO_DON_VI ? payload.don_vi_id : null,
          thoi_diem_bat_dau: payload.thoi_diem_bat_dau,
          thoi_diem_ket_thuc: null,
          trang_thai: PHIEU_TRANG_THAI.NHAP,
          nguoi_tao_id: actor.nguoi_dung_id,
          nguoi_xac_nhan_id: null,
          ghi_chu: payload.ghi_chu ?? null,
        }, { connection });
        break;
      } catch (error) {
        if (isMysqlDuplicateKeyError(error) && isMaPhieuDuplicateError(error)) {
          lastCreateError = error;
          continue;
        }
        throw error;
      }
    }

    if (!createdPhieuId) {
      throw lastCreateError || new AppError('Không thể sinh mã phiếu kiểm kê, vui lòng thử lại', 500);
    }

    const chiTietRows = validDevices.map((device) => ({
      phieu_kiem_ke_id: createdPhieuId,
      thiet_bi_id: device.thiet_bi_id,
      tinh_trang_kiem_ke_id: defaultTinhTrang.tinh_trang_kiem_ke_id,
      don_vi_thuc_te_id: null,
      ghi_chu: null,
      nguoi_kiem_ke_id: null,
      thoi_gian_kiem_ke: null,
    }));
    await kiemKeRepository.createChiTietKiemKeBatch(chiTietRows, { connection });

    const createdPhieu = await ensurePhieuExists(createdPhieuId, { connection });
    const allChiTiet = await kiemKeRepository.findAllChiTietKiemKeByPhieuId(createdPhieuId, { connection });
    const thongKe = buildThongKeChiTiet(allChiTiet);

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'CREATE_PHIEU_KIEM_KE',
      entity_name: ENTITY_NAME,
      entity_id: createdPhieuId,
      du_lieu_moi: {
        ...createdPhieu,
        thong_ke: thongKe,
      },
      ghi_chu: `Tạo phiếu kiểm kê ${createdPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      ...createdPhieu,
      thong_ke: thongKe,
    };
  } catch (error) {
    await connection.rollback();
    throw mapDuplicateDatabaseError(error);
  } finally {
    connection.release();
  }
};

const getPhieuKiemKeList = async (query) => {
  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    kiemKeRepository.findPhieuKiemKeList(normalizedQuery),
    kiemKeRepository.countPhieuKiemKe(normalizedQuery),
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

const getPhieuKiemKeDetail = async (phieuKiemKeId) => {
  const phieu = await ensurePhieuExists(phieuKiemKeId);
  const chiTietList = await kiemKeRepository.findAllChiTietKiemKeByPhieuId(phieuKiemKeId);

  return {
    ...phieu,
    chi_tiet: chiTietList,
    thong_ke: buildThongKeChiTiet(chiTietList),
  };
};

const updatePhieuKiemKe = async (actor, phieuKiemKeId, payload, context = {}) => {
  const connection = await kiemKeRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuKiemKeId, {
      connection,
      forUpdate: true,
    });

    if (currentPhieu.trang_thai !== PHIEU_TRANG_THAI.NHAP) {
      throw new AppError('Chỉ được cập nhật phiếu khi trạng thái là NHAP', 400);
    }

    const resolvedScope = resolvePhieuScope(currentPhieu, payload);
    if (resolvedScope.loai_pham_vi === LOAI_PHAM_VI.THEO_DON_VI) {
      await ensureDonViExists(resolvedScope.don_vi_id, { connection });
    }

    const updatePayload = {};
    if (hasOwn(payload, 'ten_dot_kiem_ke')) updatePayload.ten_dot_kiem_ke = payload.ten_dot_kiem_ke;
    if (hasOwn(payload, 'thoi_diem_bat_dau')) updatePayload.thoi_diem_bat_dau = payload.thoi_diem_bat_dau;
    if (hasOwn(payload, 'ghi_chu')) updatePayload.ghi_chu = payload.ghi_chu;
    if (
      hasOwn(payload, 'loai_pham_vi')
      || hasOwn(payload, 'don_vi_id')
    ) {
      updatePayload.loai_pham_vi = resolvedScope.loai_pham_vi;
      updatePayload.don_vi_id = resolvedScope.don_vi_id;
    }

    const isScopeChanged = resolvedScope.loai_pham_vi !== currentPhieu.loai_pham_vi
      || Number(resolvedScope.don_vi_id || 0) !== Number(currentPhieu.don_vi_id || 0);

    if (isScopeChanged) {
      const devicesInScope = await kiemKeRepository.findDevicesForScope(
        {
          loai_pham_vi: resolvedScope.loai_pham_vi,
          don_vi_id: resolvedScope.don_vi_id ?? null,
        },
        { connection, forUpdate: true },
      );
      const validDevices = filterValidDevicesForInventory(devicesInScope);
      if (!validDevices.length) {
        throw new AppError('Không có thiết bị hợp lệ trong phạm vi kiểm kê', 400);
      }

      const defaultTinhTrang = await resolveDefaultTinhTrangKiemKe(connection);
      await kiemKeRepository.deleteChiTietByPhieuId(phieuKiemKeId, { connection });

      const chiTietRows = validDevices.map((device) => ({
        phieu_kiem_ke_id: phieuKiemKeId,
        thiet_bi_id: device.thiet_bi_id,
        tinh_trang_kiem_ke_id: defaultTinhTrang.tinh_trang_kiem_ke_id,
        don_vi_thuc_te_id: null,
        ghi_chu: null,
        nguoi_kiem_ke_id: null,
        thoi_gian_kiem_ke: null,
      }));
      await kiemKeRepository.createChiTietKiemKeBatch(chiTietRows, { connection });
    }

    await kiemKeRepository.updatePhieuKiemKeById(phieuKiemKeId, updatePayload, { connection });

    const updatedPhieu = await ensurePhieuExists(phieuKiemKeId, { connection });
    const updatedChiTiet = await kiemKeRepository.findAllChiTietKiemKeByPhieuId(phieuKiemKeId, { connection });
    const thongKe = buildThongKeChiTiet(updatedChiTiet);

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'UPDATE_PHIEU_KIEM_KE',
      entity_name: ENTITY_NAME,
      entity_id: phieuKiemKeId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: {
        ...updatedPhieu,
        thong_ke: thongKe,
      },
      ghi_chu: `Cập nhật phiếu kiểm kê ${updatedPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      ...updatedPhieu,
      thong_ke: thongKe,
    };
  } catch (error) {
    await connection.rollback();
    throw mapDuplicateDatabaseError(error);
  } finally {
    connection.release();
  }
};

const chuyenTrangThaiPhieuKiemKe = async (actor, phieuKiemKeId, payload, context = {}) => {
  if (payload.trang_thai === PHIEU_TRANG_THAI.HUY) {
    return huyPhieuKiemKe(actor, phieuKiemKeId, {
      ly_do: payload.ghi_chu || 'Hủy từ API chuyển trạng thái',
      ghi_chu: payload.ghi_chu || null,
    }, context);
  }

  if (payload.trang_thai === PHIEU_TRANG_THAI.HOAN_TAT) {
    return hoanTatPhieuKiemKe(actor, phieuKiemKeId, {
      ghi_chu: payload.ghi_chu ?? null,
    }, context);
  }

  const connection = await kiemKeRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuKiemKeId, {
      connection,
      forUpdate: true,
    });
    ensureEditablePhieu(currentPhieu);
    ensureTransitionAllowed(currentPhieu.trang_thai, payload.trang_thai);

    const updatePayload = {
      trang_thai: payload.trang_thai,
    };
    if (hasOwn(payload, 'ghi_chu')) {
      updatePayload.ghi_chu = payload.ghi_chu;
    }

    await kiemKeRepository.updatePhieuKiemKeById(phieuKiemKeId, updatePayload, { connection });
    const updatedPhieu = await ensurePhieuExists(phieuKiemKeId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'CHUYEN_TRANG_THAI_PHIEU_KIEM_KE',
      entity_name: ENTITY_NAME,
      entity_id: phieuKiemKeId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: updatedPhieu,
      ghi_chu: `Chuyển trạng thái phiếu ${updatedPhieu.ma_phieu} sang ${payload.trang_thai}`,
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

const huyPhieuKiemKe = async (actor, phieuKiemKeId, payload, context = {}) => {
  const connection = await kiemKeRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuKiemKeId, {
      connection,
      forUpdate: true,
    });
    ensureEditablePhieu(currentPhieu);
    ensureTransitionAllowed(currentPhieu.trang_thai, PHIEU_TRANG_THAI.HUY);

    const now = new Date();
    const ghiChu = appendCancelReasonToNote({
      currentNote: currentPhieu.ghi_chu,
      reason: payload.ly_do,
      extraNote: payload.ghi_chu,
    });

    await kiemKeRepository.updatePhieuKiemKeById(phieuKiemKeId, {
      trang_thai: PHIEU_TRANG_THAI.HUY,
      thoi_diem_ket_thuc: now,
      ghi_chu: ghiChu,
    }, { connection });

    const updatedPhieu = await ensurePhieuExists(phieuKiemKeId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'HUY_PHIEU_KIEM_KE',
      entity_name: ENTITY_NAME,
      entity_id: phieuKiemKeId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: updatedPhieu,
      ghi_chu: `Hủy phiếu kiểm kê ${updatedPhieu.ma_phieu}: ${payload.ly_do}`,
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

const getChiTietKiemKeList = async (phieuKiemKeId, query) => {
  await ensurePhieuExists(phieuKiemKeId);

  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    kiemKeRepository.findChiTietKiemKeByPhieuId(phieuKiemKeId, normalizedQuery),
    kiemKeRepository.countChiTietKiemKeByPhieuId(phieuKiemKeId, normalizedQuery),
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

const updateChiTietKiemKe = async (actor, phieuKiemKeId, chiTietKiemKeId, payload, context = {}) => {
  const connection = await kiemKeRepository.getConnection();

  try {
    await connection.beginTransaction();

    const phieu = await ensurePhieuExists(phieuKiemKeId, {
      connection,
      forUpdate: true,
    });
    ensureEditablePhieu(phieu);
    ensureChiTietEditable(phieu);

    const result = await applySingleChiTietUpdate({
      connection,
      actor,
      phieu,
      phieuKiemKeId,
      chiTietKiemKeId,
      payload,
    });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'UPDATE_CHI_TIET_KIEM_KE',
      entity_name: 'chi_tiet_kiem_ke',
      entity_id: chiTietKiemKeId,
      du_lieu_cu: result.oldData,
      du_lieu_moi: result.newData,
      ghi_chu: `Cập nhật chi tiết kiểm kê #${chiTietKiemKeId} của phiếu ${phieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return result.newData;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const bulkUpdateChiTietKiemKe = async (actor, phieuKiemKeId, payload, context = {}) => {
  const connection = await kiemKeRepository.getConnection();

  try {
    await connection.beginTransaction();

    const phieu = await ensurePhieuExists(phieuKiemKeId, {
      connection,
      forUpdate: true,
    });
    ensureEditablePhieu(phieu);
    ensureChiTietEditable(phieu);

    const updatedItems = [];
    for (const item of payload.items) {
      const { chi_tiet_kiem_ke_id: chiTietKiemKeId, ...updatePayload } = item;
      const updated = await applySingleChiTietUpdate({
        connection,
        actor,
        phieu,
        phieuKiemKeId,
        chiTietKiemKeId,
        payload: updatePayload,
      });
      updatedItems.push(updated.newData);
    }

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor?.nguoi_dung_id || null,
      module: MODULE_NAME,
      hanh_dong: 'BULK_UPDATE_CHI_TIET_KIEM_KE',
      entity_name: ENTITY_NAME,
      entity_id: phieuKiemKeId,
      du_lieu_moi: {
        so_luong_cap_nhat: updatedItems.length,
      },
      ghi_chu: `Cập nhật hàng loạt ${updatedItems.length} chi tiết kiểm kê của phiếu ${phieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      so_luong_cap_nhat: updatedItems.length,
      items: updatedItems,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const hoanTatPhieuKiemKe = async (actor, phieuKiemKeId, payload, context = {}) => {
  const connection = await kiemKeRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentPhieu = await ensurePhieuExists(phieuKiemKeId, {
      connection,
      forUpdate: true,
    });

    if (currentPhieu.trang_thai !== PHIEU_TRANG_THAI.CHO_XAC_NHAN) {
      throw new AppError('Chỉ được hoàn tất khi phiếu đang ở trạng thái CHO_XAC_NHAN', 400);
    }

    const totalChiTiet = await kiemKeRepository.countChiTietKiemKeByPhieuId(phieuKiemKeId, {}, { connection });
    if (totalChiTiet <= 0) {
      throw new AppError('Phiếu kiểm kê chưa có chi tiết thiết bị', 400);
    }

    const pendingCount = await kiemKeRepository.countPendingChiTietByPhieuId(phieuKiemKeId, { connection });
    if (pendingCount > 0) {
      throw new AppError('Không thể hoàn tất: còn thiết bị chưa nhập đủ kết quả kiểm kê', 400);
    }

    const chiTietForSync = await kiemKeRepository.findChiTietForDongBoByPhieuId(phieuKiemKeId, { connection });
    const statusBundle = await resolveTrangThaiThietBiBundle(connection);

    const syncResults = [];
    for (const chiTiet of chiTietForSync) {
      const syncResult = await syncDeviceFromChiTiet({
        connection,
        actor,
        phieu: currentPhieu,
        chiTiet,
        statusBundle,
      });
      syncResults.push(syncResult);
    }

    const now = new Date();
    await kiemKeRepository.updatePhieuKiemKeById(phieuKiemKeId, {
      trang_thai: PHIEU_TRANG_THAI.HOAN_TAT,
      nguoi_xac_nhan_id: actor.nguoi_dung_id,
      thoi_diem_ket_thuc: now,
      ghi_chu: hasOwn(payload, 'ghi_chu') ? payload.ghi_chu : currentPhieu.ghi_chu,
    }, { connection });

    const updatedPhieu = await ensurePhieuExists(phieuKiemKeId, { connection });
    const allChiTiet = await kiemKeRepository.findAllChiTietKiemKeByPhieuId(phieuKiemKeId, { connection });

    await connection.commit();

    const canhBao = syncResults
      .filter((item) => item?.canh_bao)
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
      hanh_dong: 'HOAN_TAT_PHIEU_KIEM_KE',
      entity_name: ENTITY_NAME,
      entity_id: phieuKiemKeId,
      du_lieu_cu: currentPhieu,
      du_lieu_moi: {
        ...updatedPhieu,
        dong_bo: dongBo,
      },
      ghi_chu: `Hoàn tất phiếu kiểm kê ${updatedPhieu.ma_phieu}`,
      ip_address: context.ipAddress,
    });

    return {
      ...updatedPhieu,
      thong_ke: buildThongKeChiTiet(allChiTiet),
      dong_bo: dongBo,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getPhieuKiemKeHistory = async (phieuKiemKeId, query) => {
  await ensurePhieuExists(phieuKiemKeId);

  const page = Number(query.page) > 0 ? Number(query.page) : 1;
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;

  const [items, totalItems] = await Promise.all([
    kiemKeRepository.findNhatKyByPhieuId(phieuKiemKeId, { page, limit }),
    kiemKeRepository.countNhatKyByPhieuId(phieuKiemKeId),
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
  createPhieuKiemKe,
  getPhieuKiemKeList,
  getPhieuKiemKeDetail,
  updatePhieuKiemKe,
  chuyenTrangThaiPhieuKiemKe,
  huyPhieuKiemKe,
  getChiTietKiemKeList,
  updateChiTietKiemKe,
  bulkUpdateChiTietKiemKe,
  hoanTatPhieuKiemKe,
  getPhieuKiemKeHistory,
};
