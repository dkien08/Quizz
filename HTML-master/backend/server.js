const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://quizzapp-front.onrender.com", // Thêm trực tiếp domain frontend để tránh lỗi biến môi trường
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: ["https://quizzapp-front.onrender.com", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/api/auth", authRoutes);
app.use("/exams", examRoutes); // Sửa lại path để khớp với lỗi "exams/my-exams" trong console của bạn
app.use("/api/chat", chatRoutes);
app.use("/users", userRoutes); // Sửa lại path để khớp với ProfilePage

app.use((req, res) => {
  res.status(404).json({ message: "Đường dẫn không tồn tại!" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server đang chạy tại: ${port}`);
});