const express = require('express');
const { pool } = require('../configs/db.config');

const router = express.Router();

/**
 * GET /api/debug/chi-phi/:id
 * Trả raw data từ nhat_ky_bao_tri để debug chi phí sửa chữa.
 * KHÔNG cần auth - chỉ dùng trong môi trường dev, xoá sau khi debug xong.
 */
router.get('/chi-phi/:id', async (req, res) => {
  const { id } = req.params;
  const parsedId = Number(id);

  console.log('[DEBUG ROUTE] /api/debug/chi-phi/:id - id nhận từ request:', id, '→ parsed:', parsedId);

  try {
    // 1. Raw rows
    const [rawRows] = await pool.query(
      'SELECT nhat_ky_bao_tri_id, thiet_bi_id, phieu_bao_hong_id, chi_phi, ngay_hoan_thanh FROM nhat_ky_bao_tri WHERE thiet_bi_id = ? ORDER BY nhat_ky_bao_tri_id',
      [parsedId],
    );

    // 2. SUM query
    const [sumRows] = await pool.query(
      'SELECT thiet_bi_id, COALESCE(SUM(chi_phi), 0) AS tong_chi_phi FROM nhat_ky_bao_tri WHERE thiet_bi_id = ? GROUP BY thiet_bi_id',
      [parsedId],
    );

    // 3. Kiểm tra thiết bị có tồn tại không
    const [deviceRows] = await pool.query(
      'SELECT thiet_bi_id, ma_tai_san, ten_thiet_bi FROM thiet_bi WHERE thiet_bi_id = ? LIMIT 1',
      [parsedId],
    );

    const result = {
      debug_info: {
        id_truyen_vao_raw: id,
        id_truyen_vao_type: typeof id,
        id_parsed: parsedId,
      },
      thiet_bi: deviceRows[0] || null,
      so_luong_ban_ghi_nhat_ky: rawRows.length,
      raw_rows: rawRows.map((r) => ({
        ...r,
        chi_phi: String(r.chi_phi),
      })),
      sum_query_result: sumRows[0]
        ? {
            thiet_bi_id: Number(sumRows[0].thiet_bi_id),
            tong_chi_phi: String(sumRows[0].tong_chi_phi),
            tong_chi_phi_number: Number(sumRows[0].tong_chi_phi),
          }
        : null,
      ket_luan: rawRows.length === 0
        ? 'Không có bản ghi nào trong nhat_ky_bao_tri với thiet_bi_id này'
        : `Có ${rawRows.length} bản ghi, tổng chi phí = ${sumRows[0]?.tong_chi_phi || 0}`,
    };

    console.log('[DEBUG ROUTE] Kết quả:', JSON.stringify(result, null, 2));

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error('[DEBUG ROUTE] Lỗi:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
