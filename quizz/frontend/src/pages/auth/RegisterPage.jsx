import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    role: 'users',
  });
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
  
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp! Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);
    try {
  
      const { confirmPassword, ...dataToSubmit } = formData;

      const response = await axiosClient.post('/auth/register', dataToSubmit);
      setSuccessMsg(response.message || 'Đăng ký thành công!');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng ký thất bại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">Đăng ký</h2>
          <p className="mt-2 text-gray-500">Tạo tài khoản mới để bắt đầu làm bài</p>
        </div>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
        {successMsg && <div className="p-3 text-sm text-green-700 bg-green-50 rounded-md border border-green-200">{successMsg}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Tên đăng nhập (Username)</label>
            <input type="text" name="username" required value={formData.username} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nhập tên đăng nhập" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Họ và tên</label>
            <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="VD: Nguyễn Văn A" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Mật khẩu</label>
            <input type="password" name="password" required value={formData.password} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
            <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Nhập lại mật khẩu" />
          </div>

          <button type="submit" disabled={isLoading || successMsg !== ''}
            className={`w-full py-2.5 text-white font-semibold rounded-lg shadow-md transition-all ${isLoading || successMsg ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isLoading ? 'Đang xử lý...' : 'Đăng ký tài khoản'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600">
          Đã có tài khoản? <Link to="/login" className="font-semibold text-blue-600 hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}