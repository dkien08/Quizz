const { GoogleGenerativeAI } = require("@google/generative-ai");

// Dùng chung Key với bên Exam (nhớ đảm bảo Key đã hoạt động tốt như lúc nãy)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite",
  systemInstruction: "Chỉ trả lời nội dung chính, ngắn gọn và dễ hiểu"
 });

exports.askChatbot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Bạn chưa nhập câu hỏi!" });
    }

    // --- CẤU HÌNH PROMPT MỚI (TOÀN DIỆN HƠN) ---
    // Thay vì ép AI làm "giáo viên IT", ta bảo nó làm "Trợ lý học tập đa năng"
    const prompt = `
            Bạn là một Trợ lý AI học tập thông minh, thân thiện và hiểu biết rộng.
            Nhiệm vụ của bạn là hỗ trợ người dùng giải đáp thắc mắc trong mọi lĩnh vực (Khoa học, Xã hội, Lịch sử, Ngoại ngữ, Công nghệ, Kỹ năng sống...).

            Quy tắc trả lời:
            1. **Ngắn gọn & Dễ hiểu:** Đi thẳng vào vấn đề, tránh dài dòng văn tự.
            2. **Trình bày đẹp:** Sử dụng Markdown (in đậm **từ khóa**, gạch đầu dòng) để dễ đọc.
            3. **Thích nghi:** - Nếu hỏi về Toán/Lý/Hóa: Hãy đưa ra công thức và ví dụ.
               - Nếu hỏi về Tiếng Anh: Hãy giải thích ngữ pháp và cho ví dụ câu.
               - Nếu hỏi xã hội: Hãy trả lời khách quan.

            Câu hỏi của người dùng là: "${message}"
            
            Hãy trả lời ngay dưới đây:
        `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.json({
      reply: responseText,
    });
  } catch (err) {
    console.error("Lỗi Chatbot:", err);
    // Fallback: Trả về lỗi thân thiện
    res.status(500).json({
      message: "Trợ lý AI đang nghỉ ngơi một chút, bạn thử lại sau nhé!",
    });
  }
};
