require('dotenv').config();

const mysql = require('mysql2/promise');

const DEFAULT_STATUS = {
  ma_tinh_trang: 'CHUA_KIEM_KE',
  ten_tinh_trang: 'Chưa kiểm kê',
  mo_ta: 'Trạng thái đầu kỳ mặc định cho chi tiết kiểm kê mới',
};

const main = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      `
        SELECT tinh_trang_kiem_ke_id
        FROM tinh_trang_kiem_ke
        WHERE UPPER(ma_tinh_trang) = UPPER(?)
        LIMIT 1
        FOR UPDATE
      `,
      [DEFAULT_STATUS.ma_tinh_trang],
    );

    let tinhTrangKiemKeId;
    if (existingRows.length) {
      tinhTrangKiemKeId = Number(existingRows[0].tinh_trang_kiem_ke_id);
      await connection.query(
        `
          UPDATE tinh_trang_kiem_ke
          SET ten_tinh_trang = ?, mo_ta = ?, is_active = 1
          WHERE tinh_trang_kiem_ke_id = ?
        `,
        [
          DEFAULT_STATUS.ten_tinh_trang,
          DEFAULT_STATUS.mo_ta,
          tinhTrangKiemKeId,
        ],
      );
    } else {
      const [insertResult] = await connection.query(
        `
          INSERT INTO tinh_trang_kiem_ke (
            ma_tinh_trang,
            ten_tinh_trang,
            mo_ta,
            is_active
          )
          VALUES (?, ?, ?, 1)
        `,
        [
          DEFAULT_STATUS.ma_tinh_trang,
          DEFAULT_STATUS.ten_tinh_trang,
          DEFAULT_STATUS.mo_ta,
        ],
      );

      tinhTrangKiemKeId = Number(insertResult.insertId);
    }

    await connection.commit();

    const [rows] = await connection.query(
      `
        SELECT tinh_trang_kiem_ke_id, ma_tinh_trang, ten_tinh_trang, is_active
        FROM tinh_trang_kiem_ke
        WHERE tinh_trang_kiem_ke_id = ?
      `,
      [tinhTrangKiemKeId],
    );

    console.log(JSON.stringify(rows[0], null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
