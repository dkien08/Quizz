import React, { useEffect, useState, useRef } from "react";
import api from "../../services/axiosClient";
import { useNavigate, Link } from "react-router-dom";
import {
  BarChart2,
  Clock,
  PlusCircle,
  Search,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  Layers,
  User,
  MoreVertical,
  Edit,
  Trash2,
  BookOpen,
  Play,
  MessageCircle,
  X,
  Send,
  AlertCircle,
  Sparkles
} from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [publicExams, setPublicExams] = useState([]);
  const [myExams, setMyExams] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchCode, setSearchCode] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef(null);

  // --- STATE CHO CHATBOT ---
  const [isChatOpen, setIsChatOpen] = useState(false); // Mặc định đóng
  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', text: 'Chào bạn! Mình là trợ lý AI của Smart Quiz. Mình có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [resPublic, resMy] = await Promise.all([
          api.get("/exams"),
          api.get("/exams/my-exams"),
        ]);
        setPublicExams(Array.isArray(resPublic) ? resPublic : (resPublic.data || []));
        setMyExams(Array.isArray(resMy) ? resMy : (resMy.data || []));
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setActiveMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navigate]);

  // Cuộn chat xuống cuối mỗi khi có tin nhắn mới
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const visiblePublicExams = isExpanded 
    ? publicExams 
    : (Array.isArray(publicExams) ? publicExams.slice(0, 4) : []);

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    navigate(`/exam/${searchCode.trim().toUpperCase()}`);
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề thi này?")) return;
    try {
      await api.delete(`/exams/${examId}`);
      setMyExams((prev) => prev.filter((e) => e.id !== examId));
      setPublicExams((prev) => prev.filter((e) => e.id !== examId));
    } catch (error) {
      alert("Lỗi khi xóa: " + (error.response?.data?.message || error.message));
    }
  };

  // --- LOGIC GỬI TIN NHẮN CHATBOT ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await api.post("/chat/ask", { message: userText });
      const aiReply = res.reply || res.answer || res.message || "Xin lỗi, mình không có phản hồi.";
      setChatMessages(prev => [...prev, { role: 'ai', text: aiReply }]);
    } catch (error) {
      console.error("Lỗi Chatbot:", error);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Hệ thống AI đang bận, vui lòng thử lại sau." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderExamCard = (exam, isMyExam) => (
    <div key={exam.id} className="bg-white p-5 rounded-xl border border-gray-100 hover:shadow-md transition flex flex-col h-full relative">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">{exam.code}</span>
          {isMyExam && (exam.is_public ? <Globe size={14} className="text-green-500" /> : <Lock size={14} className="text-orange-500" />)}
        </div>

        {isMyExam ? (
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === exam.id ? null : exam.id); }} className="p-1 hover:bg-gray-100 rounded-full">
              <MoreVertical size={18} className="text-gray-400" />
            </button>
            {activeMenuId === exam.id && (
              <div ref={menuRef} className="absolute right-0 top-8 w-40 bg-white shadow-xl border rounded-lg z-20 overflow-hidden">
                {/* <button onClick={() => navigate(`/exam/edit/${exam.id}`)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex gap-2 text-gray-700">
                  <Edit size={16} className="text-blue-600" /> Sửa đề
                </button> */}
                <button onClick={() => navigate(`/exam/stats/${exam.id}`)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 flex gap-2 text-gray-700">
                  <BarChart2 size={16} className="text-purple-600" /> Thống kê
                </button>
                <button onClick={() => handleDeleteExam(exam.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex gap-2 border-t">
                  <Trash2 size={16} /> Xóa đề
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {exam.duration}'</span>
        )}
      </div>

      <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 flex-1">{exam.title}</h3>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 border-t pt-2 mt-2">
        <div className="flex items-center gap-1">
          <Clock size={12} /> Thời gian: {exam.duration} phút
        </div>
        {!isMyExam && exam.author_name && (
          <div className="flex items-center gap-1">
            <User size={12} /> {exam.author_name}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button onClick={() => navigate(`/practice/${exam.code}`)} className="flex items-center justify-center gap-1 py-2 bg-amber-50 text-amber-700 font-bold rounded-lg text-xs hover:bg-amber-100 transition">
          <BookOpen size={14} /> Ôn tập
        </button>
        <button onClick={() => navigate(`/exam/${exam.code}`)} className="flex items-center justify-center gap-1 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-black transition">
          <Play size={14} fill="currentColor" /> Vào thi
        </button>
      </div>
    </div>
  );

  if (isLoading) return <div className="text-center py-20 font-bold text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <main className="max-w-6xl mx-auto p-6 space-y-10">
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tham gia thi nhanh</h2>
            <form onSubmit={handleJoinByCode} className="flex gap-2">
              <input type="text" placeholder="Nhập mã code..." className="flex-1 border-2 rounded-xl px-4 py-3 font-mono uppercase focus:border-blue-500 outline-none" value={searchCode} onChange={(e) => setSearchCode(e.target.value)} />
              <button type="submit" className="bg-blue-600 text-white px-6 rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2 transition"><Search size={20} /> Vào Thi</button>
            </form>
          </div>
          <Link to="/exam/create" className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:scale-105 transition shadow-lg"><PlusCircle size={20} /> Tạo Đề Mới</Link>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Layers className="text-blue-600" /> Đề thi của tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myExams.length > 0 ? myExams.map((e) => renderExamCard(e, true)) : <p className="text-gray-400 italic">Bạn chưa tạo đề thi nào.</p>}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><Globe className="text-green-600" /> Thư viện công khai</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {visiblePublicExams.map((e) => renderExamCard(e, false))}
          </div>
          {publicExams.length > 4 && (
            <div className="flex justify-center">
              <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-2 px-6 py-2 bg-white border rounded-full shadow-sm text-gray-700 hover:text-blue-600 transition">
                {isExpanded ? <>Thu gọn <ChevronUp size={18} /></> : <>Xem tất cả <ChevronDown size={18} /></>}
              </button>
            </div>
          )}
        </section>
      </main>

      {/* --- CỬA SỔ CHATBOT THON GỌN --- */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isChatOpen && (
          <div className="bg-white w-[320px] sm:w-[350px] rounded-2xl shadow-2xl border border-gray-200 mb-4 flex flex-col animate-in slide-in-from-bottom-5 zoom-in-95 duration-200" style={{ height: '460px' }}>
            {/* Header Chat */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-3 px-4 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-bold flex items-center gap-2 text-sm"><Sparkles size={16}/> Trợ lý AI Smart Quiz</h3>
              <button onClick={() => setIsChatOpen(false)} className="hover:text-gray-300 transition-colors p-1"><X size={18}/></button>
            </div>
            
            {/* Nội dung Chat */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm whitespace-pre-wrap'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none text-sm text-gray-500 italic flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Footer Chat: Cảnh báo nhỏ & Input */}
            <div className="p-3 bg-white border-t border-gray-200 rounded-b-2xl">
              <p className="text-[11px] text-gray-500 mb-2 flex items-center gap-1 justify-center bg-gray-50 py-1 rounded-md">
                <AlertCircle size={12} className="shrink-0 text-amber-500"/> AI có thể mắc lỗi. Vui lòng kiểm tra lại.
              </p>
              
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder="Hỏi AI..." 
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100 transition"
                />
                <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-300 transition shrink-0">
                  <Send size={16}/>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- NÚT BẬT/TẮT CHATBOT SIÊU NỔI BẬT --- */}
        <div className="relative flex items-center gap-3">
          {/* Bong bóng chữ thu hút sự chú ý khi đang đóng */}
          {!isChatOpen && (
            <div className="bg-white px-4 py-2 rounded-xl shadow-lg border border-blue-100 text-blue-600 font-bold text-sm animate-bounce hidden sm:block relative">
              Hỏi AI ngay! 👋
              {/* Mũi tên trỏ vào nút */}
              <div className="absolute top-1/2 -right-1.5 transform -translate-y-1/2 w-3 h-3 bg-white border-r border-t border-blue-100 rotate-45"></div>
            </div>
          )}
          
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)} 
            className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center justify-center z-10"
          >
            {/* Vòng sáng nhấp nháy tỏa ra phía sau khi đang đóng */}
            {!isChatOpen && (
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></span>
            )}
            
            <span className="relative z-10">
              {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;