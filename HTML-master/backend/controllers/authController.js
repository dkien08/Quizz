const db = require("../config/db");
const bcrypt = require("bcrypt"); // Thư viện mã hóa
const jwt = require("jsonwebtoken");

// Secret Key cho JWT (Nên lưu trong biến môi trường .env thực tế)
const SECRET_KEY = "my_super_secret_key_123";

/**
 * Xử lý đăng nhập người dùng
 * @param {string} username - Tên đăng nhập
 * @param {string} password - Mật khẩu chưa mã hóa
 * @returns {object} JSON chứa Token và thông tin User (trừ password)
 */

// ĐĂNG KÝ
exports.register = async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: "Thiếu thông tin!" });

    // Dùng promise() để dùng được await (nếu db.js bạn đã export db.promise())
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE username = ?",
      [username],
    );

    if (existingUser.length > 0)
      return res.status(409).json({ message: "Tên đăng nhập đã tồn tại!" });

    // MÃ HÓA MẬT KHẨU (Salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const insertSql =
      "INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)";
    await db.query(insertSql, [
      username,
      hashedPassword,
      full_name,
      role || "users",
    ]);

    return res.status(200).json({ message: "Đăng ký thành công!" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ĐĂNG NHẬP
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Tìm user trong database
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0)
      return res.status(404).json({ message: "User không tồn tại!" });

    const user = users[0];

    // 2. Kiểm tra mật khẩu (So sánh hash)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu!" });

    // 3. Tạo JWT Token
    // Payload chứa ID và Role để phân quyền sau này
    const payload = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "24h" });

    // 4. Trả về kết quả
    const { password: _, ...userInfo } = user;
    return res.status(200).json({
      message: "Đăng nhập thành công!",
      token: token,
      user: userInfo,
    });
  } catch (err) {
    return res.status(500).json({ error: "System Error: " + err.message });
  }
};
