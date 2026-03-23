import axios from "axios";

// Bỏ "/api" ở cuối để linh hoạt gọi được cả /api/auth và /exams
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://quizzapp-kovj.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    // Trả về response.data để các Component lấy dữ liệu gọn hơn
    return response.data;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Chỉ chuyển hướng nếu không phải đang ở trang login để tránh lặp vô hạn
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      
      if (status === 403) {
        console.error("Bạn không có quyền thực hiện hành động này.");
      }
    }
    return Promise.reject(error);
  }
);

export default api;