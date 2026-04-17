const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');
const baoCaoController = require('../controllers/baoCao.controller');
const baoCaoValidation = require('../validations/baoCao.validation');

const router = express.Router();

const READ_ROLES = ['ADMIN', 'NHAN_VIEN_THIET_BI', 'NGUOI_DUYET', 'KE_TOAN'];

router.use(authMiddleware);

router.get(
  '/thiet-bi/theo-loai',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getThietBiTheoLoaiQuery),
  baoCaoController.getBaoCaoThietBiTheoLoai,
);

router.get(
  '/thiet-bi/theo-don-vi',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getThietBiTheoDonViQuery),
  baoCaoController.getBaoCaoThietBiTheoDonVi,
);

router.get(
  '/thiet-bi/theo-trang-thai',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getThietBiTheoTrangThaiQuery),
  baoCaoController.getBaoCaoThietBiTheoTrangThai,
);

router.get(
  '/thiet-bi/sap-het-bao-hanh',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getThietBiSapHetBaoHanhQuery),
  baoCaoController.getBaoCaoThietBiSapHetBaoHanh,
);

router.get(
  '/thiet-bi/hong-hoac-bao-tri',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getThietBiHongBaoTriQuery),
  baoCaoController.getBaoCaoThietBiHongHoacBaoTri,
);

router.get(
  '/chi-phi-sua-chua/theo-thang',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getChiPhiTheoThangQuery),
  baoCaoController.getBaoCaoChiPhiSuaChuaTheoThang,
);

router.get(
  '/chi-phi-sua-chua/theo-quy',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getChiPhiTheoQuyQuery),
  baoCaoController.getBaoCaoChiPhiSuaChuaTheoQuy,
);

router.get(
  '/chi-phi-sua-chua/theo-nam',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getChiPhiTheoNamQuery),
  baoCaoController.getBaoCaoChiPhiSuaChuaTheoNam,
);

router.get(
  '/lich-su-dieu-chuyen',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getLichSuDieuChuyenQuery),
  baoCaoController.getBaoCaoLichSuDieuChuyen,
);

router.get(
  '/kiem-ke/ket-qua-theo-ky',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getKetQuaKiemKeTheoKyQuery),
  baoCaoController.getBaoCaoKetQuaKiemKeTheoKy,
);

router.get(
  '/thanh-ly/de-xuat',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getDeXuatThanhLyQuery),
  baoCaoController.getBaoCaoThietBiDeXuatThanhLy,
);

router.get(
  '/thanh-ly/da-thanh-ly',
  authorizeRoles(...READ_ROLES),
  validate(baoCaoValidation.getDaThanhLyQuery),
  baoCaoController.getBaoCaoThietBiDaThanhLy,
);

module.exports = router;
