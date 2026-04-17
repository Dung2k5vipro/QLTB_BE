const baoCaoRepository = require('../repositories/baoCao.repository');
const { writeAuditLog } = require('./auditLog.service');

const MODULE_NAME = 'BAO_CAO';

const buildPagination = (page, limit, totalItems) => {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit) || 1,
  };
};

const logBaoCaoAccess = async (actor, hanhDong, query, context = {}) => {
  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: MODULE_NAME,
    hanh_dong: hanhDong,
    entity_name: 'bao_cao',
    entity_id: null,
    du_lieu_moi: query || null,
    ghi_chu: `Truy cập ${hanhDong}`,
    ip_address: context.ipAddress,
  });
};

const getBaoCaoThietBiTheoLoai = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getThietBiTheoLoai(query);
  await logBaoCaoAccess(actor, 'THIET_BI_THEO_LOAI', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

const getBaoCaoThietBiTheoDonVi = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getThietBiTheoDonVi(query);
  await logBaoCaoAccess(actor, 'THIET_BI_THEO_DON_VI', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

const getBaoCaoThietBiTheoTrangThai = async (actor, query, context = {}) => {
  const items = await baoCaoRepository.getThietBiTheoTrangThai(query);
  await logBaoCaoAccess(actor, 'THIET_BI_THEO_TRANG_THAI', query, context);
  return { items };
};

const getBaoCaoThietBiSapHetBaoHanh = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getThietBiSapHetBaoHanh(query);
  await logBaoCaoAccess(actor, 'THIET_BI_SAP_HET_BAO_HANH', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

const getBaoCaoThietBiHongHoacBaoTri = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getThietBiHongHoacBaoTri(query);
  await logBaoCaoAccess(actor, 'THIET_BI_HONG_HOAC_BAO_TRI', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

const getBaoCaoChiPhiSuaChuaTheoThang = async (actor, query, context = {}) => {
  const nowYear = new Date().getFullYear();
  const rows = await baoCaoRepository.getChiPhiSuaChuaTheoThang({
    ...query,
    nam: query.nam || nowYear,
  });
  await logBaoCaoAccess(actor, 'CHI_PHI_SUA_CHUA_THEO_THANG', query, context);

  return {
    items: rows,
  };
};

const getBaoCaoChiPhiSuaChuaTheoQuy = async (actor, query, context = {}) => {
  const nowYear = new Date().getFullYear();
  const rows = await baoCaoRepository.getChiPhiSuaChuaTheoQuy({
    ...query,
    nam: query.nam || nowYear,
  });
  await logBaoCaoAccess(actor, 'CHI_PHI_SUA_CHUA_THEO_QUY', query, context);

  return {
    items: rows,
  };
};

const getBaoCaoChiPhiSuaChuaTheoNam = async (actor, query, context = {}) => {
  const rows = await baoCaoRepository.getChiPhiSuaChuaTheoNam(query);
  await logBaoCaoAccess(actor, 'CHI_PHI_SUA_CHUA_THEO_NAM', query, context);

  return {
    items: rows,
  };
};

const getBaoCaoLichSuDieuChuyen = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getLichSuDieuChuyen(query);
  await logBaoCaoAccess(actor, 'LICH_SU_DIEU_CHUYEN', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

const getBaoCaoKetQuaKiemKeTheoKy = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getKetQuaKiemKeTheoKy(query);
  await logBaoCaoAccess(actor, 'KET_QUA_KIEM_KE_THEO_KY', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

const getBaoCaoThietBiDeXuatThanhLy = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getThietBiDeXuatThanhLy(query);
  await logBaoCaoAccess(actor, 'THIET_BI_DE_XUAT_THANH_LY', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

const getBaoCaoThietBiDaThanhLy = async (actor, query, context = {}) => {
  const result = await baoCaoRepository.getThietBiDaThanhLy(query);
  await logBaoCaoAccess(actor, 'THIET_BI_DA_THANH_LY', query, context);

  return {
    items: result.items,
    pagination: buildPagination(query.page, query.limit, result.totalItems),
  };
};

module.exports = {
  getBaoCaoThietBiTheoLoai,
  getBaoCaoThietBiTheoDonVi,
  getBaoCaoThietBiTheoTrangThai,
  getBaoCaoThietBiSapHetBaoHanh,
  getBaoCaoThietBiHongHoacBaoTri,
  getBaoCaoChiPhiSuaChuaTheoThang,
  getBaoCaoChiPhiSuaChuaTheoQuy,
  getBaoCaoChiPhiSuaChuaTheoNam,
  getBaoCaoLichSuDieuChuyen,
  getBaoCaoKetQuaKiemKeTheoKy,
  getBaoCaoThietBiDeXuatThanhLy,
  getBaoCaoThietBiDaThanhLy,
};
