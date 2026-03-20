import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Sparkles, ArrowLeft, CheckCircle2, XCircle, Trophy, ChevronRight, RefreshCcw, AlertCircle } from "lucide-react";

const PracticeRoom = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  
  const [allQuestions, setAllQuestions] = useState([]); // Lưu toàn bộ câu hỏi gốc
  const [currentQueue, setCurrentQueue] = useState([]); // Danh sách câu hỏi đang làm (có thể là toàn bộ hoặc chỉ câu sai)
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [results, setResults] = useState({}); // Lưu kết quả: { qId: { isCorrect, selectedId } }
  const [aiExplanations, setAiExplanations] = useState({});
  const [loadingAI, setLoadingAI] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/exams/code/${code}?mode=practice`);
        const data = res.questions || [];
        setAllQuestions(data);
        setCurrentQueue(data);
      } catch (error) {
        console.error("Lỗi tải đề:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    fetchPractice();
  }, [code, navigate]);

  const handleSelect = (opt) => {
    const currentQ = currentQueue[currentIdx];
    if (results[currentQ.id]) return; // Không cho chọn lại khi đã hiện đáp án

    const isCorrect = opt.is_correct === 1 || opt.is_correct === true;
    setResults(prev => ({
      ...prev,
      [currentQ.id]: { isCorrect, selectedId: opt.id }
    }));
  };

  const handleNext = () => {
    if (currentIdx < currentQueue.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleRetryErrors = () => {
    // Lọc ra các câu làm sai trong lượt vừa rồi
    const errorQuestions = currentQueue.filter(q => !results[q.id]?.isCorrect);
    
    setCurrentQueue(errorQuestions);
    setCurrentIdx(0);
    setResults({});
    setIsFinished(false);
  };

  const handleAskAI = async (qId) => {
    setLoadingAI(qId);
    try {
      const res = await api.post("/exams/explain-question", { question_id: qId });
      setAiExplanations(prev => ({ ...prev, [qId]: res.ai_explanation }));
    } catch (error) {
      alert("AI đang bận, thử lại sau nhé!");
    } finally {
      setLoadingAI(null);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-500">Đang chuẩn bị phòng ôn tập...</div>;

  if (isFinished) {
    const correctCount = currentQueue.filter(q => results[q.id]?.isCorrect).length;
    const errorCount = currentQueue.length - correctCount;
    const accuracy = Math.round((correctCount / currentQueue.length) * 100);

    return (
      <div className="max-w-2xl mx-auto mt-10 p-10 bg-white rounded-3xl shadow-xl border text-center">
        <Trophy className="mx-auto text-yellow-500 mb-6" size={80} />
        <h2 className="text-3xl font-black text-gray-800 mb-2">Kết Quả Lượt Này</h2>
        <p className="text-gray-500 mb-8">Bạn đã hoàn thành {currentQueue.length} câu hỏi.</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
            <p className="text-xs text-green-600 font-black uppercase">Chính xác</p>
            <p className="text-4xl font-black text-green-900">{accuracy}%</p>
          </div>
          <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
            <p className="text-xs text-red-600 font-black uppercase">Sai</p>
            <p className="text-4xl font-black text-red-900">{errorCount}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {errorCount > 0 ? (
            <button onClick={handleRetryErrors} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 flex items-center justify-center gap-2">
              <RefreshCcw size={20}/> Ôn lại {errorCount} câu sai
            </button>
          ) : (
            <div className="p-4 bg-green-100 text-green-700 rounded-xl font-bold mb-2">Tuyệt vời! Bạn đã đúng hết các câu trong lượt này.</div>
          )}
          <button onClick={() => navigate("/")} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition">Về Trang Chủ</button>
        </div>
      </div>
    );
  }

  const currentQ = currentQueue[currentIdx];
  const currentResult = results[currentQ.id];
  const progress = Math.round(((currentIdx + 1) / currentQueue.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* THANH TIẾN ĐỘ */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <button onClick={() => navigate("/")} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 font-bold text-sm">
            <ArrowLeft size={16}/> THOÁT
          </button>
          <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Câu {currentIdx + 1} / {currentQueue.length}</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full border border-gray-200">
          <div className="h-full bg-blue-600 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-8 leading-relaxed">{currentQ.question_text}</h2>

        <div className="space-y-3">
          {currentQ.options.map((opt) => {
            const isSelected = currentResult?.selectedId === opt.id;
            const isCorrect = opt.is_correct === 1 || opt.is_correct === true;
            
            let style = "border-gray-100 bg-gray-50 text-gray-700";
            if (currentResult) {
              if (isCorrect) style = "border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500/20";
              else if (isSelected) style = "border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500/20";
            }

            return (
              <button 
                key={opt.id} 
                disabled={!!currentResult}
                onClick={() => handleSelect(opt)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center font-medium ${style} ${!currentResult && "hover:border-blue-300 hover:bg-white active:scale-[0.98]"}`}
              >
                {opt.option_text}
                {currentResult && isCorrect && <CheckCircle2 size={20} className="text-green-600" />}
                {isSelected && !isCorrect && <XCircle size={20} className="text-red-600" />}
              </button>
            );
          })}
        </div>

        {/* NÚT TIẾP THEO - CHỈ HIỆN KHI ĐÃ CHỌN ĐÁP ÁN */}
        {currentResult && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-between border-t pt-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              {currentResult.isCorrect ? (
                <span className="text-green-600 flex items-center gap-1"><CheckCircle2 size={16}/> Chính xác!</span>
              ) : (
                <span className="text-red-600 flex items-center gap-1"><AlertCircle size={16}/> Rất tiếc, câu này chưa đúng.</span>
              )}
            </div>
            <button onClick={handleNext} className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg transition active:scale-95">
              {currentIdx === currentQueue.length - 1 ? "Xem kết quả" : "Tiếp theo"} <ChevronRight size={20}/>
            </button>
          </div>
        )}

        {/* GIẢI THÍCH AI */}
        {currentResult && (
          <div className="mt-6 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-indigo-900 flex items-center gap-2"><Sparkles size={18}/> Giải thích AI</h4>
              {!aiExplanations[currentQ.id] && (
                <button onClick={() => handleAskAI(currentQ.id)} disabled={loadingAI === currentQ.id} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition">
                  {loadingAI === currentQ.id ? "Đang suy nghĩ..." : "Hỏi AI tại sao?"}
                </button>
              )}
            </div>
            {aiExplanations[currentQ.id] && <p className="text-sm text-indigo-800 leading-relaxed">{aiExplanations[currentQ.id]}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeRoom;