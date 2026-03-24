const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://quizzapp-front.onrender.com",
  "https://bookish-potato-r4x66wxj5qwxcpg94-5173.app.github.dev",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS bị chặn cho origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204
  })
);
app.options('*', cors());

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

const authRoutes = require("./routes/authRoutes");
const examRoutes = require("./routes/examRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/auth", authRoutes);
app.use("/exams", examRoutes);
app.use("/chat", chatRoutes);
app.use("/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Đường dẫn không tồn tại!" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server đang chạy tại: ${port}`);
});