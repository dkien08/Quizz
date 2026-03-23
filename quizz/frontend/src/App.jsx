// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Import Components
import Navbar from './components/Layout/Navbar';

// Import Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Dashboard from './pages/exam/Dashboard';
import CreateExam from './pages/exam/CreateExam';
import ExamRoom from './pages/exam/ExamRoom';
import PracticeRoom from './pages/exam/PracticeRoom';
import ExamStats from './pages/exam/ExamStats';
import ProfilePage from './pages/user/ProfilePage';

function App() {
  // Kiểm tra trạng thái đăng nhập dựa trên Token [cite: 15]
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Đồng bộ trạng thái khi có thay đổi từ các tab khác hoặc thao tác trong cùng tab
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800">
        {/* Navbar sẽ thay đổi giao diện dựa trên isAuthenticated */}
        <Navbar isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} /> 
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            {/* --- NHÓM CÔNG KHAI (PUBLIC) --- */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Truyền setIsAuthenticated vào LoginPage để cập nhật Navbar ngay khi đăng nhập thành công */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <LoginPage setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/" />} 
            />
            
            <Route 
              path="/register" 
              element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} 
            />

            {/* --- NHÓM CẦN ĐĂNG NHẬP (PRIVATE)  --- */}
            <Route 
              path="/profile" 
              element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/exam/create" 
              element={isAuthenticated ? <CreateExam /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/exam/stats/:id" 
              element={isAuthenticated ? <ExamStats /> : <Navigate to="/login" />} 
            />

            {/* --- NHÓM LÀM BÀI (EXAM & PRACTICE) --- */}
            {/* Chế độ thi thật [cite: 1, 17] */}
            <Route path="/exam/:code" element={<ExamRoom />} /> 
            {/* Chế độ ôn tập có hỗ trợ AI [cite: 2, 17, 23] */}
            <Route path="/practice/:code" element={<PracticeRoom />} /> 
            
            {/* Điều hướng các đường dẫn không tồn tại về trang chủ */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;