const dashboardRepository = require('../repositories/dashboard.repository');
const { writeAuditLog } = require('./auditLog.service');

const MODULE_NAME = 'DASHBOARD';

const toDateString = (date) => {
  return date.toISOString().slice(0, 10);
};

const getTodayDateString = () => {
  return toDateString(new Date());
};

const getFirstDayOfCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + Number(days));
  return toDateString(date);
};

const resolveReportRange = (query) => {
  const fromDate = query.from_date || getFirstDayOfCurrentMonth();
  const toDate = query.to_date || getTodayDateString();
  return { fromDate, toDate };
};

const resolveWarrantyRange = (query) => {
  if (query.from_date && query.to_date) {
    return {
      fromDate: query.from_date,
      toDate: query.to_date,
      warrantyDays: query.warranty_days ?? null,
    };
  }

  const fromDate = getTodayDateString();
  const warrantyDays = query.warranty_days === undefined ? 30 : Number(query.warranty_days);
  const toDate = addDays(fromDate, warrantyDays);

  return { fromDate, toDate, warrantyDays };
};

const getTongQuanDashboard = async (actor, query, context = {}) => {
  const reportRange = resolveReportRange(query);
  const warrantyRange = resolveWarrantyRange(query);
  const topLimit = query.top_limit === undefined ? 5 : Number(query.top_limit);
  const months = query.months === undefined ? 6 : Number(query.months);

  const [
    deviceOverview,
    phieuBaoHongChoXuLy,
    phieuKiemKeDangMo,
    phieuThanhLyChoDuyet,
    thietBiSapHetBaoHanh,
    tongChiPhiBaoTri,
    topDonVi,
    topLoaiThietBi,
    thongKeTrangThai,
    thongKeChiPhiTheoThang,
  ] = await Promise.all([
    dashboardRepository.getDeviceOverviewCounts(),
    dashboardRepository.countPhieuBaoHongChoXuLy(),
    dashboardRepository.countPhieuKiemKeDangMo(),
    dashboardRepository.countPhieuThanhLyChoDuyet(),
    dashboardRepository.countDeviceSapHetBaoHanh({
      fromDate: warrantyRange.fromDate,
      toDate: warrantyRange.toDate,
    }),
    dashboardRepository.sumBaoTriCostInPeriod({
      fromDate: reportRange.fromDate,
      toDate: reportRange.toDate,
    }),
    dashboardRepository.getTopDonViByDeviceCount(topLimit),
    dashboardRepository.getTopLoaiThietBiByCount(topLimit),
    dashboardRepository.getDeviceStatusDistribution(),
    dashboardRepository.getBaoTriCostByMonth({
      fromDate: query.from_date,
      toDate: query.to_date,
      months,
    }),
  ]);

  const result = {
    tong_so_thiet_bi: Number(deviceOverview.tong_so_thiet_bi || 0),
    thiet_bi_dang_su_dung: Number(deviceOverview.thiet_bi_dang_su_dung || 0),
    thiet_bi_dang_bao_tri: Number(deviceOverview.thiet_bi_dang_bao_tri || 0),
    thiet_bi_mat_thieu: Number(deviceOverview.thiet_bi_mat_thieu || 0),
    thiet_bi_da_thanh_ly: Number(deviceOverview.thiet_bi_da_thanh_ly || 0),
    phieu_bao_hong_cho_xu_ly: phieuBaoHongChoXuLy,
    phieu_kiem_ke_dang_mo: phieuKiemKeDangMo,
    phieu_thanh_ly_cho_duyet: phieuThanhLyChoDuyet,
    thiet_bi_sap_het_bao_hanh: thietBiSapHetBaoHanh,
    tong_chi_phi_bao_tri_trong_ky: Number(tongChiPhiBaoTri || 0),
    top_don_vi_nhieu_thiet_bi: topDonVi,
    top_loai_thiet_bi_nhieu_nhat: topLoaiThietBi,
    thong_ke_thiet_bi_theo_trang_thai: thongKeTrangThai,
    thong_ke_chi_phi_sua_chua_theo_thang: thongKeChiPhiTheoThang,
    ky_bao_cao: {
      tu_ngay: reportRange.fromDate,
      den_ngay: reportRange.toDate,
    },
    ky_bao_hanh_sap_het: {
      tu_ngay: warrantyRange.fromDate,
      den_ngay: warrantyRange.toDate,
      so_ngay: warrantyRange.warrantyDays,
    },
  };

  await writeAuditLog({
    nguoi_dung_id: actor?.nguoi_dung_id || null,
    module: MODULE_NAME,
    hanh_dong: 'VIEW_TONG_QUAN',
    entity_name: 'dashboard',
    entity_id: null,
    du_lieu_moi: {
      from_date: reportRange.fromDate,
      to_date: reportRange.toDate,
    },
    ghi_chu: 'Truy cập dashboard t�"ng quan',
    ip_address: context.ipAddress,
  });

  return result;
};

module.exports = {
  getTongQuanDashboard,
};

