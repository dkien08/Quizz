const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");

// Cấu hình multer để lưu file vào bộ nhớ đệm (buffer) trước khi xử lý
const upload = multer({ storage: multer.memoryStorage() });

// --- NHÓM 1: CÁC TỪ KHÓA CỐ ĐỊNH ---
// Ưu tiên đặt các route tĩnh lên trên để Express không nhầm với tham số :id

// 1. Lấy danh sách đề thi của tôi
router.get("/my-exams", authMiddleware, examController.getMyExams);

// 2. Tạo đề thi thủ công
router.post("/create", authMiddleware, examController.createExam);

// 3. Import đề thi từ file Excel (MỚI BỔ SUNG)
// Frontend cần gửi dạng multipart/form-data với key của file là 'file'
router.post(
  "/import-excel", 
  authMiddleware, 
  upload.single("file"), 
  examController.importQuestionsFromExcel
);

// 4. Nộp bài thi
router.post("/submit", authMiddleware, examController.submitExam);

// 5. Kiểm tra đáp án (Chế độ ôn tập)
router.post("/check-answer", authMiddleware, examController.checkAnswer);

// 6. Yêu cầu AI giải thích câu hỏi
router.post("/explain-question", authMiddleware, examController.explainQuestion);

// 7. Lấy danh sách tất cả đề public (Trang chủ)
router.get("/", examController.getAllExams);


// --- NHÓM 2: CÁC THAM SỐ CODE ---

// 8. Vào thi bằng mã Code (Quan trọng nhất)
router.get("/code/:code", examController.getExamByCode);


// --- NHÓM 3: CÁC THAM SỐ ID ---
// Đặt cuối cùng để tránh tranh chấp với các route tĩnh ở trên

// 9. Lấy chi tiết bài làm dựa trên result_id
router.get("/result-detail/:id", authMiddleware, examController.getExamResultDetail);

// 10. Lấy thông tin kết quả tổng quát
router.get("/result/:id", authMiddleware, examController.getExamResult);

// 11. Lấy danh sách câu hỏi để sửa đề
router.get("/:id/questions", authMiddleware, examController.getExamQuestions);

// 12. Cập nhật/Sửa đề thi
router.put("/:id", authMiddleware, examController.updateExamWithQuestions);

// 13. Xóa đề thi
router.delete("/:id", authMiddleware, examController.deleteExam);

// 14. Lấy danh sách kết quả của một đề thi
router.get("/:id/results", authMiddleware, examController.getExamResults);

// 15. Xem thống kê chi tiết của đề thi
router.get("/:id/stats", authMiddleware, examController.getExamStats);

module.exports = router;