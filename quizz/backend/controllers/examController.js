const db = require("../config/db");
const xlsx = require("xlsx");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite",
  systemInstruction: "Bạn là trợ lý tạo câu hỏi Quiz. Chỉ trả lời nội dung chính, không chào hỏi, không giải thích dài dòng. Phản hồi dưới dạng JSON."
 }); // Giữ nguyên theo ý bạn

function generateExamCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// =================================================================
// 1. QUẢN LÝ ĐỀ THI
// =================================================================

// [POST] Tạo đề thi
exports.createExam = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      questions,
      is_public = 1,
      allow_practice = 1,
    } = req.body;
    const userId = req.user.id;
    const code = generateExamCode();

    const [result] = await db.query(
      `INSERT INTO exams (title, description, duration, code, created_by, is_public, allow_practice) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, description, duration, code, userId, is_public, allow_practice],
    );
    const examId = result.insertId;

    if (questions && questions.length > 0) {
      for (const q of questions) {
        const [qRes] = await db.query(
          "INSERT INTO questions (exam_id, question_text) VALUES (?, ?)",
          [examId, q.question_text],
        );
        const qId = qRes.insertId;
        const optionValues = q.options.map((opt) => [
          qId,
          opt.option_text,
          opt.is_correct,
        ]);
        await db.query(
          "INSERT INTO options (question_id, option_text, is_correct) VALUES ?",
          [optionValues],
        );
      }
    }
    res.status(201).json({ message: "Tạo đề thành công", examId, code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi tạo đề: " + err.message });
  }
};

// [PUT] Cập nhật Đề thi
exports.updateExamWithQuestions = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const examId = req.params.id;
    const {
      title,
      description,
      duration,
      is_public,
      allow_practice,
      questions,
    } = req.body;
    const userId = req.user.id;

    const [check] = await connection.query(
      "SELECT created_by FROM exams WHERE id = ?",
      [examId],
    );
    if (check.length === 0) {
      connection.release();
      return res.status(404).json({ message: "Không tìm thấy đề!" });
    }
    if (check[0].created_by !== userId && req.user.role !== "admin") {
      connection.release();
      return res.status(403).json({ message: "Không có quyền!" });
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE exams SET title=?, description=?, duration=?, is_public=?, allow_practice=? WHERE id=?`,
      [title, description, duration, is_public, allow_practice, examId],
    );

    if (questions && questions.length > 0) {
      for (const q of questions) {
        let currentQuestionId = q.id;
        if (currentQuestionId) {
          await connection.query(
            "UPDATE questions SET question_text=? WHERE id=?",
            [q.question_text, currentQuestionId],
          );
          await connection.query("DELETE FROM options WHERE question_id=?", [
            currentQuestionId,
          ]);
        } else {
          const [newQ] = await connection.query(
            "INSERT INTO questions (exam_id, question_text) VALUES (?, ?)",
            [examId, q.question_text],
          );
          currentQuestionId = newQ.insertId;
        }
        const optionValues = q.options.map((opt) => [
          currentQuestionId,
          opt.option_text,
          opt.is_correct,
        ]);
        if (optionValues.length > 0) {
          await connection.query(
            "INSERT INTO options (question_id, option_text, is_correct) VALUES ?",
            [optionValues],
          );
        }
      }
    }
    await connection.commit();
    connection.release();
    res.json({ message: "Cập nhật thành công!" });
  } catch (err) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ message: "Lỗi cập nhật: " + err.message });
  }
};

// [DELETE] Xóa đề thi
exports.deleteExam = async (req, res) => {
  try {
    const examId = req.params.id;
    const userId = req.user.id;
    const [exams] = await db.query(
      "SELECT created_by FROM exams WHERE id = ?",
      [examId],
    );
    if (exams.length === 0)
      return res.status(404).json({ message: "Đề thi không tồn tại!" });
    if (exams[0].created_by !== userId && req.user.role !== "admin")
      return res.status(403).json({ message: "Không có quyền xóa!" });

    await db.query("DELETE FROM exams WHERE id = ?", [examId]);
    res.json({ message: "Đã xóa đề thi!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xóa: " + err.message });
  }
};

// [POST] Import Excel
exports.importQuestionsFromExcel = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { exam_id } = req.body;
    const file = req.file;
    if (!exam_id || !file) {
      connection.release();
      return res.status(400).json({ message: "Thiếu dữ liệu!" });
    }

    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: "A", range: 1 });

    await connection.beginTransaction();
    let count = 0;
    for (const row of data) {
      const qText = row["A"];
      const correctChar = row["F"]
        ? row["F"].toString().trim().toUpperCase()
        : "";
      if (!qText || !correctChar) continue;

      const [qResult] = await connection.query(
        "INSERT INTO questions (exam_id, question_text) VALUES (?, ?)",
        [exam_id, qText],
      );
      const newQId = qResult.insertId;
      const options = [
        {
          text: row["B"],
          isCorrect: correctChar === "A" || correctChar === "1",
        },
        {
          text: row["C"],
          isCorrect: correctChar === "B" || correctChar === "2",
        },
        {
          text: row["D"],
          isCorrect: correctChar === "C" || correctChar === "3",
        },
        {
          text: row["E"],
          isCorrect: correctChar === "D" || correctChar === "4",
        },
      ];
      const optionsValues = options.map((o) => [newQId, o.text, o.isCorrect]);
      await connection.query(
        "INSERT INTO options (question_id, option_text, is_correct) VALUES ?",
        [optionsValues],
      );
      count++;
    }
    await connection.commit();
    connection.release();
    return res.json({ message: `Đã nhập ${count} câu hỏi!` });
  } catch (err) {
    await connection.rollback();
    connection.release();
    return res.status(500).json({ message: "Lỗi import: " + err.message });
  }
};

// Các hàm phụ (giữ chỗ)
exports.addQuestion = async (req, res) => {
  res.status(501).json({ message: "Đang cập nhật..." });
};
exports.updateQuestion = async (req, res) => {
  try {
    const { question_text } = req.body;
    await db.query("UPDATE questions SET question_text = ? WHERE id = ?", [
      question_text,
      req.params.id,
    ]);
    res.json({ message: "Đã cập nhật!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =================================================================
// 2. RETRIEVAL (LẤY DỮ LIỆU)
// =================================================================

exports.getAllExams = async (req, res) => {
  try {
    const sql = `SELECT e.*, u.full_name as author_name, (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count FROM exams e JOIN users u ON e.created_by = u.id WHERE e.is_public = 1 ORDER BY e.created_at DESC`;
    const [exams] = await db.query(sql);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.getMyExams = async (req, res) => {
  try {
    const userId = req.user.id;
    const sql = `SELECT e.*, (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count FROM exams e WHERE created_by = ? ORDER BY created_at DESC`;
    const [exams] = await db.query(sql, [userId]);
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy danh sách" });
  }
};

exports.getExamQuestions = async (req, res) => {
  try {
    const examId = req.params.id;
    const [exam] = await db.query("SELECT * FROM exams WHERE id = ?", [examId]);
    if (exam.length === 0)
      return res.status(404).json({ message: "Không tìm thấy" });

    const sql = `SELECT q.id AS q_id, q.question_text, o.id AS o_id, o.option_text, o.is_correct FROM questions q LEFT JOIN options o ON q.id = o.question_id WHERE q.exam_id = ? ORDER BY q.id, o.id`;
    const [rows] = await db.query(sql, [examId]);

    const questionsMap = {};
    rows.forEach((row) => {
      if (!questionsMap[row.q_id])
        questionsMap[row.q_id] = {
          id: row.q_id,
          question_text: row.question_text,
          options: [],
        };
      if (row.o_id)
        questionsMap[row.q_id].options.push({
          id: row.o_id,
          option_text: row.option_text,
          is_correct: row.is_correct,
        });
    });
    res.json({ exam: exam[0], questions: Object.values(questionsMap) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExamByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { mode } = req.query;
    const cleanCode = code.replace(/^#/, "").trim().toUpperCase();

    const [exams] = await db.query("SELECT * FROM exams WHERE code = ?", [
      cleanCode,
    ]);
    if (exams.length === 0)
      return res.status(404).json({ message: "Sai mã đề!" });
    const exam = exams[0];

    if (mode === "practice" && exam.allow_practice === 0)
      return res.status(403).json({ message: "Đề này không cho phép ôn tập!" });

    const [questions] = await db.query(
      "SELECT * FROM questions WHERE exam_id = ?",
      [exam.id],
    );
    for (const q of questions) {
      const fields =
        mode === "practice" ? "id, option_text, is_correct" : "id, option_text";
      if (mode !== "practice") delete q.ai_explanation;
      const [options] = await db.query(
        `SELECT ${fields} FROM options WHERE question_id = ?`,
        [q.id],
      );
      q.options = options;
    }
    res.json({ exam, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// =================================================================
// 3. XỬ LÝ KẾT QUẢ & AI & THỐNG KÊ
// =================================================================

exports.submitExam = async (req, res) => {
  try {
    const { exam_id, answers } = req.body;
    const user_id = req.user.id;

    const [correctOpts] = await db.query(
      "SELECT q.id as q_id, o.id as o_id FROM questions q JOIN options o ON q.id=o.question_id WHERE q.exam_id=? AND o.is_correct=1",
      [exam_id],
    );
    const correctMap = {};
    correctOpts.forEach((r) => (correctMap[r.q_id] = r.o_id));

    let scoreCount = 0;
    answers.forEach((a) => {
      if (correctMap[a.question_id] === a.option_id) scoreCount++;
    });
    const finalScore =
      correctOpts.length > 0 ? (scoreCount / correctOpts.length) * 10 : 0;

    const [resHeader] = await db.query(
      "INSERT INTO results (user_id, exam_id, score) VALUES (?, ?, ?)",
      [user_id, exam_id, finalScore],
    );
    const resultId = resHeader.insertId;

    if (answers.length > 0) {
      const details = answers.map((a) => [
        resultId,
        a.question_id,
        a.option_id,
        correctMap[a.question_id] === a.option_id,
      ]);
      await db.query(
        "INSERT INTO exam_answers (result_id, question_id, selected_option_id, is_correct) VALUES ?",
        [details],
      );
    }
    res.json({
      message: "Nộp bài thành công!",
      result_id: resultId,
      score: finalScore.toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.checkAnswer = async (req, res) => {
  try {
    const { question_id, option_id } = req.body;
    const query = `SELECT o.is_correct, q.id as q_id, q.ai_explanation FROM options o JOIN questions q ON o.question_id = q.id WHERE o.id = ? AND o.question_id = ?`;
    const [rows] = await db.query(query, [option_id, question_id]);

    if (rows.length === 0)
      return res.status(404).json({ message: "Lỗi dữ liệu" });
    res.json({
      is_correct: !!rows[0].is_correct,
      ai_explanation: rows[0].ai_explanation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.explainQuestion = async (req, res) => {
  try {
    const { question_id } = req.body;
    const [qRows] = await db.query(
      `SELECT question_text, ai_explanation, (SELECT option_text FROM options WHERE question_id = ? AND is_correct = 1 LIMIT 1) as correct_text FROM questions WHERE id = ?`,
      [question_id, question_id],
    );
    if (qRows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy câu hỏi" });

    let explanation = qRows[0].ai_explanation;
    if (!explanation) {
      console.log("🤖 Đang gọi AI...");
      if (!process.env.GEMINI_API_KEY) throw new Error("Thiếu API Key");
      const prompt = `Giải thích ngắn gọn tại sao đáp án "${qRows[0].correct_text}" là đúng cho câu hỏi: "${qRows[0].question_text}"?`;
      const result = await model.generateContent(prompt);
      explanation = result.response.text();
      await db.query("UPDATE questions SET ai_explanation = ? WHERE id = ?", [
        explanation,
        question_id,
      ]);
    }
    res.json({ ai_explanation: explanation });
  } catch (err) {
    console.error("Lỗi AI:", err);
    res.json({
      ai_explanation:
        "Hệ thống AI hiện đang quá tải lượt truy cập. Đáp án đúng là: " +
        qRows[0].correct_text,
    });
  }
};

exports.getExamResult = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      `SELECT r.*, e.title, e.code, u.full_name, (SELECT COUNT(*) FROM exam_answers WHERE result_id=r.id AND is_correct=1) as correct_count, (SELECT COUNT(*) FROM exam_answers WHERE result_id=r.id) as total_questions FROM results r JOIN exams e ON r.exam_id=e.id JOIN users u ON r.user_id=u.id WHERE r.id=? AND r.user_id=?`,
      [id, req.user.id],
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Không tìm thấy" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getExamResults = async (req, res) => {
  try {
    const [exams] = await db.query("SELECT created_by FROM exams WHERE id=?", [
      req.params.id,
    ]);
    if (
      exams.length === 0 ||
      (exams[0].created_by !== req.user.id && req.user.role !== "admin")
    )
      return res.status(403).json({ message: "Không có quyền" });
    const [results] = await db.query(
      "SELECT r.score, r.created_at, u.full_name FROM results r JOIN users u ON r.user_id=u.id WHERE r.exam_id=? ORDER BY r.score DESC",
      [req.params.id],
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// [GET] Lấy chi tiết bài làm (Từng câu hỏi và đáp án đã chọn)
exports.getExamResultDetail = async (req, res) => {
  try {
    const { id } = req.params; // Đây là result_id (ID của lượt làm bài)

    // Query phức tạp: Lấy câu hỏi, đáp án thí sinh chọn, và đáp án đúng
    const query = `
            SELECT 
                q.question_text,
                o_selected.option_text AS selected_text,
                ea.is_correct,
                -- Subquery để lấy đáp án đúng (trong trường hợp thí sinh chọn sai)
                (SELECT option_text FROM options WHERE question_id = q.id AND is_correct = 1 LIMIT 1) AS correct_text
            FROM exam_answers ea
            JOIN questions q ON ea.question_id = q.id
            LEFT JOIN options o_selected ON ea.selected_option_id = o_selected.id
            WHERE ea.result_id = ?
        `;

    const [details] = await db.query(query, [id]);
    res.json(details);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
};
// 👇 ĐÂY LÀ HÀM BẠN CẦN (Đã đặt đúng vị trí)
exports.getExamStats = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 1. Check quyền
    const [examRows] = await db.query(
      "SELECT title, created_by FROM exams WHERE id = ?",
      [id],
    );
    if (examRows.length === 0)
      return res.status(404).json({ message: "Đề thi không tồn tại" });

    if (examRows[0].created_by !== userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Không có quyền xem thống kê." });
    }

    // 2. Lấy thống kê
    // 👇 SỬA TẠI ĐÂY: Thay u.email bằng u.username (hoặc xóa hẳn dòng đó nếu không cần)
    const query = `
            SELECT 
                r.id, 
                r.score, 
                r.created_at as submitted_at,
                u.full_name,
                u.username,  -- Sử dụng username thay vì email
                (SELECT COUNT(*) FROM exam_answers WHERE result_id = r.id AND is_correct = 1) as correct_count,
                (SELECT COUNT(*) FROM exam_answers WHERE result_id = r.id) as total_questions
            FROM results r
            JOIN users u ON r.user_id = u.id
            WHERE r.exam_id = ?
            ORDER BY r.score DESC
        `;

    const [stats] = await db.query(query, [id]);

    // Map dữ liệu để Frontend không bị lỗi hiển thị
    const safeStats = stats.map((s) => ({
      ...s,
      email: s.username || "Không có", // Gán username vào chỗ email để hiển thị
    }));

    res.json({
      exam_title: examRows[0].title,
      total_attempts: stats.length,
      stats: safeStats,
    });
  } catch (err) {
    console.error("Lỗi lấy thống kê:", err);
    res.status(500).json({ message: "Lỗi server: " + err.message });
  }
};
