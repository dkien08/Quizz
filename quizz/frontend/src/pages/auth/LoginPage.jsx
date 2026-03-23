import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

// Nhận setAuth từ App.jsx truyền xuống để cập nhật trạng thái toàn cục
export default function LoginPage({ setIsAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Gọi API đăng nhập [cite: 15]
      const response = await axiosClient.post('/auth/login', {
        username,
        password,
      });

      // 2. Lưu Token vào localStorage [cite: 9, 15]
      if (response.token) {
        localStorage.setItem('token', response.token);
        
        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }

        // --- ĐIỂM MỚI QUAN TRỌNG ---
        // Cập nhật state ở App.jsx để Navbar biết bạn đã login
        if (setIsAuthenticated) {
          setIsAuthenticated(true);
        }
        // ---------------------------

        // 3. Chuyển hướng về trang chủ
        navigate('/');
      } else {
        setError('Không nhận được token từ server.');
      }
    } catch (err) {
      // Xử lý các mã lỗi HTTP như 400, 401 [cite: 10, 11]
      setError(
        err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Đăng nhập</h2>
          <p className="mt-2 text-gray-500">Chào mừng bạn quay lại Smart Quiz!</p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Tên đăng nhập
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Nhập username của bạn"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 text-white font-semibold rounded-lg shadow-md transition-all ${
              isLoading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}