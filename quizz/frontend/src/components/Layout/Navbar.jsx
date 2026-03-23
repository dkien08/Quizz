import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, BookOpen } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  // Lấy thông tin user từ localStorage (nếu có)
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo & Tên dự án */}
      <div
        className="flex items-center gap-2 font-bold text-xl text-blue-600 cursor-pointer hover:opacity-80 transition"
        onClick={() => navigate("/dashboard")}
      >
        <BookOpen size={28} />
        <span>Smart Quiz AI</span>
      </div>

      {/* User Info & Logout */}
      <div className="flex items-center gap-6">
        <div
          className="flex items-center gap-2 text-gray-700 font-medium cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition"
          onClick={() => navigate("/profile")}
        >
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <User size={20} />
          </div>
          <span className="hidden sm:block">
            {user.fullname || "Sinh viên"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
        >
          <LogOut size={18} />
          <span className="hidden sm:block">Đăng xuất</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
