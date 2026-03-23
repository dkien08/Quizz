const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const verifyToken = require("../middleware/authMiddleware");

// TẤT CẢ routes dưới đây đều cần đăng nhập -> dùng verifyToken

// Lấy thông tin bản thân
router.get("/profile", verifyToken, userController.getProfile);

// Cập nhật tên
router.put("/profile", verifyToken, userController.updateProfile);

// Đổi mật khẩu
router.put("/change-password", verifyToken, userController.changePassword);

// Lấy danh sách (Admin) - Sau này có thể thêm middleware checkAdmin
router.get("/list", verifyToken, userController.getAllUsers);

module.exports = router;
