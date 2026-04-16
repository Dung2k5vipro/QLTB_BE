const AppError = require('../utils/appError');
const baoHongRepository = require('../repositories/baoHong.repository');

const MODULE_NAME = 'BAO_HONG';
const ENTITY_NAME = 'phieu_bao_hong';

const PHIEU_TRANG_THAI = {
  CHO_XU_LY: 'CHO_XU_LY',
  DA_TIEP_NHAN: 'DA_TIEP_NHAN',
  DANG_XU_LY: 'DANG_XU_LY',
  CHO_LINH_KIEN: 'CHO_LINH_KIEN',
  HOAN_THANH: 'HOAN_THANH',
  TU_CHOI: 'TU_CHOI',
  HUY: 'HUY',
};

const PHIEU_DANG_MO = [
  PHIEU_TRANG_THAI.CHO_XU_LY,
  PHIEU_TRANG_THAI.DA_TIEP_NHAN,
  PHIEU_TRANG_THAI.DANG_XU_LY,
  PHIEU_TRANG_THAI.CHO_LINH_KIEN,
];

const PHIEU_CO_THE_XU_LY = [
  PHIEU_TRANG_THAI.DA_TIEP_NHAN,
  PHIEU_TRANG_THAI.DANG_XU_LY,
  PHIEU_TRANG_THAI.CHO_LINH_KIEN,
];

const PHIEU_CO_THE_DONG_KHONG_HOAN_THANH = [
  PHIEU_TRANG_THAI.CHO_XU_LY,
  PHIEU_TRANG_THAI.DA_TIEP_NHAN,
  PHIEU_TRANG_THAI.DANG_XU_LY,
  PHIEU_TRANG_THAI.CHO_LINH_KIEN,
];

const LOAI_XU_LY_MAC_DINH = 'SUA_CHUA';
const MAX_CREATE_CODE_RETRIES = 5;

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

const isTeacher = (user) => normalizeRole(user) === 'GIAO_VIEN';

const normalizeText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

const parseJsonValue = (value) => {
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

const safeStringify = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch (_error) {
    return null;
  }
};

const isMysqlDuplicateKeyError = (error) => {
  return Number(error?.errno) === 1062 || String(error?.code || '').toUpperCase() === 'ER_DUP_ENTRY';
};

const isOpenDeviceDuplicateError = (error) => {
  const message = String(error?.sqlMessage || error?.message || '').toLowerCase();
  return message.includes('open_device_id');
};

const isMaPhieuDuplicateError = (error) => {
  const message = String(error?.sqlMessage || error?.message || '').toLowerCase();
  return message.includes('ma_phieu');
};

const mapPhieuBaoHong = (row) => {
  if (!row) return null;
  return {
    ...row,
    hinh_anh_dinh_kem: parseJsonValue(row.hinh_anh_dinh_kem),
  };
};

const mapNhatKyBaoTri = (row) => {
  if (!row) return null;
  return {
    ...row,
    phu_tung_thay_the: parseJsonValue(row.phu_tung_thay_the),
  };
};

const isDisposedStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('THANHLY') || name.includes('THANHLY');
};

const isMaintenanceStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('BAOTRI') || name.includes('BAOTRI');
};

const isInUseStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('DANGSUDUNG') || name.includes('DANGSUDUNG');
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

const resolveStatusBundle = async (connection) => {
  const statuses = await baoHongRepository.findTrangThaiThietBiList({
    connection,
    activeOnly: true,
  });

  return {
    maintenanceStatus: statuses.find(isMaintenanceStatus) || null,
    inUseStatus: statuses.find(isInUseStatus) || null,
    disposedStatus: statuses.find(isDisposedStatus) || null,
    brokenStatus: statuses.find(isBrokenStatus) || null,
    lostStatus: statuses.find(isLostStatus) || null,
  };
};

const ensureDeviceExists = async (thietBiId, options = {}) => {
  const device = await baoHongRepository.findDeviceById(thietBiId, options);
  if (!device) {
    throw new AppError('Không tìm thấy thiết bị', 404);
  }
  return device;
};

const ensureTicketExists = async (phieuBaoHongId, options = {}) => {
  const ticket = await baoHongRepository.findPhieuBaoHongById(phieuBaoHongId, options);
  if (!ticket) {
    throw new AppError('Không tìm thấy phiếu báo hỏng', 404);
  }
  return ticket;
};

const ensureMucDoUuTienExists = async (mucDoUuTienId, options = {}) => {
  const priority = await baoHongRepository.findMucDoUuTienById(mucDoUuTienId, options);
  if (!priority) {
    throw new AppError('muc_do_uu_tien_id không hợp lệ', 400);
  }
  if (Number(priority.is_active) !== 1) {
    throw new AppError('muc_do_uu_tien_id đang không hoạt động', 400);
  }
  return priority;
};

const ensureDonViExists = async (donViId, options = {}) => {
  if (donViId === null || donViId === undefined) return null;

  const donVi = await baoHongRepository.findDonViById(donViId, options);
  if (!donVi) {
    throw new AppError('don_vi_id không hợp lệ', 400);
  }
  if (Number(donVi.is_active) !== 1) {
    throw new AppError('Đơn vị đang không hoạt động', 400);
  }

  return donVi;
};

const ensureDonViSuaChuaExists = async (donViSuaChuaId, options = {}) => {
  if (donViSuaChuaId === null || donViSuaChuaId === undefined) return null;

  const donViSuaChua = await baoHongRepository.findDonViSuaChuaById(donViSuaChuaId, options);
  if (!donViSuaChua) {
    throw new AppError('don_vi_sua_chua_id không hợp lệ', 400);
  }
  if (Number(donViSuaChua.is_active) !== 1) {
    throw new AppError('Đơn vị sửa chữa đang không hoạt động', 400);
  }

  return donViSuaChua;
};

const ensureDeviceStatusExists = async (trangThaiThietBiId, options = {}) => {
  const status = await baoHongRepository.findTrangThaiThietBiById(trangThaiThietBiId, options);
  if (!status) {
    throw new AppError('trang_thai_thiet_bi_id không hợp lệ', 400);
  }
  if (Number(status.is_active) !== 1) {
    throw new AppError('trang_thai_thiet_bi_id đang không hoạt động', 400);
  }
  return status;
};

const ensureCanCreateTicketForDevice = (actor, device) => {
  const role = normalizeRole(actor);
  if (role === 'ADMIN' || role === 'NHAN_VIEN_THIET_BI') return;

  if (role === 'GIAO_VIEN') {
    const actorId = Number(actor?.nguoi_dung_id);
    const actorDonViId = Number(actor?.don_vi_id);
    const sameOwner = Number(device?.nguoi_phu_trach_id) > 0
      && Number(device.nguoi_phu_trach_id) === actorId;
    const sameDonVi = Number(device?.don_vi_hien_tai_id) > 0
      && Number(device.don_vi_hien_tai_id) === actorDonViId;

    if (sameOwner || sameDonVi) return;
  }

  throw new AppError('Bạn không có quyền báo hỏng thiết bị này', 403);
};

const ensureCanViewTicket = (actor, ticket) => {
  if (!isTeacher(actor)) return;

  if (Number(ticket.nguoi_tao_id) !== Number(actor.nguoi_dung_id)) {
    throw new AppError('Bạn không có quyền xem phiếu báo hỏng này', 403);
  }
};

const ensureDeviceNotDisposed = (device) => {
  if (isDisposedStatus(device)) {
    throw new AppError('Thiết bị đã thanh lý, không thể báo hỏng', 400);
  }
};

const generateMaPhieu = () => {
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

  return `PBH-${datePart}-${timePart}${randomPart}`;
};

const ensureTicketState = (ticket, allowedStates, message) => {
  if (!allowedStates.includes(ticket.trang_thai)) {
    throw new AppError(message, 400);
  }
};

const upsertNhatKyBaoTri = async ({
  connection,
  ticket,
  payload,
  actor,
  now,
  setNgayHoanThanh = false,
}) => {
  let log = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(ticket.phieu_bao_hong_id, {
    connection,
    forUpdate: true,
  });

  const hasProvidedField = [
    'loai_xu_ly',
    'noi_dung_xu_ly',
    'chi_phi',
    'phu_tung_thay_the',
    'don_vi_sua_chua_id',
    'ket_qua_xu_ly',
  ].some((field) => hasOwn(payload, field));

  if (!log) {
    const createdId = await baoHongRepository.createNhatKyBaoTri({
      thiet_bi_id: ticket.thiet_bi_id,
      phieu_bao_hong_id: ticket.phieu_bao_hong_id,
      loai_xu_ly: hasOwn(payload, 'loai_xu_ly') ? payload.loai_xu_ly : LOAI_XU_LY_MAC_DINH,
      ngay_tiep_nhan: ticket.thoi_gian_tiep_nhan || now,
      ngay_hoan_thanh: setNgayHoanThanh ? now : null,
      noi_dung_xu_ly: hasOwn(payload, 'noi_dung_xu_ly') ? payload.noi_dung_xu_ly : null,
      chi_phi: hasOwn(payload, 'chi_phi') ? payload.chi_phi : 0,
      phu_tung_thay_the: hasOwn(payload, 'phu_tung_thay_the') ? payload.phu_tung_thay_the : null,
      don_vi_sua_chua_id: hasOwn(payload, 'don_vi_sua_chua_id') ? payload.don_vi_sua_chua_id : null,
      ket_qua_xu_ly: hasOwn(payload, 'ket_qua_xu_ly') ? payload.ket_qua_xu_ly : null,
      thuc_hien_boi_id: actor.nguoi_dung_id,
    }, { connection });

    log = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(ticket.phieu_bao_hong_id, {
      connection,
      forUpdate: true,
    });

    if (Number(log?.nhat_ky_bao_tri_id) !== Number(createdId)) {
      throw new AppError('Không thể ghi nhận nhật ký bảo trì', 500);
    }

    return log;
  }

  const updatePayload = {};
  if (hasOwn(payload, 'loai_xu_ly')) updatePayload.loai_xu_ly = payload.loai_xu_ly;
  if (hasOwn(payload, 'noi_dung_xu_ly')) updatePayload.noi_dung_xu_ly = payload.noi_dung_xu_ly;
  if (hasOwn(payload, 'chi_phi')) updatePayload.chi_phi = payload.chi_phi;
  if (hasOwn(payload, 'phu_tung_thay_the')) updatePayload.phu_tung_thay_the = payload.phu_tung_thay_the;
  if (hasOwn(payload, 'don_vi_sua_chua_id')) updatePayload.don_vi_sua_chua_id = payload.don_vi_sua_chua_id;
  if (hasOwn(payload, 'ket_qua_xu_ly')) updatePayload.ket_qua_xu_ly = payload.ket_qua_xu_ly;

  if (!log.ngay_tiep_nhan) {
    updatePayload.ngay_tiep_nhan = ticket.thoi_gian_tiep_nhan || now;
  }

  if (setNgayHoanThanh) {
    updatePayload.ngay_hoan_thanh = now;
  }

  if (hasProvidedField || setNgayHoanThanh) {
    updatePayload.thuc_hien_boi_id = actor.nguoi_dung_id;
  }

  if (Object.keys(updatePayload).length) {
    await baoHongRepository.updateNhatKyBaoTriById(log.nhat_ky_bao_tri_id, updatePayload, { connection });
    log = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(ticket.phieu_bao_hong_id, {
      connection,
      forUpdate: true,
    });
  }

  return log;
};

const ensureMinimumDataForHoanThanh = (maintenanceLog) => {
  const noiDungXuLy = String(maintenanceLog?.noi_dung_xu_ly || '').trim();
  const ketQuaXuLy = String(maintenanceLog?.ket_qua_xu_ly || '').trim();

  if (!noiDungXuLy || !ketQuaXuLy) {
    throw new AppError('Không thể hoàn thành khi thiếu thông tin xử lý tối thiểu', 400);
  }
};

const determineFinalStatusFromResult = ({
  maintenanceLog,
  currentDevice,
  statusBundle,
  explicitStatus,
}) => {
  if (explicitStatus) return explicitStatus;

  const ketQua = normalizeText(maintenanceLog?.ket_qua_xu_ly);

  if ((ketQua.includes('THANHLY') || ketQua.includes('THANHLI')) && statusBundle.disposedStatus) {
    return statusBundle.disposedStatus;
  }

  if (
    (ketQua.includes('HONGNANG')
      || ketQua.includes('KHONGSUADUOC')
      || ketQua.includes('KHONGKHACPHUC'))
    && statusBundle.brokenStatus
  ) {
    return statusBundle.brokenStatus;
  }

  if ((ketQua.includes('MATTHIEU') || ketQua.includes('MATTHIET')) && statusBundle.lostStatus) {
    return statusBundle.lostStatus;
  }

  if (statusBundle.inUseStatus) {
    return statusBundle.inUseStatus;
  }

  const fallbackCurrentStatus = {
    trang_thai_thiet_bi_id: currentDevice.trang_thai_thiet_bi_id,
    ma_trang_thai: currentDevice.ma_trang_thai,
    ten_trang_thai: currentDevice.ten_trang_thai,
  };

  if (isMaintenanceStatus(fallbackCurrentStatus)) {
    throw new AppError('Không tìm thấy trạng thái thiết bị phù hợp để hoàn thành phiếu', 500);
  }

  return fallbackCurrentStatus;
};

const updateDeviceStatusIfNeeded = async ({
  connection,
  device,
  targetStatus,
  actor,
  reason,
  sourceType,
  sourceId,
}) => {
  const currentStatusId = Number(device.trang_thai_thiet_bi_id);
  const targetStatusId = Number(targetStatus?.trang_thai_thiet_bi_id);

  if (!targetStatusId || currentStatusId === targetStatusId) {
    return false;
  }

  await baoHongRepository.updateDeviceStatus(device.thiet_bi_id, {
    trang_thai_thiet_bi_id: targetStatusId,
    updated_by: actor.nguoi_dung_id,
  }, { connection });

  await baoHongRepository.createDeviceStatusHistory({
    thiet_bi_id: device.thiet_bi_id,
    tu_trang_thai_id: device.trang_thai_thiet_bi_id,
    den_trang_thai_id: targetStatusId,
    loai_nguon_phat_sinh: sourceType,
    nguon_phat_sinh_id: sourceId,
    ly_do: reason,
    changed_by: actor.nguoi_dung_id,
  }, { connection });

  return true;
};

const writeSystemLog = async ({
  connection,
  actor,
  action,
  entityId,
  oldData,
  newData,
  note,
  ipAddress,
}) => {
  await baoHongRepository.createSystemLog({
    nguoi_dung_id: actor?.nguoi_dung_id ?? null,
    module: MODULE_NAME,
    hanh_dong: action,
    entity_name: ENTITY_NAME,
    entity_id: entityId ?? null,
    du_lieu_cu: safeStringify(oldData),
    du_lieu_moi: safeStringify(newData),
    ghi_chu: note || null,
    ip_address: ipAddress || null,
  }, { connection });
};

const createPhieuBaoHong = async (actor, payload, context = {}) => {
  const connection = await baoHongRepository.getConnection();

  try {
    await connection.beginTransaction();

    const device = await ensureDeviceExists(payload.thiet_bi_id, { connection, forUpdate: true });
    ensureDeviceNotDisposed(device);
    ensureCanCreateTicketForDevice(actor, device);

    await ensureMucDoUuTienExists(payload.muc_do_uu_tien_id, { connection });

    const openTicket = await baoHongRepository.findOpenTicketByDeviceId(payload.thiet_bi_id, {
      connection,
      openStatuses: PHIEU_DANG_MO,
    });
    if (openTicket) {
      throw new AppError('Thiết bị đã có phiếu báo hỏng đang mở', 409);
    }

    const donViId = hasOwn(payload, 'don_vi_id')
      ? payload.don_vi_id
      : (device.don_vi_hien_tai_id ?? actor?.don_vi_id ?? null);
    await ensureDonViExists(donViId, { connection });

    let createdId = null;
    let lastCreateError = null;

    for (let attempt = 1; attempt <= MAX_CREATE_CODE_RETRIES; attempt += 1) {
      try {
        createdId = await baoHongRepository.createPhieuBaoHong({
          ma_phieu: generateMaPhieu(),
          thiet_bi_id: payload.thiet_bi_id,
          nguoi_tao_id: actor.nguoi_dung_id,
          don_vi_id: donViId,
          muc_do_uu_tien_id: payload.muc_do_uu_tien_id,
          mo_ta_su_co: payload.mo_ta_su_co,
          hinh_anh_dinh_kem: payload.hinh_anh_dinh_kem ?? null,
          thoi_gian_phat_hien: payload.thoi_gian_phat_hien,
          trang_thai: PHIEU_TRANG_THAI.CHO_XU_LY,
        }, { connection });
        break;
      } catch (error) {
        if (isMysqlDuplicateKeyError(error) && isOpenDeviceDuplicateError(error)) {
          throw new AppError('Thiết bị đã có phiếu báo hỏng đang mở', 409);
        }
        if (isMysqlDuplicateKeyError(error) && isMaPhieuDuplicateError(error)) {
          lastCreateError = error;
          continue;
        }
        throw error;
      }
    }

    if (!createdId) {
      throw lastCreateError || new AppError('Không thể tạo mã phiếu báo hỏng, vui lòng thử lại', 500);
    }

    const created = await ensureTicketExists(createdId, { connection });

    await writeSystemLog({
      connection,
      actor,
      action: 'CREATE_PHIEU_BAO_HONG',
      entityId: createdId,
      oldData: null,
      newData: created,
      note: `Tạo phiếu báo hỏng ${created.ma_phieu}`,
      ipAddress: context.ipAddress,
    });

    await connection.commit();
    return mapPhieuBaoHong(created);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getPhieuBaoHongList = async (actor, query) => {
  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };
  if (isTeacher(actor)) {
    normalizedQuery.nguoi_tao_id = actor.nguoi_dung_id;
  }

  const [items, totalItems] = await Promise.all([
    baoHongRepository.findPhieuBaoHongList(normalizedQuery),
    baoHongRepository.countPhieuBaoHong(normalizedQuery),
  ]);

  return {
    items: items.map(mapPhieuBaoHong),
    pagination: {
      page: normalizedQuery.page,
      limit: normalizedQuery.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / normalizedQuery.limit) || 1,
    },
  };
};

const getPhieuBaoHongDetail = async (actor, phieuBaoHongId) => {
  const ticket = await ensureTicketExists(phieuBaoHongId);
  ensureCanViewTicket(actor, ticket);

  const maintenanceLog = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(phieuBaoHongId);
  return {
    ...mapPhieuBaoHong(ticket),
    nhat_ky_bao_tri: mapNhatKyBaoTri(maintenanceLog),
  };
};

const tiepNhanPhieuBaoHong = async (actor, phieuBaoHongId, _payload, context = {}) => {
  const connection = await baoHongRepository.getConnection();

  try {
    await connection.beginTransaction();

    const ticket = await ensureTicketExists(phieuBaoHongId, {
      connection,
      forUpdate: true,
    });

    ensureTicketState(
      ticket,
      [PHIEU_TRANG_THAI.CHO_XU_LY],
      'Chỉ được tiếp nhận phiếu đang ở trạng thái CHO_XU_LY',
    );

    const device = await ensureDeviceExists(ticket.thiet_bi_id, {
      connection,
      forUpdate: true,
    });

    const statusBundle = await resolveStatusBundle(connection);
    if (!statusBundle.maintenanceStatus) {
      throw new AppError('Không tìm thấy trạng thái thiết bị Đang bảo trì', 500);
    }

    const now = new Date();

    await baoHongRepository.updatePhieuBaoHongById(ticket.phieu_bao_hong_id, {
      trang_thai: PHIEU_TRANG_THAI.DA_TIEP_NHAN,
      nguoi_tiep_nhan_id: actor.nguoi_dung_id,
      thoi_gian_tiep_nhan: now,
      ly_do_tu_choi_hoac_huy: null,
    }, { connection });

    await upsertNhatKyBaoTri({
      connection,
      ticket: {
        ...ticket,
        thoi_gian_tiep_nhan: now,
      },
      payload: {},
      actor,
      now,
      setNgayHoanThanh: false,
    });

    await updateDeviceStatusIfNeeded({
      connection,
      device,
      targetStatus: statusBundle.maintenanceStatus,
      actor,
      reason: 'Tiếp nhận phiếu báo hỏng',
      sourceType: 'PHIEU_BAO_HONG_TIEP_NHAN',
      sourceId: ticket.phieu_bao_hong_id,
    });

    const updatedTicket = await ensureTicketExists(phieuBaoHongId, { connection });
    const updatedMaintenanceLog = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(phieuBaoHongId, {
      connection,
    });

    await writeSystemLog({
      connection,
      actor,
      action: 'TIEP_NHAN_PHIEU_BAO_HONG',
      entityId: ticket.phieu_bao_hong_id,
      oldData: ticket,
      newData: updatedTicket,
      note: `Tiếp nhận phiếu báo hỏng ${updatedTicket.ma_phieu}`,
      ipAddress: context.ipAddress,
    });

    await connection.commit();

    return {
      ...mapPhieuBaoHong(updatedTicket),
      nhat_ky_bao_tri: mapNhatKyBaoTri(updatedMaintenanceLog),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const capNhatXuLyPhieuBaoHong = async (actor, phieuBaoHongId, payload, context = {}) => {
  const connection = await baoHongRepository.getConnection();

  try {
    await connection.beginTransaction();

    const ticket = await ensureTicketExists(phieuBaoHongId, {
      connection,
      forUpdate: true,
    });

    ensureTicketState(
      ticket,
      PHIEU_CO_THE_XU_LY,
      'Chỉ được cập nhật xử lý khi phiếu ở trạng thái DA_TIEP_NHAN, DANG_XU_LY hoặc CHO_LINH_KIEN',
    );

    if (hasOwn(payload, 'don_vi_sua_chua_id')) {
      await ensureDonViSuaChuaExists(payload.don_vi_sua_chua_id, { connection });
    }

    const device = await ensureDeviceExists(ticket.thiet_bi_id, {
      connection,
      forUpdate: true,
    });
    const statusBundle = await resolveStatusBundle(connection);
    if (!statusBundle.maintenanceStatus) {
      throw new AppError('Không tìm thấy trạng thái thiết bị Đang bảo trì', 500);
    }

    const now = new Date();
    const maintenanceLog = await upsertNhatKyBaoTri({
      connection,
      ticket,
      payload,
      actor,
      now,
      setNgayHoanThanh: false,
    });

    let nextTrangThai = ticket.trang_thai;
    if (hasOwn(payload, 'trang_thai') && payload.trang_thai) {
      nextTrangThai = payload.trang_thai;
    } else if (ticket.trang_thai === PHIEU_TRANG_THAI.DA_TIEP_NHAN) {
      nextTrangThai = PHIEU_TRANG_THAI.DANG_XU_LY;
    }

    await baoHongRepository.updatePhieuBaoHongById(ticket.phieu_bao_hong_id, {
      trang_thai: nextTrangThai,
    }, { connection });

    await updateDeviceStatusIfNeeded({
      connection,
      device,
      targetStatus: statusBundle.maintenanceStatus,
      actor,
      reason: 'Cập nhật xử lý phiếu báo hỏng',
      sourceType: 'PHIEU_BAO_HONG_CAP_NHAT_XU_LY',
      sourceId: ticket.phieu_bao_hong_id,
    });

    const updatedTicket = await ensureTicketExists(phieuBaoHongId, { connection });

    await writeSystemLog({
      connection,
      actor,
      action: 'CAP_NHAT_XU_LY_PHIEU_BAO_HONG',
      entityId: ticket.phieu_bao_hong_id,
      oldData: ticket,
      newData: {
        ...updatedTicket,
        nhat_ky_bao_tri: maintenanceLog,
      },
      note: `Cập nhật xử lý phiếu báo hỏng ${updatedTicket.ma_phieu}`,
      ipAddress: context.ipAddress,
    });

    await connection.commit();
    return {
      ...mapPhieuBaoHong(updatedTicket),
      nhat_ky_bao_tri: mapNhatKyBaoTri(maintenanceLog),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const hoanThanhPhieuBaoHong = async (actor, phieuBaoHongId, payload, context = {}) => {
  const connection = await baoHongRepository.getConnection();

  try {
    await connection.beginTransaction();

    const ticket = await ensureTicketExists(phieuBaoHongId, {
      connection,
      forUpdate: true,
    });

    ensureTicketState(
      ticket,
      PHIEU_CO_THE_XU_LY,
      'Chỉ được hoàn thành phiếu khi đang được tiếp nhận hoặc đang xử lý',
    );

    if (hasOwn(payload, 'don_vi_sua_chua_id')) {
      await ensureDonViSuaChuaExists(payload.don_vi_sua_chua_id, { connection });
    }

    let explicitStatus = null;
    if (hasOwn(payload, 'trang_thai_thiet_bi_id') && payload.trang_thai_thiet_bi_id) {
      explicitStatus = await ensureDeviceStatusExists(payload.trang_thai_thiet_bi_id, { connection });
    }

    const device = await ensureDeviceExists(ticket.thiet_bi_id, {
      connection,
      forUpdate: true,
    });
    const statusBundle = await resolveStatusBundle(connection);

    const now = new Date();
    const maintenanceLog = await upsertNhatKyBaoTri({
      connection,
      ticket,
      payload,
      actor,
      now,
      setNgayHoanThanh: true,
    });

    ensureMinimumDataForHoanThanh(maintenanceLog);

    const finalDeviceStatus = determineFinalStatusFromResult({
      maintenanceLog,
      currentDevice: device,
      statusBundle,
      explicitStatus,
    });

    await baoHongRepository.updatePhieuBaoHongById(ticket.phieu_bao_hong_id, {
      trang_thai: PHIEU_TRANG_THAI.HOAN_THANH,
      nguoi_dong_phieu_id: actor.nguoi_dung_id,
      thoi_gian_dong: now,
      ly_do_tu_choi_hoac_huy: null,
    }, { connection });

    await updateDeviceStatusIfNeeded({
      connection,
      device,
      targetStatus: finalDeviceStatus,
      actor,
      reason: `Hoàn thành phiếu báo hỏng ${ticket.ma_phieu}`,
      sourceType: 'PHIEU_BAO_HONG_HOAN_THANH',
      sourceId: ticket.phieu_bao_hong_id,
    });

    const updatedTicket = await ensureTicketExists(phieuBaoHongId, { connection });
    const updatedMaintenanceLog = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(phieuBaoHongId, {
      connection,
    });

    await writeSystemLog({
      connection,
      actor,
      action: 'HOAN_THANH_PHIEU_BAO_HONG',
      entityId: ticket.phieu_bao_hong_id,
      oldData: ticket,
      newData: {
        ...updatedTicket,
        nhat_ky_bao_tri: updatedMaintenanceLog,
      },
      note: `Hoàn thành phiếu báo hỏng ${updatedTicket.ma_phieu}`,
      ipAddress: context.ipAddress,
    });

    await connection.commit();
    return {
      ...mapPhieuBaoHong(updatedTicket),
      nhat_ky_bao_tri: mapNhatKyBaoTri(updatedMaintenanceLog),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const closeTicketWithoutCompletion = async (
  actor,
  phieuBaoHongId,
  payload,
  targetStatus,
  actionName,
  context = {},
) => {
  const connection = await baoHongRepository.getConnection();

  try {
    await connection.beginTransaction();

    const ticket = await ensureTicketExists(phieuBaoHongId, {
      connection,
      forUpdate: true,
    });

    ensureTicketState(
      ticket,
      PHIEU_CO_THE_DONG_KHONG_HOAN_THANH,
      `Không thể ${actionName} phiếu ở trạng thái hiện tại`,
    );

    const device = await ensureDeviceExists(ticket.thiet_bi_id, {
      connection,
      forUpdate: true,
    });

    const statusBundle = await resolveStatusBundle(connection);
    const now = new Date();
    const wasReceived = Boolean(ticket.nguoi_tiep_nhan_id || ticket.thoi_gian_tiep_nhan);

    await baoHongRepository.updatePhieuBaoHongById(ticket.phieu_bao_hong_id, {
      trang_thai: targetStatus,
      nguoi_dong_phieu_id: actor.nguoi_dung_id,
      thoi_gian_dong: now,
      ly_do_tu_choi_hoac_huy: payload.ly_do_tu_choi_hoac_huy,
    }, { connection });

    const maintenanceLog = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(ticket.phieu_bao_hong_id, {
      connection,
      forUpdate: true,
    });

    if (maintenanceLog && !maintenanceLog.ngay_hoan_thanh) {
      await baoHongRepository.updateNhatKyBaoTriById(maintenanceLog.nhat_ky_bao_tri_id, {
        ngay_hoan_thanh: now,
        thuc_hien_boi_id: actor.nguoi_dung_id,
      }, { connection });
    }

    if (wasReceived && isMaintenanceStatus(device)) {
      if (!statusBundle.inUseStatus) {
        throw new AppError('Không tìm thấy trạng thái thiết bị Đang sử dụng để hoàn tác', 500);
      }

      await updateDeviceStatusIfNeeded({
        connection,
        device,
        targetStatus: statusBundle.inUseStatus,
        actor,
        reason: `${actionName} phiếu báo hỏng ${ticket.ma_phieu}`,
        sourceType: `PHIEU_BAO_HONG_${targetStatus}`,
        sourceId: ticket.phieu_bao_hong_id,
      });
    }

    const updatedTicket = await ensureTicketExists(phieuBaoHongId, { connection });
    const updatedMaintenanceLog = await baoHongRepository.findLatestNhatKyBaoTriByPhieuId(phieuBaoHongId, {
      connection,
    });

    await writeSystemLog({
      connection,
      actor,
      action: `${targetStatus}_PHIEU_BAO_HONG`,
      entityId: ticket.phieu_bao_hong_id,
      oldData: ticket,
      newData: updatedTicket,
      note: `${actionName} phiếu báo hỏng ${updatedTicket.ma_phieu}`,
      ipAddress: context.ipAddress,
    });

    await connection.commit();
    return {
      ...mapPhieuBaoHong(updatedTicket),
      nhat_ky_bao_tri: mapNhatKyBaoTri(updatedMaintenanceLog),
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const tuChoiPhieuBaoHong = async (actor, phieuBaoHongId, payload, context = {}) => {
  return closeTicketWithoutCompletion(
    actor,
    phieuBaoHongId,
    payload,
    PHIEU_TRANG_THAI.TU_CHOI,
    'Từ chối',
    context,
  );
};

const huyPhieuBaoHong = async (actor, phieuBaoHongId, payload, context = {}) => {
  return closeTicketWithoutCompletion(
    actor,
    phieuBaoHongId,
    payload,
    PHIEU_TRANG_THAI.HUY,
    'Hủy',
    context,
  );
};

const getNhatKyBaoTriList = async (query) => {
  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    baoHongRepository.findNhatKyBaoTriList(normalizedQuery),
    baoHongRepository.countNhatKyBaoTri(normalizedQuery),
  ]);

  return {
    items: items.map(mapNhatKyBaoTri),
    pagination: {
      page: normalizedQuery.page,
      limit: normalizedQuery.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / normalizedQuery.limit) || 1,
    },
  };
};

module.exports = {
  createPhieuBaoHong,
  getPhieuBaoHongList,
  getPhieuBaoHongDetail,
  tiepNhanPhieuBaoHong,
  capNhatXuLyPhieuBaoHong,
  hoanThanhPhieuBaoHong,
  tuChoiPhieuBaoHong,
  huyPhieuBaoHong,
  getNhatKyBaoTriList,
};
