require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./configs/db.config');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Khởi động máy chủ thất bại:', error.message);
    process.exit(1);
  }
};

startServer();
