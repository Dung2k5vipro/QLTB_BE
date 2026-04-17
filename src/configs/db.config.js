const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || "QLTB_TRUONGHOC1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const connectDB = async () => {
  const connection = await pool.getConnection();

  try {
    await connection.ping();
    console.log('MySQL connected');
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  connectDB,
};
