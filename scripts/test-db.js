require('dotenv').config();

const { pool } = require('../src/configs/db.config');

const testDatabaseConnection = async () => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('DB_TEST_OK', rows[0]);
    process.exitCode = 0;
  } catch (error) {
    console.error('DB_TEST_FAILED', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

testDatabaseConnection();
