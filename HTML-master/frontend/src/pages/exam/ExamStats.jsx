import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import {
  ArrowLeft, BarChart3, Download, Loader2, Eye, X, CheckCircle2, XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";

const ExamStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [stats, setStats] = useState([]);
  const [examTitle, setExamTitle] = useState("");
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedResult, setSelectedResult] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [details, setDetails] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/exams/${id}/stats`);
        const data = res.data || res; // Sửa lỗi cấu trúc dữ liệu
        setStats(data.stats || []);
        setExamTitle(data.exam_title || "Đề thi");
        setTotalAttempts(data.total_attempts || 0);
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [id]);

  const handleViewDetail = async (result) => {
    setSelectedResult(result);
    setDetailLoading(true);
    try {
      const res = await api.get(`/exams/result-detail/${result.id}`);
      setDetails(res.data || res);
    } catch (error) {
      alert("Không thể tải chi tiết bài làm");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-6xl mx-auto p-6 mt-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-sm border">
          <div className="flex items-center gap-4 w-full">
            <button onClick={() => navigate("/dashboard")} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><ArrowLeft size={20}/></button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><BarChart3 className="text-blue-600" /> Thống kê: {examTitle}</h1>
              <p className="text-gray-500 text-sm">Tổng lượt làm bài: <span className="font-bold text-blue-600">{totalAttempts}</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 uppercase text-xs font-bold border-b">
                <th className="p-4 text-center">Top</th>
                <th className="p-4">Thí sinh</th>
                <th className="p-4 text-center">Điểm số</th>
                <th className="p-4 text-center">Kết quả</th>
                <th className="p-4 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50 transition">
                  <td className="p-4 text-center font-bold text-gray-400">{index + 1}</td>
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{item.full_name}</div>
                    <div className="text-xs text-gray-400">{item.email}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-lg font-black ${item.score >= 8 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{Number(item.score).toFixed(1)}</span>
                  </td>
                  <td className="p-4 text-center">{item.correct_count}/{item.total_questions}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleViewDetail(item)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"><Eye size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal chi tiết giữ nguyên logic nhưng tối ưu UI */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="font-bold text-gray-800">Chi tiết bài làm: {selectedResult.full_name}</h3>
              <button onClick={() => setSelectedResult(null)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 bg-gray-50">
              {detailLoading ? <Loader2 className="animate-spin mx-auto"/> : details.map((d, i) => (
                <div key={i} className={`p-4 rounded-xl border bg-white ${d.is_correct ? "border-green-200" : "border-red-200"}`}>
                  <p className="font-bold text-gray-800 mb-2">Câu {i + 1}: {d.question_text}</p>
                  <div className="text-sm space-y-1">
                    <p className={d.is_correct ? "text-green-600 font-bold" : "text-red-600 font-bold"}>Đã chọn: {d.selected_text || "Không chọn"}</p>
                    {!d.is_correct && <p className="text-green-600 font-bold">Đáp án đúng: {d.correct_text}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamStats;