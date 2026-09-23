const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// 1. Cấu hình danh sách tên miền được phép truy cập
const allowedOrigins = [
  "http://localhost:5173",
  "https://quizzapp-front.onrender.com",
  "https://bookish-potato-r4x66wxj5qwxcpg94-5173.app.github.dev",
  process.env.FRONTEND_URL,
].filter(Boolean);

// 2. Cấu hình CORS tối ưu cho cả Mobile Native và Flutter Web
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      if (/^https:\/\/.*\.app\.github\.dev$/.test(origin)) return callback(null, true);

      console.warn(`[CORS Blocked] Origin: ${origin}`);
      return callback(new Error("Yêu cầu bị chặn bởi chính sách CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Tương thích Express v5: Sử dụng regex thay vì chuỗi "*"
app.options(/(.*)/, cors());

// 3. Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request logger gọn gàng
app.use((req, res, next) => {
  const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// 5. Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// 6. Khai báo các Routes chính
const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/auth", authRoutes);
app.use("/exams", examRoutes);
app.use("/chat", chatRoutes);
app.use("/users", userRoutes);

// 7. Xử lý Route 404 (Không tìm thấy đường dẫn)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại trên hệ thống!`,
  });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err.message || err);
  
  if (err.message === "Yêu cầu bị chặn bởi chính sách CORS") {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Lỗi máy chủ nội bộ!",
  });
});

// 9. Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy thành công tại cổng: ${PORT}`);
});