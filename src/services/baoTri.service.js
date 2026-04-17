const AppError = require('../utils/appError');
const baoTriRepository = require('../repositories/baoTri.repository');

const MODULE_NAME = 'BAO_TRI';
const ENTITY_NAME = 'nhat_ky_bao_tri';

const PHIEU_TRANG_THAI_HOAN_THANH = 'HOAN_THANH';

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
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch (_error) {
    return null;
  }
};

const mapNhatKyBaoTri = (row) => {
  if (!row) return null;

  return {
    nhat_ky_bao_tri_id: row.nhat_ky_bao_tri_id,
    loai_xu_ly: row.loai_xu_ly,
    ngay_tiep_nhan: row.ngay_tiep_nhan,
    ngay_hoan_thanh: row.ngay_hoan_thanh,
    noi_dung_xu_ly: row.noi_dung_xu_ly,
    chi_phi: row.chi_phi !== null && row.chi_phi !== undefined ? Number(row.chi_phi) : null,
    phu_tung_thay_the: parseJsonValue(row.phu_tung_thay_the),
    ket_qua_xu_ly: row.ket_qua_xu_ly,
    created_at: row.created_at,
    updated_at: row.updated_at,
    thiet_bi: {
      thiet_bi_id: row.thiet_bi_id,
      ma_tai_san: row.ma_tai_san,
      ten_thiet_bi: row.ten_thiet_bi,
      trang_thai_thiet_bi_id: row.trang_thai_thiet_bi_id,
      ma_trang_thai: row.ma_trang_thai_thiet_bi,
      ten_trang_thai: row.ten_trang_thai_thiet_bi,
    },
    phieu_bao_hong: row.phieu_bao_hong_id ? {
      phieu_bao_hong_id: row.phieu_bao_hong_id,
      ma_phieu: row.ma_phieu,
      trang_thai: row.trang_thai_phieu_bao_hong,
      mo_ta_su_co: row.mo_ta_su_co_phieu_bao_hong,
      thoi_gian_phat_hien: row.thoi_gian_phat_hien_su_co,
      thoi_gian_tiep_nhan: row.thoi_gian_tiep_nhan_phieu,
      thoi_gian_dong: row.thoi_gian_dong_phieu,
      nguoi_tao_id: row.nguoi_tao_phieu_id,
      ten_nguoi_tao: row.ten_nguoi_tao_phieu,
      nguoi_tiep_nhan_id: row.nguoi_tiep_nhan_phieu_id,
      ten_nguoi_tiep_nhan: row.ten_nguoi_tiep_nhan_phieu,
      nguoi_dong_phieu_id: row.nguoi_dong_phieu_id,
      ten_nguoi_dong_phieu: row.ten_nguoi_dong_phieu,
    } : null,
    don_vi_sua_chua: row.don_vi_sua_chua_id ? {
      don_vi_sua_chua_id: row.don_vi_sua_chua_id,
      ma_dvsc: row.ma_dvsc,
      ten_dvsc: row.ten_don_vi_sua_chua,
    } : null,
    nguoi_thuc_hien: row.thuc_hien_boi_id ? {
      thuc_hien_boi_id: row.thuc_hien_boi_id,
      ten_nguoi_thuc_hien: row.ten_nguoi_thuc_hien,
    } : null,
  };
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

const isMaintenanceStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('BAOTRI') || name.includes('BAOTRI');
};

const isDisposedStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('THANHLY') || name.includes('THANHLY');
};

const isLostStatus = (status) => {
  const code = normalizeText(status?.ma_trang_thai);
  const name = normalizeText(status?.ten_trang_thai);
  return code.includes('MATTHIEU') || name.includes('MATTHIEU');
};

const resolveStatusBundle = async (connection) => {
  const statuses = await baoTriRepository.findTrangThaiThietBiList({
    connection,
    activeOnly: true,
  });

  return {
    inUseStatus: statuses.find(isInUseStatus) || null,
    brokenStatus: statuses.find(isBrokenStatus) || null,
    maintenanceStatus: statuses.find(isMaintenanceStatus) || null,
    disposedStatus: statuses.find(isDisposedStatus) || null,
    lostStatus: statuses.find(isLostStatus) || null,
  };
};

const ensureThietBiExists = async (thietBiId, options = {}) => {
  const device = await baoTriRepository.findThietBiById(thietBiId, options);
  if (!device) {
    throw new AppError('Không tìm thấy thiết bị', 404);
  }
  return device;
};

const ensurePhieuBaoHongExists = async (phieuBaoHongId, options = {}) => {
  const ticket = await baoTriRepository.findPhieuBaoHongById(phieuBaoHongId, options);
  if (!ticket) {
    throw new AppError('Không tìm thấy phiếu báo hỏng', 404);
  }
  return ticket;
};

const ensureNhatKyBaoTriExists = async (nhatKyBaoTriId, options = {}) => {
  const maintenance = await baoTriRepository.findNhatKyBaoTriById(nhatKyBaoTriId, options);
  if (!maintenance) {
    throw new AppError('Không tìm thấy nhật ký bảo trì', 404);
  }
  return maintenance;
};

const ensureDonViSuaChuaExists = async (donViSuaChuaId, options = {}) => {
  if (donViSuaChuaId === null || donViSuaChuaId === undefined) return null;

  const donViSuaChua = await baoTriRepository.findDonViSuaChuaById(donViSuaChuaId, options);
  if (!donViSuaChua) {
    throw new AppError('don_vi_sua_chua_id không hợp lệ!', 400);
  }
  if (Number(donViSuaChua.is_active) !== 1) {
    throw new AppError('Đơn vđ9 sửa chữa đang không hoạt đđ"ng', 400);
  }

  return donViSuaChua;
};

const ensureNguoiDungExists = async (nguoiDungId, options = {}) => {
  if (nguoiDungId === null || nguoiDungId === undefined) return null;

  const user = await baoTriRepository.findNguoiDungById(nguoiDungId, options);
  if (!user) {
    throw new AppError('thuc_hien_boi_id không hợp lđ!', 400);
  }
  if (String(user.trang_thai_tai_khoan || '').toUpperCase() !== 'ACTIVE') {
    throw new AppError('Người thực hiđ!n đang không hoạt đđ"ng', 400);
  }
  return user;
};

const ensureTrangThaiThietBiExists = async (
  trangThaiThietBiId,
  {
    connection,
    requireActive = true,
  } = {},
) => {
  const status = await baoTriRepository.findTrangThaiThietBiById(trangThaiThietBiId, { connection });
  if (!status) {
    throw new AppError('trang_thai_thiet_bi_id không hợp lệ', 400);
  }
  if (requireActive && Number(status.is_active) !== 1) {
    throw new AppError('trang_thai_thiet_bi_id đang không hoạt động', 400);
  }
  return status;
};

const ensureManualMaintenanceAllowed = (device) => {
  if (isDisposedStatus(device)) {
    throw new AppError('Thiết bị đã thanh lý, không thỒ tiếp nhận bảo trì thủ công', 400);
  }
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
  await baoTriRepository.createSystemLog({
    nguoi_dung_id: actor?.nguoi_dung_id ?? null,
    module: MODULE_NAME,
    hanh_dong: action,
    entity_name: ENTITY_NAME,
    entity_id: entityId ?? null,
    du_lieu_cu: safeStringify(oldData),
    du_lieu_moi: safeStringify(newData),
    ghi_chu: note ?? null,
    ip_address: ipAddress ?? null,
  }, { connection });
};

const ensureNgayHoanThanhHopLe = (ngayTiepNhan, ngayHoanThanh) => {
  if (!ngayTiepNhan || !ngayHoanThanh) return;

  const startDate = new Date(ngayTiepNhan);
  const endDate = new Date(ngayHoanThanh);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return;

  if (endDate.getTime() < startDate.getTime()) {
    throw new AppError('ngay_hoan_thanh không được nhỏ hơn ngay_tiep_nhan', 400);
  }
};

const ensureDuDieuKienHoanTat = (maintenanceLog) => {
  const noiDungXuLy = String(maintenanceLog?.noi_dung_xu_ly || '').trim();
  const chiPhi = Number(maintenanceLog?.chi_phi);
  const ngayHoanThanh = maintenanceLog?.ngay_hoan_thanh;

  if (!noiDungXuLy) {
    throw new AppError('Không thể hoàn tất khi thiếu nội dung xử lý', 400);
  }
  if (!ngayHoanThanh) {
    throw new AppError('Không thỒ hoàn tất khi thiếu ngày hoàn thành', 400);
  }
  if (!Number.isFinite(chiPhi) || chiPhi < 0) {
    throw new AppError('Không thể hoàn tất khi chi phí không hợp lệ', 400);
  }
};

const determineFinalDeviceStatus = ({
  maintenanceLog,
  currentDevice,
  explicitStatus,
  statusBundle,
}) => {
  if (explicitStatus) return explicitStatus;

  const ketQua = normalizeText(maintenanceLog?.ket_qua_xu_ly);

  if (
    (ketQua.includes('KHONGSUADUOC')
      || ketQua.includes('KHONGKHACPHUC')
      || ketQua.includes('HONGNANG'))
    && statusBundle.brokenStatus
  ) {
    return statusBundle.brokenStatus;
  }

  if ((ketQua.includes('THANHLY') || ketQua.includes('THANHLI')) && statusBundle.disposedStatus) {
    return statusBundle.disposedStatus;
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
    throw new AppError('Không tìm thấy trạng thái thiết bị phù hợp đỒ hoàn tất bảo trì', 500);
  }

  return fallbackCurrentStatus;
};

const updateDeviceStatusIfNeeded = async ({
  connection,
  actor,
  device,
  targetStatus,
  sourceType,
  sourceId,
  reason,
}) => {
  const currentStatusId = Number(device.trang_thai_thiet_bi_id);
  const targetStatusId = Number(targetStatus?.trang_thai_thiet_bi_id);
  const currentStatus = {
    trang_thai_thiet_bi_id: device.trang_thai_thiet_bi_id,
    ma_trang_thai: device.ma_trang_thai,
    ten_trang_thai: device.ten_trang_thai,
  };

  if (!targetStatusId || currentStatusId === targetStatusId) {
    return false;
  }

  if (isDisposedStatus(currentStatus)) {
    return false;
  }

  await baoTriRepository.updateThietBiTrangThai(device.thiet_bi_id, {
    trang_thai_thiet_bi_id: targetStatusId,
    updated_by: actor?.nguoi_dung_id ?? null,
  }, { connection });

  await baoTriRepository.createDeviceStatusHistory({
    thiet_bi_id: device.thiet_bi_id,
    tu_trang_thai_id: currentStatusId,
    den_trang_thai_id: targetStatusId,
    loai_nguon_phat_sinh: sourceType,
    nguon_phat_sinh_id: sourceId,
    ly_do: reason,
    changed_by: actor?.nguoi_dung_id ?? null,
  }, { connection });

  return true;
};

const createNhatKyBaoTri = async (actor, payload, context = {}) => {
  const connection = await baoTriRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentDevice = await ensureThietBiExists(payload.thiet_bi_id, { connection, forUpdate: true });

    let linkedTicket = null;
    if (hasOwn(payload, 'phieu_bao_hong_id') && payload.phieu_bao_hong_id) {
      linkedTicket = await ensurePhieuBaoHongExists(payload.phieu_bao_hong_id, {
        connection,
        forUpdate: true,
      });

      if (Number(linkedTicket.thiet_bi_id) !== Number(payload.thiet_bi_id)) {
        throw new AppError('phieu_bao_hong_id không thuộc thiết bị đã chọn', 400);
      }
    }

    if (hasOwn(payload, 'don_vi_sua_chua_id')) {
      await ensureDonViSuaChuaExists(payload.don_vi_sua_chua_id, { connection });
    }

    let thucHienBoiId = actor?.nguoi_dung_id || null;
    if (hasOwn(payload, 'thuc_hien_boi_id')) {
      if (payload.thuc_hien_boi_id) {
        await ensureNguoiDungExists(payload.thuc_hien_boi_id, { connection });
        thucHienBoiId = payload.thuc_hien_boi_id;
      } else {
        thucHienBoiId = actor?.nguoi_dung_id || null;
      }
    }

    const createdId = await baoTriRepository.createNhatKyBaoTri({
      thiet_bi_id: payload.thiet_bi_id,
      phieu_bao_hong_id: linkedTicket?.phieu_bao_hong_id ?? null,
      loai_xu_ly: payload.loai_xu_ly,
      ngay_tiep_nhan: payload.ngay_tiep_nhan || linkedTicket?.thoi_gian_tiep_nhan || new Date(),
      noi_dung_xu_ly: hasOwn(payload, 'noi_dung_xu_ly') ? payload.noi_dung_xu_ly : null,
      chi_phi: hasOwn(payload, 'chi_phi') ? payload.chi_phi : 0,
      phu_tung_thay_the: hasOwn(payload, 'phu_tung_thay_the') ? payload.phu_tung_thay_the : null,
      don_vi_sua_chua_id: hasOwn(payload, 'don_vi_sua_chua_id') ? payload.don_vi_sua_chua_id : null,
      ket_qua_xu_ly: hasOwn(payload, 'ket_qua_xu_ly') ? payload.ket_qua_xu_ly : null,
      thuc_hien_boi_id: thucHienBoiId,
    }, { connection });

    if (!linkedTicket) {
      ensureManualMaintenanceAllowed(currentDevice);

      const statusBundle = await resolveStatusBundle(connection);
      if (!statusBundle.maintenanceStatus) {
        throw new AppError('Không tìm thấy trạng thái thiết bị đang bảo trì', 500);
      }

      await updateDeviceStatusIfNeeded({
        connection,
        actor,
        device: currentDevice,
        targetStatus: statusBundle.maintenanceStatus,
        sourceType: 'BAO_TRI_THU_CONG_TIEP_NHAN',
        sourceId: createdId,
        reason: 'Tiếp nhận bảo trì thủ công #' + createdId,
      });
    }

    const created = await ensureNhatKyBaoTriExists(createdId, { connection });

    await writeSystemLog({
      connection,
      actor,
      action: 'CREATE_NHAT_KY_BAO_TRI',
      entityId: createdId,
      oldData: null,
      newData: created,
      note: 'Tạo nhật ký bảo trì #' + createdId,
      ipAddress: context.ipAddress,
    });

    await connection.commit();
    return mapNhatKyBaoTri(created);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getNhatKyBaoTriList = async (query = {}) => {
  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    baoTriRepository.findNhatKyBaoTriList(normalizedQuery),
    baoTriRepository.countNhatKyBaoTri(normalizedQuery),
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

const getNhatKyBaoTriDetail = async (nhatKyBaoTriId) => {
  const detail = await ensureNhatKyBaoTriExists(nhatKyBaoTriId);
  return mapNhatKyBaoTri(detail);
};

const updateNhatKyBaoTri = async (actor, nhatKyBaoTriId, payload, context = {}) => {
  const connection = await baoTriRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentMaintenance = await ensureNhatKyBaoTriExists(nhatKyBaoTriId, {
      connection,
      forUpdate: true,
    });

    if (hasOwn(payload, 'don_vi_sua_chua_id')) {
      await ensureDonViSuaChuaExists(payload.don_vi_sua_chua_id, { connection });
    }

    let thucHienBoiId = undefined;
    if (hasOwn(payload, 'thuc_hien_boi_id')) {
      if (payload.thuc_hien_boi_id) {
        await ensureNguoiDungExists(payload.thuc_hien_boi_id, { connection });
        thucHienBoiId = payload.thuc_hien_boi_id;
      } else {
        thucHienBoiId = actor?.nguoi_dung_id || null;
      }
    }

    const nextNgayHoanThanh = hasOwn(payload, 'ngay_hoan_thanh')
      ? payload.ngay_hoan_thanh
      : currentMaintenance.ngay_hoan_thanh;
    ensureNgayHoanThanhHopLe(currentMaintenance.ngay_tiep_nhan, nextNgayHoanThanh);

    const updatePayload = {};
    if (hasOwn(payload, 'noi_dung_xu_ly')) updatePayload.noi_dung_xu_ly = payload.noi_dung_xu_ly;
    if (hasOwn(payload, 'chi_phi')) updatePayload.chi_phi = payload.chi_phi;
    if (hasOwn(payload, 'phu_tung_thay_the')) updatePayload.phu_tung_thay_the = payload.phu_tung_thay_the;
    if (hasOwn(payload, 'don_vi_sua_chua_id')) updatePayload.don_vi_sua_chua_id = payload.don_vi_sua_chua_id;
    if (hasOwn(payload, 'ket_qua_xu_ly')) updatePayload.ket_qua_xu_ly = payload.ket_qua_xu_ly;
    if (hasOwn(payload, 'ngay_hoan_thanh')) updatePayload.ngay_hoan_thanh = payload.ngay_hoan_thanh;
    if (thucHienBoiId !== undefined) updatePayload.thuc_hien_boi_id = thucHienBoiId;

    if (!Object.keys(updatePayload).length) {
      throw new AppError('Không có dữ liđ!u hợp lđ! đỒ cập nhật', 400);
    }

    await baoTriRepository.updateNhatKyBaoTriById(nhatKyBaoTriId, updatePayload, { connection });
    const updatedMaintenance = await ensureNhatKyBaoTriExists(nhatKyBaoTriId, { connection });

    await writeSystemLog({
      connection,
      actor,
      action: 'UPDATE_NHAT_KY_BAO_TRI',
      entityId: nhatKyBaoTriId,
      oldData: currentMaintenance,
      newData: updatedMaintenance,
      note: `Cập nhật nhật ký bảo trì #${nhatKyBaoTriId}`,
      ipAddress: context.ipAddress,
    });

    await connection.commit();
    return mapNhatKyBaoTri(updatedMaintenance);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const completeNhatKyBaoTri = async (actor, nhatKyBaoTriId, payload, context = {}) => {
  const connection = await baoTriRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentMaintenance = await ensureNhatKyBaoTriExists(nhatKyBaoTriId, {
      connection,
      forUpdate: true,
    });
    const currentDevice = await ensureThietBiExists(currentMaintenance.thiet_bi_id, {
      connection,
      forUpdate: true,
    });

    let currentTicket = null;
    if (currentMaintenance.phieu_bao_hong_id) {
      currentTicket = await ensurePhieuBaoHongExists(currentMaintenance.phieu_bao_hong_id, {
        connection,
        forUpdate: true,
      });
    }

    if (hasOwn(payload, 'don_vi_sua_chua_id')) {
      await ensureDonViSuaChuaExists(payload.don_vi_sua_chua_id, { connection });
    }

    let thucHienBoiId = actor?.nguoi_dung_id || null;
    if (hasOwn(payload, 'thuc_hien_boi_id')) {
      if (payload.thuc_hien_boi_id) {
        await ensureNguoiDungExists(payload.thuc_hien_boi_id, { connection });
        thucHienBoiId = payload.thuc_hien_boi_id;
      } else {
        thucHienBoiId = actor?.nguoi_dung_id || null;
      }
    }

    let explicitStatus = null;
    if (hasOwn(payload, 'trang_thai_thiet_bi_id') && payload.trang_thai_thiet_bi_id) {
      explicitStatus = await ensureTrangThaiThietBiExists(payload.trang_thai_thiet_bi_id, {
        connection,
        requireActive: true,
      });
    }

    const updatePayload = {};
    if (hasOwn(payload, 'noi_dung_xu_ly')) updatePayload.noi_dung_xu_ly = payload.noi_dung_xu_ly;
    if (hasOwn(payload, 'chi_phi')) updatePayload.chi_phi = payload.chi_phi;
    if (hasOwn(payload, 'phu_tung_thay_the')) updatePayload.phu_tung_thay_the = payload.phu_tung_thay_the;
    if (hasOwn(payload, 'don_vi_sua_chua_id')) updatePayload.don_vi_sua_chua_id = payload.don_vi_sua_chua_id;
    if (hasOwn(payload, 'ket_qua_xu_ly')) updatePayload.ket_qua_xu_ly = payload.ket_qua_xu_ly;
    if (hasOwn(payload, 'ngay_hoan_thanh')) {
      updatePayload.ngay_hoan_thanh = payload.ngay_hoan_thanh;
    } else {
      updatePayload.ngay_hoan_thanh = new Date();
    }
    updatePayload.thuc_hien_boi_id = thucHienBoiId;

    ensureNgayHoanThanhHopLe(currentMaintenance.ngay_tiep_nhan, updatePayload.ngay_hoan_thanh);

    await baoTriRepository.updateNhatKyBaoTriById(nhatKyBaoTriId, updatePayload, { connection });
    const updatedMaintenance = await ensureNhatKyBaoTriExists(nhatKyBaoTriId, { connection });
    ensureNgayHoanThanhHopLe(updatedMaintenance.ngay_tiep_nhan, updatedMaintenance.ngay_hoan_thanh);
    ensureDuDieuKienHoanTat(updatedMaintenance);

    if (currentTicket) {
      await baoTriRepository.updatePhieuBaoHongById(currentTicket.phieu_bao_hong_id, {
        trang_thai: PHIEU_TRANG_THAI_HOAN_THANH,
        nguoi_dong_phieu_id: actor?.nguoi_dung_id || null,
        thoi_gian_dong: updatedMaintenance.ngay_hoan_thanh || new Date(),
      }, { connection });
    }

    const statusBundle = await resolveStatusBundle(connection);
    const finalDeviceStatus = determineFinalDeviceStatus({
      maintenanceLog: updatedMaintenance,
      currentDevice,
      explicitStatus,
      statusBundle,
    });

    const deviceStatusChanged = await updateDeviceStatusIfNeeded({
      connection,
      actor,
      device: currentDevice,
      targetStatus: finalDeviceStatus,
      sourceType: 'BAO_TRI_HOAN_THANH',
      sourceId: nhatKyBaoTriId,
      reason: `Hoàn tất nhật ký bảo trì #${nhatKyBaoTriId}`,
    });

    const latestMaintenance = await ensureNhatKyBaoTriExists(nhatKyBaoTriId, { connection });
    const latestTicket = latestMaintenance.phieu_bao_hong_id
      ? await ensurePhieuBaoHongExists(latestMaintenance.phieu_bao_hong_id, { connection })
      : null;

    await writeSystemLog({
      connection,
      actor,
      action: 'HOAN_TAT_NHAT_KY_BAO_TRI',
      entityId: nhatKyBaoTriId,
      oldData: {
        nhat_ky_bao_tri: currentMaintenance,
        phieu_bao_hong: currentTicket,
        thiet_bi: currentDevice,
      },
      newData: {
        nhat_ky_bao_tri: latestMaintenance,
        phieu_bao_hong: latestTicket,
        cap_nhat_trang_thai_thiet_bi: deviceStatusChanged,
      },
      note: `Hoàn tất nhật ký bảo trì #${nhatKyBaoTriId}`,
      ipAddress: context.ipAddress,
    });

    if (deviceStatusChanged) {
      await writeSystemLog({
        connection,
        actor,
        action: 'CAP_NHAT_TRANG_THAI_THIET_BI_TU_BAO_TRI',
        entityId: nhatKyBaoTriId,
        oldData: {
          thiet_bi_id: currentDevice.thiet_bi_id,
          trang_thai_thiet_bi_id: currentDevice.trang_thai_thiet_bi_id,
          ma_trang_thai: currentDevice.ma_trang_thai,
          ten_trang_thai: currentDevice.ten_trang_thai,
        },
        newData: {
          thiet_bi_id: currentDevice.thiet_bi_id,
          trang_thai_thiet_bi_id: finalDeviceStatus.trang_thai_thiet_bi_id,
          ma_trang_thai: finalDeviceStatus.ma_trang_thai,
          ten_trang_thai: finalDeviceStatus.ten_trang_thai,
        },
        note: `Đđng bđ" trạng thái thiết bị khi hoàn tất bảo trì #${nhatKyBaoTriId}`,
        ipAddress: context.ipAddress,
      });
    }

    await connection.commit();

    return {
      ...mapNhatKyBaoTri(latestMaintenance),
      phieu_bao_hong_cap_nhat: latestTicket ? {
        phieu_bao_hong_id: latestTicket.phieu_bao_hong_id,
        ma_phieu: latestTicket.ma_phieu,
        trang_thai: latestTicket.trang_thai,
        nguoi_dong_phieu_id: latestTicket.nguoi_dong_phieu_id,
        thoi_gian_dong: latestTicket.thoi_gian_dong,
      } : null,
      cap_nhat_trang_thai_thiet_bi: deviceStatusChanged,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getLichSuBaoTriTheoThietBi = async (thietBiId, query = {}) => {
  await ensureThietBiExists(thietBiId);

  const normalizedQuery = {
    ...query,
    thiet_bi_id: thietBiId,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    baoTriRepository.findNhatKyBaoTriList(normalizedQuery),
    baoTriRepository.countNhatKyBaoTri(normalizedQuery),
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

const getDanhSachBaoTriTheoPhieuBaoHong = async (phieuBaoHongId, query = {}) => {
  await ensurePhieuBaoHongExists(phieuBaoHongId);

  const normalizedQuery = {
    ...query,
    phieu_bao_hong_id: phieuBaoHongId,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    baoTriRepository.findNhatKyBaoTriList(normalizedQuery),
    baoTriRepository.countNhatKyBaoTri(normalizedQuery),
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

const tiepNhanBaoTriThuCong = async (actor, payload, context = {}) => {
  if (hasOwn(payload, 'phieu_bao_hong_id') && payload.phieu_bao_hong_id) {
    throw new AppError('API này chđ0 dùng cho tiếp nhận bảo trì thủ công, không gắn vđ:i phiếu báo hỏng', 400);
  }

  return createNhatKyBaoTri(actor, payload, context);
};

module.exports = {
  tiepNhanBaoTriThuCong,
  createNhatKyBaoTri,
  getNhatKyBaoTriList,
  getNhatKyBaoTriDetail,
  updateNhatKyBaoTri,
  completeNhatKyBaoTri,
  getLichSuBaoTriTheoThietBi,
  getDanhSachBaoTriTheoPhieuBaoHong,
};


