import React, { useState, useEffect } from 'react';
import api from '../../services/axiosClient';
import { User, Lock, Save, Loader2, KeyRound, Calendar, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: '',
    full_name: '',
    created_at: '',
    role: 'Sinh viên'
  });
  
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const profileData = response.data?.user || response.data;
        setUser(prev => ({ ...prev, ...profileData }));
      } catch (err) {
        console.error("Lỗi tải profile:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user.full_name.trim()) return;
    
    setUpdatingProfile(true);
    setMessage({ type: '', text: '' });
    
    try {
      await api.put('/users/profile', { full_name: user.full_name });
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...storedUser, full_name: user.full_name }));
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Không thể lưu thay đổi.' });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }

    setChangingPassword(true);
    try {
      await api.put('/users/change-password', {
        old_password: passData.currentPassword,
        new_password: passData.newPassword
      });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công! Đang đăng xuất...' });
      setTimeout(() => {
        localStorage.clear();
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Mật khẩu cũ không đúng.' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <main className="max-w-4xl mx-auto p-4 md:p-6 mt-6">
        {/* Nút quay lại thay cho Navbar */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-bold transition-colors group"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm border group-hover:bg-blue-50">
              <ArrowLeft size={20} />
            </div>
            QUAY LẠI
          </button>
          <h1 className="text-xl font-black text-gray-800 tracking-tight uppercase">Thiết lập tài khoản</h1>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-bold border flex items-center gap-3 animate-in slide-in-from-top-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Thông tin thẻ User */}
          <div className="md:col-span-1">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-slate-900"></div>
              <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center text-slate-900 mx-auto mb-4 mt-6 border-8 border-white shadow-xl font-black text-3xl">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">{user.full_name || 'Đang tải...'}</h2>
              <p className="text-gray-400 text-xs mt-1 font-bold">@{user.username}</p>
              
              <div className="mt-8 pt-6 border-t border-gray-50 text-left space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase flex items-center gap-2"><Calendar size={14}/> Gia nhập</span>
                  <span className="font-black text-gray-700">{new Date(user.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-bold uppercase">Phân quyền</span>
                  <span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase text-[10px]">Sinh viên</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            {/* Form cập nhật tên */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-lg">
                <Save size={20} className="text-blue-500" /> Thông tin hiển thị
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <input
                  type="text"
                  value={user.full_name || ''}
                  onChange={(e) => setUser({...user, full_name: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-gray-700"
                  placeholder="Họ và tên..."
                />
                <div className="flex justify-end">
                  <button disabled={updatingProfile} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-blue-700 shadow-lg shadow-blue-100 disabled:opacity-50">
                    {updatingProfile ? <Loader2 className="animate-spin" size={20} /> : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>

            {/* Form đổi mật khẩu */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 font-sans">
              <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-lg">
                <KeyRound size={20} className="text-orange-500" /> Đổi mật khẩu
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-gray-300" size={18} />
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu hiện tại"
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all"
                    onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                    value={passData.currentPassword}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu mới"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all"
                    onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                    value={passData.newPassword}
                  />
                  <input
                    type="password"
                    required
                    placeholder="Xác nhận mật khẩu"
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-orange-500 focus:bg-white outline-none transition-all"
                    onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})}
                    value={passData.confirmPassword}
                  />
                </div>
                <button disabled={changingPassword} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black shadow-xl disabled:opacity-50">
                  {changingPassword ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'XÁC NHẬN ĐỔI MẬT KHẨU'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;