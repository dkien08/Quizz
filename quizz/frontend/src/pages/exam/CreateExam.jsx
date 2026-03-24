import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../../services/axiosClient";
import { useNavigate, useParams } from "react-router-dom";
import {
  Save,
  Upload,
  PlusCircle,
  Trash2,
  FileType,
  BookOpen,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
} from "lucide-react";

const CreateExam = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    duration: 45,
    is_public: 1,
  });
  const [allowPractice, setAllowPractice] = useState(true);
  const [questions, setQuestions] = useState([]);

  // --- QUẢN LÝ MODAL & THÔNG BÁO ---
  const [notification, setNotification] = useState(null); // Dùng cho bảng to lúc Lưu bài
  const [deleteIndex, setDeleteIndex] = useState(null);
  
  // MỚI: Dùng cho thông báo nhỏ tự động tắt (Toast) khi Import Excel
  const [toast, setToast] = useState(null);

  // Tải dữ liệu cũ khi ở chế độ chỉnh sửa
  useEffect(() => {
    if (isEditMode) {
      const fetchOldData = async () => {
        try {
          const res = await api.get(`/exams/${id}/questions`);
          if (res) {
            const { exam, questions: oldQuestions } = res;
            setExamData({
              title: exam.title,
              description: exam.description || "",
              duration: exam.duration,
              is_public: exam.is_public,
            });
            setAllowPractice(exam.allow_practice === 1 || exam.allow_practice === true);
            setQuestions(oldQuestions || []);
          }
        } catch (error) {
          setNotification({ type: "error", message: "Không thể tải dữ liệu đề thi!" });
          setTimeout(() => navigate("/"), 2000);
        }
      };
      fetchOldData();
    }
  }, [id, isEditMode, navigate]);

  // Hàm hiển thị thông báo nhỏ tự động tắt
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000); // Tự tắt sau 3 giây
  };

  // --- XỬ LÝ FILE EXCEL ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const importedQuestions = [];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          if (!row[0]) continue;
          const correctAnswerChar = row[5] ? row[5].toString().trim().toUpperCase() : "A";
          importedQuestions.push({
            question_text: row[0],
            options: [
              { option_text: row[1] || "", is_correct: correctAnswerChar === "A" },
              { option_text: row[2] || "", is_correct: correctAnswerChar === "B" },
              { option_text: row[3] || "", is_correct: correctAnswerChar === "C" },
              { option_text: row[4] || "", is_correct: correctAnswerChar === "D" },
            ],
          });
        }
        setQuestions((prev) => [...prev, ...importedQuestions]);
        
        // Thay vì setNotification (bảng to), ta dùng showToast (bảng nhỏ)
        showToast(`Đã tải lên thành công ${importedQuestions.length} câu hỏi!`);
      } catch (err) {
        showToast("Lỗi đọc file Excel. Định dạng không hợp lệ!", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Reset input để có thể chọn lại cùng 1 file nếu cần
  };

  // --- QUẢN LÝ CÂU HỎI ---
  const addManualQuestion = () => {
    setQuestions([...questions, {
      question_text: "",
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
      ],
    }]);
  };

  const updateQuestion = (index, field, value) => {
    const newQ = [...questions];
    newQ[index][field] = value;
    setQuestions(newQ);
  };

  const updateOption = (qIdx, oIdx, value) => {
    const newQ = [...questions];
    newQ[qIdx].options[oIdx].option_text = value;
    setQuestions(newQ);
  };

  const setCorrectOption = (qIdx, oIdx) => {
    const newQ = [...questions];
    newQ[qIdx].options.forEach((opt, idx) => (opt.is_correct = idx === oIdx));
    setQuestions(newQ);
  };

  const executeDelete = () => {
    if (deleteIndex !== null) {
      const newQuestions = [...questions];
      newQuestions.splice(deleteIndex, 1);
      setQuestions(newQuestions);
      setDeleteIndex(null);
    }
  };

  // --- GỬI DỮ LIỆU LÊN BACKEND ---
  const handleSubmit = async () => {
    if (!examData.title) return setNotification({ type: "error", message: "Vui lòng nhập tên đề thi!" });
    if (questions.length === 0) return setNotification({ type: "error", message: "Đề thi cần có ít nhất 1 câu hỏi!" });

    setLoading(true);
    try {
      const payload = { 
        ...examData, 
        allow_practice: allowPractice ? 1 : 0,
        questions 
      };

      if (isEditMode) {
        await api.put(`/exams/${id}`, payload);
        setNotification({ type: "success", message: "Cập nhật thành công!" });
      } else {
        await api.post("/exams/create", payload);
        setNotification({ type: "success", message: "Tạo đề thi mới thành công!" });
      }
    } catch (error) {
      setNotification({ type: "error", message: error.response?.data?.message || "Lỗi khi lưu đề." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-20 relative">
      
      {/* MỚI: Hiển thị Toast thông báo nhỏ trên góc phải */}
      {toast && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-bold text-white animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/")} className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-3xl font-extrabold text-gray-900">{isEditMode ? "Chỉnh sửa đề thi" : "Tạo đề thi mới"}</h1>
      </div>

      <div className="space-y-8">
        {/* Thông tin cơ bản */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-blue-600"><FileType size={20}/> Thông tin đề thi</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đề thi</label>
              <input className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" value={examData.title} onChange={e => setExamData({...examData, title: e.target.value})} placeholder="VD: Kiểm tra cuối kỳ Mạng máy tính"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian thi thực tế (phút)</label>
              <input type="number" className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" value={examData.duration} onChange={e => setExamData({...examData, duration: parseInt(e.target.value)})}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none" value={examData.is_public} onChange={e => setExamData({...examData, is_public: parseInt(e.target.value)})}>
                <option value={1}>Công khai</option>
                <option value={0}>Riêng tư</option>
              </select>
            </div>
            <div className="md:col-span-2 flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div>
                <p className="font-bold text-blue-900">Cho phép Chế độ Ôn tập</p>
                {/* MỚI: Thêm ghi chú không giới hạn thời gian làm bài ôn tập */}
                <p className="text-xs text-blue-700 mt-1">
                  Người thi có thể xem đáp án ngay lập tức và dùng AI giải thích. <strong>Lưu ý: Phần ôn tập sẽ không giới hạn thời gian làm bài.</strong>
                </p>
              </div>
              <input type="checkbox" className="w-6 h-6 accent-blue-600 cursor-pointer" checked={allowPractice} onChange={e => setAllowPractice(e.target.checked)}/>
            </div>
          </div>
        </section>

        {/* Danh sách câu hỏi */}
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-bold text-gray-800">Câu hỏi ({questions.length})</h2>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl cursor-pointer hover:bg-green-700 transition font-bold shadow-md">
              <Upload size={18}/> Excel 
              <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload}/>
            </label>
            <button onClick={addManualQuestion} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition font-bold shadow-md">
              <PlusCircle size={18}/> Thêm câu
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative group animate-in slide-in-from-bottom-2">
              <button onClick={() => setDeleteIndex(qIdx)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition p-2"><Trash2 size={20}/></button>
              <div className="flex gap-4 mb-4">
                <span className="font-black text-blue-600 text-lg">#{qIdx + 1}</span>
                <textarea className="w-full border-none bg-gray-50 rounded-xl p-4 focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition resize-none font-medium" rows="2" value={q.question_text} onChange={e => updateQuestion(qIdx, "question_text", e.target.value)} placeholder="Nội dung câu hỏi..."/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-12">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-xl border transition ${opt.is_correct ? "border-green-500 bg-green-50" : "border-gray-100 bg-white"}`}>
                    <input type="radio" name={`correct-${qIdx}`} checked={opt.is_correct} onChange={() => setCorrectOption(qIdx, oIdx)} className="w-5 h-5 accent-green-600 cursor-pointer"/>
                    <input className="bg-transparent outline-none w-full text-sm font-medium" value={opt.option_text} onChange={e => updateOption(qIdx, oIdx, e.target.value)} placeholder={`Lựa chọn ${oIdx + 1}`}/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nút Save cố định */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-4 z-40">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-lg hover:bg-black hover:scale-105 transition shadow-2xl disabled:opacity-50">
            {loading ? "ĐANG LƯU..." : <><Save size={22}/> {isEditMode ? "LƯU THAY ĐỔI" : "XUẤT BẢN ĐỀ THI"}</>}
          </button>
        </div>
      </div>

      {/* Modals xác nhận & thông báo khi LƯU */}
      {deleteIndex !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={32}/></div>
            <h3 className="text-xl font-bold mb-2">Xóa câu hỏi này?</h3>
            <p className="text-gray-500 mb-6">Bạn sẽ không thể khôi phục lại dữ liệu này.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteIndex(null)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
              <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700">Xóa ngay</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative">
            <button onClick={() => setNotification(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X/></button>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {notification.type === 'success' ? <CheckCircle size={48}/> : <XCircle size={48}/>}
            </div>
            <h3 className="text-2xl font-black mb-2">{notification.type === 'success' ? "Thành công!" : "Lỗi rồi!"}</h3>
            <p className="text-gray-600 mb-8">{notification.message}</p>
            {notification.type === 'success' ? (
              <button onClick={() => navigate("/")} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black shadow-lg">Về Dashboard</button>
            ) : (
              <button onClick={() => setNotification(null)} className="w-full py-4 bg-gray-100 text-gray-800 rounded-2xl font-bold hover:bg-gray-200">Thử lại</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateExam;