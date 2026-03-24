import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/axiosClient";
import {
  Clock, CheckCircle, FileText, Send, AlertTriangle, X, Trophy
} from "lucide-react";

const ExamRoom = () => {
  const { code } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  const [examResult, setExamResult] = useState(null); 
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answersRef = useRef({});

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/exams/code/${code}`);
        const data = res.data || res;
        if (data && data.exam) {
          setExam(data.exam);
          setQuestions(shuffleArray(data.questions || []));
          
          const storageKey = `endTime_${code}`;
          let endTime = localStorage.getItem(storageKey);
          if (!endTime) {
            endTime = Date.now() + data.exam.duration * 60 * 1000;
            localStorage.setItem(storageKey, endTime);
          }

          const remaining = Math.round((endTime - Date.now()) / 1000);
          if (remaining <= 0) {
            localStorage.removeItem(storageKey);
            navigate("/");
          } else {
            setTimeLeft(remaining);
          }
        }
      } catch (error) {
        console.error("Lỗi tải đề:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [code, navigate]);

  useEffect(() => {
    if (!exam || timeLeft <= 0 || examResult) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, examResult]);

  const handleSelect = (qId, optionId) => {
    const newAnswers = { ...answers, [qId]: optionId };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;
  };

  const submitExam = async (autoSubmit = false) => {
    const finalAnswers = autoSubmit ? answersRef.current : answers;
    setIsSubmitting(true);
    
    const payload = {
      exam_id: exam.id,
      answers: Object.entries(finalAnswers).map(([qId, oId]) => ({
        question_id: parseInt(qId),
        option_id: oId,
      })),
    };

    try {
      const res = await api.post("/exams/submit", payload);
      localStorage.removeItem(`endTime_${code}`);
      setExamResult(res.data || res);
      setShowSubmitModal(false);
    } catch (error) {
      console.error("Lỗi nộp bài:", error);
      alert("Nộp bài thất bại, vui lòng kiểm tra kết nối!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 italic">Đang tải đề thi...</div>;

  // --- MÀN HÌNH KẾT QUẢ TIN GỌN (CHỈ CÒN ĐIỂM & TỔNG CÂU) ---
  if (examResult) {
    const score = parseFloat(examResult.score || 0).toFixed(1);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-sm w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-gray-100 animate-in zoom-in-95 duration-300">
          <Trophy className="mx-auto text-yellow-500 mb-6" size={72} />
          <h1 className="text-2xl font-black text-gray-800 mb-8 uppercase italic tracking-tight">Hoàn thành</h1>
          
          <div className="bg-slate-900 rounded-3xl p-8 mb-6 text-white shadow-xl relative overflow-hidden">
            <p className="text-gray-400 font-bold mb-1 uppercase text-[10px] tracking-widest relative z-10">Điểm số của bạn</p>
            <p className="text-7xl font-black leading-none relative z-10">{score}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 mb-8">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tổng số câu hỏi</p>
            <p className="text-2xl font-black text-gray-700">{questions.length} câu</p>
          </div>

          <button onClick={() => navigate("/")} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition shadow-lg active:scale-95">VỀ TRANG CHỦ</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <div className="max-w-6xl mx-auto p-4 md:p-6 mt-4 flex flex-col md:flex-row gap-6 font-sans">
        <div className="flex-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6 flex justify-between items-center">
            <h1 className="font-bold text-gray-800 text-lg flex gap-2 items-center"><FileText className="text-blue-600" /> {exam.title}</h1>
            <div className={`font-mono font-bold px-4 py-2 rounded-xl border-2 ${timeLeft < 300 ? "border-red-500 text-red-600 animate-pulse bg-red-50" : "border-blue-100 text-blue-600 bg-blue-50"}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border min-h-[500px] flex flex-col">
            <div className="mb-8 text-sm text-gray-400 font-black flex justify-between border-b pb-4">
              <span>CÂU {currentQIndex + 1} / {questions.length}</span>
              <span className="text-blue-600">Đã chọn: {answeredCount} câu</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-10 leading-relaxed font-sans">{currentQ?.question_text}</h2>
            <div className="space-y-4 flex-1 font-sans">
              {currentQ?.options?.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <div key={opt.id} onClick={() => handleSelect(currentQ.id, opt.id)} className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${isSelected ? "border-blue-600 bg-blue-50 ring-4 ring-blue-500/10" : "border-gray-100 hover:border-blue-300 hover:bg-gray-50 font-sans"}`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex justify-center items-center mr-4 shrink-0 transition-colors ${isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-base font-semibold font-sans ${isSelected ? "text-blue-900" : "text-gray-600"}`}>{opt.option_text}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-12 flex justify-between pt-6 border-t font-sans">
              <button onClick={() => setCurrentQIndex(p => Math.max(0, p - 1))} disabled={currentQIndex === 0} className="px-8 py-3 border-2 text-gray-500 font-bold rounded-xl hover:bg-gray-100 disabled:opacity-30 font-sans">Quay lại</button>
              {currentQIndex === questions.length - 1 ? (
                <button onClick={() => setShowSubmitModal(true)} className="px-10 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex gap-2 items-center shadow-lg active:scale-95 font-sans font-sans">Nộp bài <Send size={18} /></button>
              ) : (
                <button onClick={() => setCurrentQIndex(p => Math.min(questions.length - 1, p + 1))} className="px-10 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all font-sans">Tiếp theo</button>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-6 font-sans">
          <div className="bg-white p-8 rounded-3xl shadow-sm border text-center sticky top-6">
            <div className="text-gray-400 text-xs mb-2 font-black uppercase tracking-widest font-sans">Thời gian còn lại</div>
            <div className={`text-4xl font-mono font-black flex justify-center gap-2 items-center ${timeLeft < 300 ? "text-red-600 animate-pulse" : "text-slate-800"}`}>
              <Clock size={28} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border font-sans">
            <h3 className="font-bold text-gray-700 mb-5 flex gap-2 items-center text-sm font-sans"><CheckCircle size={18} className="text-green-500" /> Bảng câu hỏi</h3>
            <div className="grid grid-cols-5 gap-2.5 font-sans">
              {questions.map((q, idx) => (
                <button key={idx} onClick={() => setCurrentQIndex(idx)} className={`h-10 rounded-xl font-bold text-xs transition-all ${idx === currentQIndex ? "ring-2 ring-blue-500 ring-offset-2 scale-110 z-10" : ""} ${answers[q.id] ? "bg-blue-600 text-white shadow-md shadow-blue-200 font-sans" : "bg-gray-100 text-gray-400"}`}>{idx + 1}</button>
              ))}
            </div>
            <button onClick={() => setShowSubmitModal(true)} className="w-full mt-8 py-4 bg-red-50 text-red-600 font-black rounded-2xl text-xs border-2 border-transparent hover:border-red-100 hover:bg-red-100 transition-all uppercase tracking-widest font-sans">Nộp bài sớm</button>
          </div>
        </div>
      </div>

      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm p-10 relative text-center">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500"><AlertTriangle size={40} /></div>
              <h3 className="text-2xl font-black text-gray-800 mb-3 italic tracking-tight font-sans">Xác nhận nộp bài?</h3>
              <p className="text-gray-500 mb-8 font-medium leading-relaxed font-sans">Bạn đã hoàn thành <span className="font-bold text-blue-600 text-lg">{answeredCount}</span> / {questions.length} câu hỏi.</p>
              <div className="flex flex-col gap-3 font-sans">
                <button onClick={() => submitExam(false)} disabled={isSubmitting} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-black shadow-xl disabled:opacity-50 transition active:scale-95 font-sans font-sans">{isSubmitting ? "Đang nộp..." : "Nộp ngay"}</button>
                <button onClick={() => setShowSubmitModal(false)} className="w-full py-4 border-2 border-gray-100 rounded-2xl font-bold text-gray-400 font-sans">Kiểm tra lại</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamRoom;