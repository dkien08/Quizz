const db = require("../config/db"); // Nhớ trỏ đúng đường dẫn file db kết nối MySQL
const bcrypt = require("bcryptjs");

// 1. Xem thông tin cá nhân (Read)
exports.getProfile = async (req, res) => {
  try {
    // In ra xem Token đã giải mã được chưa
    console.log("Thông tin User từ Token:", req.user);

    if (!req.user) {
      throw new Error(
        "Không tìm thấy thông tin user trong req (Lỗi Middleware)",
      );
    }

    const userId = req.user.id;

    const [users] = await db.query(
      "SELECT id, username, full_name, created_at FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json(users[0]);
  } catch (err) {
    // QUAN TRỌNG: In lỗi chi tiết ra Terminal để debug
    console.error("❌ Lỗi tại getProfile:", err);

    // Trả về lỗi chi tiết cho Thunder Client xem luôn
    res
      .status(500)
      .json({ message: "Lỗi hệ thống", error_details: err.message });
  }
};

// 2. Cập nhật thông tin (Update) - Ví dụ: Đổi tên hiển thị
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: "Vui lòng nhập tên đầy đủ" });
    }

    await db.query("UPDATE users SET full_name = ? WHERE id = ?", [
      full_name,
      userId,
    ]);

    res.json({ message: "Cập nhật thông tin thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 3. Đổi mật khẩu (Update Password)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { old_password, new_password } = req.body;

    // Lấy mật khẩu cũ trong DB
    const [users] = await db.query("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);
    const user = users[0];

    // So sánh mật khẩu cũ
    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng!" });
    }

    // Mã hóa mật khẩu mới và lưu
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 4. Lấy danh sách tất cả user (Dành cho Admin - Read All)
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, username, full_name, role, created_at FROM users",
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
