const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306, // Thêm port vào đây
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ⬇️ THÊM DÒNG NÀY ĐỂ KẾT NỐI VỚI AIVEN ⬇️
    ssl: {
        rejectUnauthorized: false
    }
});

// Kiểm tra kết nối
db.getConnection()
    .then(connection => {
        console.log('✅ Đã kết nối thành công với MySQL trên Aiven!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Kết nối Database thất bại: ' + err.message);
        // In thêm mã lỗi để dễ debug nếu vẫn fail
        console.error('Mã lỗi (Code):', err.code);
    });

module.exports = db;