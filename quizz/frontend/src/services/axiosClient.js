// src/services/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://quizzapp-kovj.onrender.com/api', // Đường dẫn Backend của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động gắn Token vào mỗi request nếu user đã đăng nhập
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý dữ liệu trả về và bắt lỗi 401 (hết hạn token)
axiosClient.interceptors.response.use(
  (response) => {
    return response.data; // Lấy trực tiếp data để component gọn code hơn
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Nếu lỗi 401: Xóa token và đẩy về trang login
      localStorage.removeItem('token');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;