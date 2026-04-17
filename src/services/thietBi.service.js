const AppError = require('../utils/appError');
const { writeAuditLog } = require('./auditLog.service');
const thietBiRepository = require('../repositories/thietBi.repository');
const { generateNextAssetCode } = require('../utils/codeGenerator');

const MODULE_NAME = 'THIET_BI';
const ENTITY_NAME = 'thiet_bi';
const MAX_CREATE_RETRIES = 5;
const TRANSFER_OPERATION_TYPES = {
  CAP_PHAT: 'CAP_PHAT',
  BAN_GIAO: 'BAN_GIAO',
  DIEU_CHUYEN: 'DIEU_CHUYEN',
  THU_HOI: 'THU_HOI',
};

const isMysqlDuplicateKeyError = (error) => {
  return Number(error?.errno) === 1062 || String(error?.code || '').toUpperCase() === 'ER_DUP_ENTRY';
};

const getDuplicateFieldName = (error) => {
  const message = String(error?.sqlMessage || error?.message || '');
  if (message.includes('uq_thiet_bi_serial') || message.includes('so_serial')) return 'so_serial';
  if (message.includes('ma_tai_san')) return 'ma_tai_san';
  return null;
};

const toDateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
};

const assertPurchaseDateAndWarranty = ({ ngayMua, ngayHetBaoHanh }) => {
  const normalizedNgayMua = toDateOnly(ngayMua);
  const normalizedNgayHetBaoHanh = toDateOnly(ngayHetBaoHanh);

  if (normalizedNgayMua) {
    const today = new Date().toISOString().slice(0, 10);
    if (normalizedNgayMua > today) {
      throw new AppError('ngay_mua kh�ng ��c l�n h�n ng�y hi�n t�i', 400);
    }
  }

  if (normalizedNgayMua && normalizedNgayHetBaoHanh && normalizedNgayHetBaoHanh < normalizedNgayMua) {
    throw new AppError('ngay_het_bao_hanh kh�ng ��c nh� h�n ngay_mua', 400);
  }
};

const normalizeStatusText = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(//g, 'd')
    .replace(//g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
};

const isDisposedStatus = (status) => {
  const code = normalizeStatusText(status?.ma_trang_thai);
  const name = normalizeStatusText(status?.ten_trang_thai);
  return code.includes('THANHLY') || name.includes('THANHLY');
};

const isMaintenanceStatus = (status) => {
  const code = normalizeStatusText(status?.ma_trang_thai);
  const name = normalizeStatusText(status?.ten_trang_thai);
  return code.includes('BAOTRI') || name.includes('BAOTRI');
};

const hasInUseStatus = (status) => {
  const code = normalizeStatusText(status?.ma_trang_thai);
  const name = normalizeStatusText(status?.ten_trang_thai);
  return code.includes('DANGSUDUNG') || name.includes('DANGSUDUNG');
};

const toNullableNumber = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const isSameNullableId = (firstValue, secondValue) => {
  return toNullableNumber(firstValue) === toNullableNumber(secondValue);
};

const ensureDeviceExists = async (thietBiId, options = {}) => {
  const device = await thietBiRepository.findDeviceRecordById(thietBiId, options);
  if (!device) {
    throw new AppError('Kh�ng t�m th�y thi�t b�', 404);
  }

  return device;
};

const ensureLoaiThietBiExists = async (loaiThietBiId, options = {}) => {
  const loaiThietBi = await thietBiRepository.findLoaiThietBiById(loaiThietBiId, options);
  if (!loaiThietBi) {
    throw new AppError('loai_thiet_bi_id kh�ng t�n t�i', 400);
  }

  return loaiThietBi;
};

const ensureHangSanXuatExists = async (hangSanXuatId, options = {}) => {
  if (hangSanXuatId === null || hangSanXuatId === undefined) return null;

  const row = await thietBiRepository.findHangSanXuatById(hangSanXuatId, options);
  if (!row) {
    throw new AppError('hang_san_xuat_id kh�ng t�n t�i', 400);
  }

  return row;
};

const ensureNhaCungCapExists = async (nhaCungCapId, options = {}) => {
  if (nhaCungCapId === null || nhaCungCapId === undefined) return null;

  const row = await thietBiRepository.findNhaCungCapById(nhaCungCapId, options);
  if (!row) {
    throw new AppError('nha_cung_cap_id kh�ng t�n t�i', 400);
  }

  return row;
};

const ensureDonViExists = async (donViId, options = {}) => {
  if (donViId === null || donViId === undefined) return null;

  const row = await thietBiRepository.findDonViById(donViId, options);
  if (!row) {
    throw new AppError('don_vi_hien_tai_id kh�ng t�n t�i', 400);
  }

  return row;
};

const ensureNguoiPhuTrachExists = async (nguoiPhuTrachId, options = {}) => {
  if (nguoiPhuTrachId === null || nguoiPhuTrachId === undefined) return null;

  const row = await thietBiRepository.findNguoiDungById(nguoiPhuTrachId, options);
  if (!row) {
    throw new AppError('nguoi_phu_trach_id kh�ng t�n t�i', 400);
  }

  return row;
};

const ensureTrangThaiExists = async (trangThaiId, options = {}) => {
  const { requireActive = true } = options;
  const row = await thietBiRepository.findTrangThaiById(trangThaiId, options);
  if (!row) {
    throw new AppError('trang_thai_thiet_bi_id kh�ng t�n t�i', 400);
  }
  if (requireActive && Number(row.is_active) !== 1) {
    throw new AppError('trang_thai_thiet_bi_id ang kh�ng ho�t �ng', 400);
  }

  return row;
};

const ensureTransferTargetExists = async (payload, options = {}) => {
  if (payload.den_don_vi_id !== undefined && payload.den_don_vi_id !== null) {
    const donVi = await thietBiRepository.findDonViById(payload.den_don_vi_id, options);
    if (!donVi || Number(donVi.is_active) !== 1) {
      throw new AppError('�n v� �ch kh�ng h�p l�', 400);
    }
  }

  if (payload.den_nguoi_phu_trach_id !== undefined && payload.den_nguoi_phu_trach_id !== null) {
    const nguoiPhuTrach = await thietBiRepository.findNguoiDungById(payload.den_nguoi_phu_trach_id, options);
    if (!nguoiPhuTrach) {
      throw new AppError('Ng��i ph� tr�ch �ch kh�ng h�p l�', 400);
    }

    const accountStatus = String(nguoiPhuTrach.trang_thai_tai_khoan || '').trim().toUpperCase();
    if (accountStatus !== 'ACTIVE') {
      throw new AppError('Ng��i ph� tr�ch �ch kh�ng c�n ho�t �ng', 400);
    }
  }
};

const resolveTargetAssignment = (currentDevice, payload, operationType) => {
  const hasDestinationDonVi = payload.den_don_vi_id !== undefined;
  const hasDestinationNguoiPhuTrach = payload.den_nguoi_phu_trach_id !== undefined;

  const nextDonViId = operationType === TRANSFER_OPERATION_TYPES.THU_HOI
    ? (hasDestinationDonVi ? payload.den_don_vi_id : null)
    : (hasDestinationDonVi ? payload.den_don_vi_id : currentDevice.don_vi_hien_tai_id);

  const nextNguoiPhuTrachId = operationType === TRANSFER_OPERATION_TYPES.THU_HOI
    ? (hasDestinationNguoiPhuTrach ? payload.den_nguoi_phu_trach_id : null)
    : (hasDestinationNguoiPhuTrach ? payload.den_nguoi_phu_trach_id : currentDevice.nguoi_phu_trach_id);

  const isDestinationUnchanged = isSameNullableId(nextDonViId, currentDevice.don_vi_hien_tai_id)
    && isSameNullableId(nextNguoiPhuTrachId, currentDevice.nguoi_phu_trach_id);

  if (isDestinationUnchanged) {
    throw new AppError('D� li�u �ch tr�ng ho�n to�n v�i d� li�u hi�n t�i', 400);
  }

  return {
    nextDonViId,
    nextNguoiPhuTrachId,
  };
};

const getTransferSuccessMessage = (operationType) => {
  if (operationType === TRANSFER_OPERATION_TYPES.CAP_PHAT) return 'C�p ph�t thi�t b� th�nh c�ng';
  if (operationType === TRANSFER_OPERATION_TYPES.BAN_GIAO) return 'B�n giao thi�t b� th�nh c�ng';
  if (operationType === TRANSFER_OPERATION_TYPES.DIEU_CHUYEN) return 'i�u chuy�n thi�t b� th�nh c�ng';
  return 'Thu h�i thi�t b� th�nh c�ng';
};

const getTransferOperationLabel = (operationType) => {
  if (operationType === TRANSFER_OPERATION_TYPES.CAP_PHAT) return 'c�p ph�t';
  if (operationType === TRANSFER_OPERATION_TYPES.BAN_GIAO) return 'b�n giao';
  if (operationType === TRANSFER_OPERATION_TYPES.DIEU_CHUYEN) return 'i�u chuy�n';
  return 'thu h�i';
};

const ensureDisposedStatusIsImmutable = (currentStatus, nextStatus) => {
  if (
    isDisposedStatus(currentStatus)
    && Number(currentStatus?.trang_thai_thiet_bi_id) !== Number(nextStatus?.trang_thai_thiet_bi_id)
  ) {
    throw new AppError('Thi�t b� � thanh l�, kh�ng ��c chuy�n sang tr�ng th�i kh�c', 400);
  }
};

const ensureTransferOperationAllowed = (currentStatus, operationType) => {
  if (isDisposedStatus(currentStatus)) {
    throw new AppError('Thi�t b� � thanh l�, kh�ng th� thao t�c', 400);
  }

  if (isMaintenanceStatus(currentStatus)) {
    throw new AppError(`Thi�t b� ang b�o tr�, kh�ng th� ${getTransferOperationLabel(operationType)}`, 400);
  }
};

const ensureSerialUnique = async (soSerial, options = {}) => {
  if (!soSerial) return;

  const exists = await thietBiRepository.existsSerial(soSerial, options);
  if (exists) {
    throw new AppError('so_serial � t�n t�i', 409);
  }
};

const ensureForeignKeysForCreate = async (payload, options = {}) => {
  const [loaiThietBi] = await Promise.all([
    ensureLoaiThietBiExists(payload.loai_thiet_bi_id, options),
    ensureHangSanXuatExists(payload.hang_san_xuat_id, options),
    ensureNhaCungCapExists(payload.nha_cung_cap_id, options),
    ensureDonViExists(payload.don_vi_hien_tai_id, options),
    ensureNguoiPhuTrachExists(payload.nguoi_phu_trach_id, options),
    ensureTrangThaiExists(payload.trang_thai_thiet_bi_id, options),
  ]);

  return { loaiThietBi };
};

const ensureForeignKeysForUpdate = async (payload, options = {}) => {
  const tasks = [];

  if (Object.prototype.hasOwnProperty.call(payload, 'loai_thiet_bi_id')) {
    tasks.push(ensureLoaiThietBiExists(payload.loai_thiet_bi_id, options));
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'hang_san_xuat_id')) {
    tasks.push(ensureHangSanXuatExists(payload.hang_san_xuat_id, options));
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'nha_cung_cap_id')) {
    tasks.push(ensureNhaCungCapExists(payload.nha_cung_cap_id, options));
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'don_vi_hien_tai_id')) {
    tasks.push(ensureDonViExists(payload.don_vi_hien_tai_id, options));
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'nguoi_phu_trach_id')) {
    tasks.push(ensureNguoiPhuTrachExists(payload.nguoi_phu_trach_id, options));
  }

  await Promise.all(tasks);
};

const mapDuplicateDatabaseError = (error) => {
  if (!isMysqlDuplicateKeyError(error)) return null;

  const duplicateField = getDuplicateFieldName(error);
  if (duplicateField === 'so_serial') {
    return new AppError('so_serial � t�n t�i', 409);
  }
  if (duplicateField === 'ma_tai_san') {
    return new AppError('Kh�ng th� t�o ma_tai_san duy nh�t, vui l�ng th� l�i', 409);
  }

  return new AppError('D� li�u b� tr�ng v�i b�n ghi kh�c', 409);
};

const createDeviceOnce = async (actor, payload, context = {}) => {
  const connection = await thietBiRepository.getConnection();

  try {
    await connection.beginTransaction();

    const { loaiThietBi } = await ensureForeignKeysForCreate(payload, { connection });
    await ensureSerialUnique(payload.so_serial, { connection });
    assertPurchaseDateAndWarranty({
      ngayMua: payload.ngay_mua,
      ngayHetBaoHanh: payload.ngay_het_bao_hanh,
    });

    const maTaiSan = await generateNextAssetCode({
      connection,
      maVietTat: loaiThietBi.ma_viet_tat,
    });

    const thietBiId = await thietBiRepository.createDevice({
      ...payload,
      ma_tai_san: maTaiSan,
      created_by: actor.nguoi_dung_id,
      updated_by: actor.nguoi_dung_id,
    }, { connection });

    await thietBiRepository.createStatusHistory({
      thiet_bi_id: thietBiId,
      tu_trang_thai_id: null,
      den_trang_thai_id: payload.trang_thai_thiet_bi_id,
      loai_nguon_phat_sinh: 'TAO_MOI',
      nguon_phat_sinh_id: thietBiId,
      ly_do: 'Kh�i t�o thi�t b� m�i',
      changed_by: actor.nguoi_dung_id,
    }, { connection });

    const createdDevice = await thietBiRepository.findDeviceById(thietBiId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor.nguoi_dung_id,
      module: MODULE_NAME,
      hanh_dong: 'CREATE_DEVICE',
      entity_name: ENTITY_NAME,
      entity_id: thietBiId,
      du_lieu_moi: createdDevice,
      ghi_chu: `T�o thi�t b� ${createdDevice?.ma_tai_san || ''}`.trim(),
      ip_address: context.ipAddress,
    });

    return createdDevice;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const createDevice = async (actor, payload, context = {}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_CREATE_RETRIES; attempt += 1) {
    try {
      return await createDeviceOnce(actor, payload, context);
    } catch (error) {
      const mappedError = mapDuplicateDatabaseError(error);
      if (mappedError && getDuplicateFieldName(error) === 'so_serial') {
        throw mappedError;
      }

      if (
        mappedError
        && getDuplicateFieldName(error) === 'ma_tai_san'
        && attempt < MAX_CREATE_RETRIES
      ) {
        lastError = mappedError;
        continue;
      }

      throw mappedError || error;
    }
  }

  throw lastError || new AppError('Kh�ng th� t�o thi�t b� do l�i sinh m� t�i s�n', 500);
};

const getDevices = async (query) => {
  const [items, totalItems] = await Promise.all([
    thietBiRepository.findDevices(query),
    thietBiRepository.countDevices(query),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages: Math.ceil(totalItems / query.limit) || 1,
    },
  };
};

const getDeviceById = async (thietBiId) => {
  const device = await thietBiRepository.findDeviceById(thietBiId);
  if (!device) {
    throw new AppError('Kh�ng t�m th�y thi�t b�', 404);
  }

  return device;
};

const updateDevice = async (actor, thietBiId, payload, context = {}) => {
  if (Object.prototype.hasOwnProperty.call(payload, 'ma_tai_san')) {
    throw new AppError('Kh�ng ��c c�p nh�t ma_tai_san', 400);
  }
  if (Object.prototype.hasOwnProperty.call(payload, 'trang_thai_thiet_bi_id')) {
    throw new AppError('Kh�ng ��c c�p nh�t trang_thai_thiet_bi_id � API n�y', 400);
  }

  const connection = await thietBiRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentDevice = await ensureDeviceExists(thietBiId, {
      connection,
      forUpdate: true,
    });

    await ensureForeignKeysForUpdate(payload, { connection });

    if (Object.prototype.hasOwnProperty.call(payload, 'so_serial')) {
      await ensureSerialUnique(payload.so_serial, {
        connection,
        excludeDeviceId: thietBiId,
      });
    }

    const mergedNgayMua = Object.prototype.hasOwnProperty.call(payload, 'ngay_mua')
      ? payload.ngay_mua
      : currentDevice.ngay_mua;
    const mergedNgayHetBaoHanh = Object.prototype.hasOwnProperty.call(payload, 'ngay_het_bao_hanh')
      ? payload.ngay_het_bao_hanh
      : currentDevice.ngay_het_bao_hanh;

    assertPurchaseDateAndWarranty({
      ngayMua: mergedNgayMua,
      ngayHetBaoHanh: mergedNgayHetBaoHanh,
    });

    await thietBiRepository.updateDeviceById(thietBiId, {
      ...payload,
      updated_by: actor.nguoi_dung_id,
    }, { connection });

    const updatedDevice = await thietBiRepository.findDeviceById(thietBiId, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor.nguoi_dung_id,
      module: MODULE_NAME,
      hanh_dong: 'UPDATE_DEVICE',
      entity_name: ENTITY_NAME,
      entity_id: thietBiId,
      du_lieu_cu: currentDevice,
      du_lieu_moi: updatedDevice,
      ghi_chu: `C�p nh�t thi�t b� ${updatedDevice?.ma_tai_san || ''}`.trim(),
      ip_address: context.ipAddress,
    });

    return updatedDevice;
  } catch (error) {
    await connection.rollback();
    const mappedError = mapDuplicateDatabaseError(error);
    throw mappedError || error;
  } finally {
    connection.release();
  }
};

const updateDeviceStatus = async (actor, thietBiId, payload, context = {}) => {
  const connection = await thietBiRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentDevice = await ensureDeviceExists(thietBiId, {
      connection,
      forUpdate: true,
    });
    const newStatus = await ensureTrangThaiExists(payload.trang_thai_thiet_bi_id, { connection, requireActive: true });
    const oldStatus = await ensureTrangThaiExists(currentDevice.trang_thai_thiet_bi_id, { connection, requireActive: false });

    if (Number(currentDevice.trang_thai_thiet_bi_id) === Number(newStatus.trang_thai_thiet_bi_id)) {
      const unchangedDevice = await thietBiRepository.findDeviceById(thietBiId, { connection });
      await connection.commit();

      return {
        changed: false,
        device: unchangedDevice,
      };
    }

    ensureDisposedStatusIsImmutable(oldStatus, newStatus);

    await thietBiRepository.updateDeviceStatus(thietBiId, {
      trang_thai_thiet_bi_id: newStatus.trang_thai_thiet_bi_id,
      updated_by: actor.nguoi_dung_id,
    }, { connection });

    await thietBiRepository.createStatusHistory({
      thiet_bi_id: thietBiId,
      tu_trang_thai_id: oldStatus.trang_thai_thiet_bi_id,
      den_trang_thai_id: newStatus.trang_thai_thiet_bi_id,
      loai_nguon_phat_sinh: 'CAP_NHAT_TRANG_THAI',
      nguon_phat_sinh_id: thietBiId,
      ly_do: payload.ly_do || 'C�p nh�t tr�ng th�i thi�t b�',
      changed_by: actor.nguoi_dung_id,
    }, { connection });

    const updatedDevice = await thietBiRepository.findDeviceById(thietBiId, { connection });
    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor.nguoi_dung_id,
      module: MODULE_NAME,
      hanh_dong: 'UPDATE_DEVICE_STATUS',
      entity_name: ENTITY_NAME,
      entity_id: thietBiId,
      du_lieu_cu: {
        trang_thai_thiet_bi_id: oldStatus.trang_thai_thiet_bi_id,
        ma_trang_thai: oldStatus.ma_trang_thai,
        ten_trang_thai: oldStatus.ten_trang_thai,
      },
      du_lieu_moi: {
        trang_thai_thiet_bi_id: newStatus.trang_thai_thiet_bi_id,
        ma_trang_thai: newStatus.ma_trang_thai,
        ten_trang_thai: newStatus.ten_trang_thai,
        ly_do: payload.ly_do || null,
      },
      ghi_chu: payload.ly_do || 'C�p nh�t tr�ng th�i thi�t b�',
      ip_address: context.ipAddress,
    });

    return {
      changed: true,
      device: updatedDevice,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const executeTransferOperation = async (actor, payload, operationType, context = {}) => {
  const connection = await thietBiRepository.getConnection();

  try {
    await connection.beginTransaction();

    const currentDevice = await ensureDeviceExists(payload.thiet_bi_id, {
      connection,
      forUpdate: true,
    });

    const currentStatus = await ensureTrangThaiExists(currentDevice.trang_thai_thiet_bi_id, {
      connection,
      requireActive: false,
    });

    ensureTransferOperationAllowed(currentStatus, operationType);

    await ensureTransferTargetExists(payload, { connection });

    const { nextDonViId, nextNguoiPhuTrachId } = resolveTargetAssignment(
      currentDevice,
      payload,
      operationType,
    );

    await thietBiRepository.updateDeviceById(payload.thiet_bi_id, {
      don_vi_hien_tai_id: nextDonViId,
      nguoi_phu_trach_id: nextNguoiPhuTrachId,
      updated_by: actor.nguoi_dung_id,
    }, { connection });

    let finalStatus = currentStatus;
    if (
      operationType !== TRANSFER_OPERATION_TYPES.THU_HOI
      && (nextDonViId !== null || nextNguoiPhuTrachId !== null)
      && !hasInUseStatus(currentStatus)
    ) {
      const inUseStatus = await thietBiRepository.findDangSuDungStatus({ connection });

      if (inUseStatus && Number(inUseStatus.trang_thai_thiet_bi_id) !== Number(currentStatus.trang_thai_thiet_bi_id)) {
        await thietBiRepository.updateDeviceStatus(payload.thiet_bi_id, {
          trang_thai_thiet_bi_id: inUseStatus.trang_thai_thiet_bi_id,
          updated_by: actor.nguoi_dung_id,
        }, { connection });

        await thietBiRepository.createStatusHistory({
          thiet_bi_id: payload.thiet_bi_id,
          tu_trang_thai_id: currentStatus.trang_thai_thiet_bi_id,
          den_trang_thai_id: inUseStatus.trang_thai_thiet_bi_id,
          loai_nguon_phat_sinh: 'CAP_PHAT_BAN_GIAO_DIEU_CHUYEN',
          nguon_phat_sinh_id: payload.thiet_bi_id,
          ly_do: payload.ly_do || getTransferSuccessMessage(operationType),
          changed_by: actor.nguoi_dung_id,
        }, { connection });

        finalStatus = inUseStatus;
      }
    }

    const historyId = await thietBiRepository.createTransferHistory({
      thiet_bi_id: payload.thiet_bi_id,
      loai_nghiep_vu: operationType,
      tu_don_vi_id: currentDevice.don_vi_hien_tai_id,
      den_don_vi_id: nextDonViId,
      tu_nguoi_phu_trach_id: currentDevice.nguoi_phu_trach_id,
      den_nguoi_phu_trach_id: nextNguoiPhuTrachId,
      ly_do: payload.ly_do ?? null,
      ghi_chu: payload.ghi_chu ?? null,
      thoi_gian_thuc_hien: payload.thoi_gian_thuc_hien || new Date(),
      created_by: actor.nguoi_dung_id,
    }, { connection });

    const updatedDevice = await thietBiRepository.findDeviceById(payload.thiet_bi_id, { connection });

    await connection.commit();

    await writeAuditLog({
      nguoi_dung_id: actor.nguoi_dung_id,
      module: MODULE_NAME,
      hanh_dong: operationType,
      entity_name: ENTITY_NAME,
      entity_id: payload.thiet_bi_id,
      du_lieu_cu: {
        don_vi_hien_tai_id: currentDevice.don_vi_hien_tai_id,
        nguoi_phu_trach_id: currentDevice.nguoi_phu_trach_id,
        trang_thai_thiet_bi_id: currentStatus.trang_thai_thiet_bi_id,
      },
      du_lieu_moi: {
        don_vi_hien_tai_id: nextDonViId,
        nguoi_phu_trach_id: nextNguoiPhuTrachId,
        trang_thai_thiet_bi_id: finalStatus.trang_thai_thiet_bi_id,
        lich_su_id: historyId,
      },
      ghi_chu: getTransferSuccessMessage(operationType),
      ip_address: context.ipAddress,
    });

    return {
      device: updatedDevice,
      history_id: historyId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const capPhatThietBi = async (actor, payload, context = {}) => {
  return executeTransferOperation(actor, payload, TRANSFER_OPERATION_TYPES.CAP_PHAT, context);
};

const banGiaoThietBi = async (actor, payload, context = {}) => {
  return executeTransferOperation(actor, payload, TRANSFER_OPERATION_TYPES.BAN_GIAO, context);
};

const dieuChuyenThietBi = async (actor, payload, context = {}) => {
  return executeTransferOperation(actor, payload, TRANSFER_OPERATION_TYPES.DIEU_CHUYEN, context);
};

const thuHoiThietBi = async (actor, payload, context = {}) => {
  return executeTransferOperation(actor, payload, TRANSFER_OPERATION_TYPES.THU_HOI, context);
};

const getTransferHistory = async (query) => {
  const normalizedQuery = {
    ...query,
    page: Number(query.page) > 0 ? Number(query.page) : 1,
    limit: Number(query.limit) > 0 ? Number(query.limit) : 20,
  };

  const [items, totalItems] = await Promise.all([
    thietBiRepository.findTransferHistory(normalizedQuery),
    thietBiRepository.countTransferHistory(normalizedQuery),
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

const getDeviceStatusHistory = async (thietBiId) => {
  await ensureDeviceExists(thietBiId);
  return thietBiRepository.findStatusHistoryByDeviceId(thietBiId);
};

module.exports = {
  createDevice,
  getDevices,
  getDeviceById,
  updateDevice,
  updateDeviceStatus,
  capPhatThietBi,
  banGiaoThietBi,
  dieuChuyenThietBi,
  thuHoiThietBi,
  getTransferHistory,
  getDeviceStatusHistory,
};



