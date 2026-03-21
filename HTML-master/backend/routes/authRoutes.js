const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController"); // Dùng destructuring cho gọn

// Gom nhóm các route liên quan đến Authentication
router.post("/register", register);
router.post("/login", login);

module.exports = router;
