const { createMasterDataController } = require('./masterData.controllerFactory');
const lyDoThanhLyService = require('../services/lyDoThanhLy.service');
const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../configs/db.config');

const controller = createMasterDataController({
  service: lyDoThanhLyService,
  messages: {
    list: 'Lấy danh sách lý do thanh lý thành công',
    detail: 'Lấy chi tiết lý do thanh lý thành công',
    create: 'Tạo lý do thanh lý thành công',
    update: 'Cập nhật lý do thanh lý thành công',
    updateStatus: 'Cập nhật trạng thái lý do thanh lý thành công',
    statusUnchanged: 'Trạng thái lý do thanh lý không thay đổi',
  },
});

const getLyDoThanhLy = asyncHandler(async (req, res) => {
  // Check and seed if empty
  const [countRows] = await pool.query('SELECT COUNT(*) as total FROM ly_do_thanh_ly');
  if (countRows[0].total === 0) {
    const seedData = [
      ['QUA_HAN_SU_DUNG', 'QUÁ HẠN SỬ DỤNG'],
      ['HONG_NANG_KHONG_SUA', 'HỎNG NẶNG KHÔNG SỬA'],
      ['CHI_PHI_SUA_CAO', 'CHI PHÍ SỬA CAO'],
      ['LAC_HAU', 'LẠC HẬU'],
      ['MAT_THIET_BI', 'MẤT THIẾT BỊ']
    ];
    for (const [ma, ten] of seedData) {
      await pool.query('INSERT INTO ly_do_thanh_ly (ma_ly_do, ten_ly_do, is_active) VALUES (?, ?, 1)', [ma, ten]);
    }
  }

  // Fetch active items with optional filter
  let sql = 'SELECT ly_do_thanh_ly_id, ma_ly_do, ten_ly_do FROM ly_do_thanh_ly WHERE is_active = 1';
  const params = [];

  if (req.query.keyword) {
    sql += ' AND (ma_ly_do LIKE ? OR ten_ly_do LIKE ?)';
    const kw = `%${req.query.keyword}%`;
    params.push(kw, kw);
  }

  const [rows] = await pool.query(sql, params);

  // Format response directly as array
  const formattedData = rows.map(item => ({
    ly_do_thanh_ly_id: item.ly_do_thanh_ly_id,
    ma_ly_do: item.ma_ly_do,
    ten_ly_do: item.ten_ly_do
  }));

  return res.json(formattedData);
});

module.exports = {
  getLyDoThanhLy,
  getLyDoThanhLyById: controller.getDetail,
  createLyDoThanhLy: controller.create,
  updateLyDoThanhLy: controller.update,
  updateLyDoThanhLyStatus: controller.updateStatus,
};



