# 📘 API Documentation - Smart Quiz App (Updated)

[cite_start]**Base URL:** `https://quizzapp-kovj.onrender.com/api` (Hoặc `http://localhost:3000/api` khi chạy local) [cite: 2]
[cite_start]**Auth Header:** `Authorization: Bearer <your_token>` 🔒 [cite: 3]
[cite_start]**Content-Type:** `application/json` [cite: 3]

---

## 1. 🔐 Xác thực & Tài khoản (Auth & Users)

### **Đăng ký tài khoản**
- [cite_start]`POST /auth/register` [cite: 8]
- [cite_start]**Body:** `{ "username": "...", "password": "...", "full_name": "...", "role": "users" }` [cite: 8]

### **Đăng nhập**
- [cite_start]`POST /auth/login` [cite: 9]
- [cite_start]**Body:** `{ "username": "...", "password": "..." }` [cite: 9]
- [cite_start]**Response:** Trả về `token` (Lưu vào localStorage) và thông tin user. [cite: 9]

### **Xem thông tin cá nhân** 🔒
- [cite_start]`GET /users/profile` [cite: 10]

### **Cập nhật họ tên** 🔒
- [cite_start]`PUT /users/profile` [cite: 10]
- [cite_start]**Body:** `{ "full_name": "Tên Mới" }` [cite: 10]

### **Đổi mật khẩu** 🔒
- [cite_start]`PUT /users/change-password` [cite: 10]
- [cite_start]**Body:** `{ "old_password": "...", "new_password": "..." }` [cite: 10]

---

## 2. 📝 Quản lý & Làm bài thi (Exams)

### **Lấy danh sách đề thi Public** (Trang chủ)
- [cite_start]`GET /exams` [cite: 11]

### **Vào thi bằng Mã code**
- [cite_start]`GET /exams/code/:code?mode=practice` [cite: 11]
- [cite_start]**Lưu ý:** Truyền `?mode=practice` để nhận thêm đáp án đúng và lời giải thích AI. [cite: 11]

### **Nộp bài thi** 🔒
- [cite_start]`POST /exams/submit` [cite: 12]
- **Body:**
  ```json
  {
    "exam_id": 5,
    "answers": [
      { "question_id": 9, "option_id": 30 },
      { "question_id": 10, "option_id": 35 }
    ]
  }
  ```
- [cite_start]**Response:** `{ "message": "...", "result_id": 12, "score": 8.5 }` [cite: 13]

### **Xem điểm tổng quát lượt thi** 🔒
- [cite_start]`GET /exams/result/:id` (id là `result_id`) [cite: 13]

### **Xem chi tiết đáp án đã làm** 🔒
- [cite_start]`GET /exams/result-detail/:id` (id là `result_id`) [cite: 14]

---

## 3. 👑 Dành cho Người tạo đề (Author/Admin)

### **Lấy danh sách đề tôi đã tạo** 🔒
- [cite_start]`GET /exams/my-exams` [cite: 15]

### **Tạo đề thi mới** 🔒
- [cite_start]`POST /exams/create` [cite: 15]
- [cite_start]**Body:** Chứa thông tin đề và mảng `questions` kèm `options`. [cite: 15]

### **Lấy dữ liệu để sửa đề** 🔒
- [cite_start]`GET /exams/:id/questions` [cite: 16]

### **Lưu thay đổi (Edit)** 🔒
- [cite_start]`PUT /exams/:id` [cite: 16]

### **Xóa đề thi** 🔒
- [cite_start]`DELETE /exams/:id` [cite: 17]

### **Xem thống kê đề thi** 🔒
- [cite_start]`GET /exams/:id/stats` [cite: 17]
- [cite_start]**Mô tả:** Trả về số lượt thi và danh sách điểm số (Chỉ dành cho chủ đề/Admin). [cite: 17]

---

## 4. 🤖 Tính năng AI (Gemini)

### **Giải thích câu hỏi (Ôn tập)** 🔒
- [cite_start]`POST /exams/explain-question` [cite: 18]
- [cite_start]**Body:** `{ "question_id": 32 }` [cite: 18]

### **Chatbot Trợ lý học tập**
- [cite_start]`POST /chat/ask` [cite: 18]
- [cite_start]**Body:** `{ "message": "..." }` [cite: 19]
- [cite_start]**Response:** `{ "reply": "Nội dung Markdown" }` [cite: 19]

---

## ⚠️ Mã lỗi HTTP cần lưu ý
- [cite_start]**401:** Lỗi Token - Frontend cần đẩy về trang Login. [cite: 5]
- [cite_start]**403:** Không có quyền truy cập. [cite: 6]
- [cite_start]**404:** Không tìm thấy dữ liệu (Mã đề sai, id không tồn tại). [cite: 7]
