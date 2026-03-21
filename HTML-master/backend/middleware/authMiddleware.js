const jwt = require("jsonwebtoken");
const SECRET_KEY = "my_super_secret_key_123";

/**
 * Middleware xác thực JWT
 * - Kiểm tra Header Authorization
 * - Verify Token
 * - Gán thông tin user đã giải mã vào req.user
 */
const verifyToken = (req, res, next) => {
  // Lấy token từ header (Format chuẩn: "Bearer <token>")
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied: Thiếu Token xác thực." });
  }

  // Giải mã Token
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid Token: Token không hợp lệ hoặc đã hết hạn.",
      });
    }

    // Token hợp lệ -> Lưu payload (id, role) vào request để controller sử dụng
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
