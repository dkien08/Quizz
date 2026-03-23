const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController"); // Import controller bạn vừa tạo

// Định nghĩa đường dẫn: /ask
// (Sau này ghép ở server.js sẽ thành: /api/chat/ask)
router.post("/ask", chatController.askChatbot);

module.exports = router;
