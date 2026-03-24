
# 🧠 Smart Quiz App - Hệ Thống Thi Trắc Nghiệm Tích Hợp AI

**Smart Quiz App** là một hệ thống thi trắc nghiệm trực tuyến toàn diện, được xây dựng với kiến trúc Client-Server hiện đại. Điểm nhấn của dự án là khả năng **tích hợp Trí tuệ Nhân tạo (Google Gemini AI)** để tạo ra chế độ "Luyện tập thông minh", giúp người dùng không chỉ biết kết quả đúng/sai mà còn hiểu sâu bản chất câu hỏi thông qua giải thích chi tiết.

---

## ✨ Các Tính Năng Nổi Bật

### 🧑‍💻 Dành cho Người thi (Student/User)
* **Xác thực bảo mật:** Đăng ký, Đăng nhập an toàn với JWT (JSON Web Token) và mã hóa mật khẩu bằng bcrypt.
* **Dashboard trực quan:** Quản lý danh sách "Đề thi công khai" và "Đề thi của tôi".
* **Chế độ Thi Thật (Exam Mode):** Tính giờ làm bài nghiêm ngặt, tự động nộp bài khi hết giờ và tính điểm tức thì.
* **Chế độ Luyện Tập AI (Practice Mode):** Làm bài không giới hạn thời gian. AI sẽ đóng vai trò gia sư ảo, giải thích chi tiết từng câu hỏi giúp người dùng củng cố kiến thức.
* **Thống kê cá nhân:** Xem lại lịch sử làm bài và điểm số chi tiết.

### 👨‍🏫 Dành cho Người tạo đề (Teacher/Admin)
* **Tạo đề thi nhanh chóng:** Giao diện thêm câu hỏi, đáp án trực quan.
* **Import từ Excel:** Tiết kiệm thời gian bằng cách tải lên danh sách câu hỏi hàng loạt từ file `.xlsx`.
* **Quản lý linh hoạt:** Chỉnh sửa, xóa hoặc thay đổi trạng thái (Công khai/Riêng tư) của đề thi.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

### Frontend (Client-side)
* **Core:** React 19, Vite.
* **Routing & Styling:** React Router v7, Tailwind CSS, Lucide React (Icons).
* **Network & Data:** Axios (Cấu hình Interceptors tự động đính kèm Token và xử lý lỗi xác thực).
* **Utilities:** `xlsx` (Xử lý file Excel), `react-markdown` (Hiển thị nội dung giải thích từ AI).

### Backend (Server-side)
* **Core:** Node.js v22, Express.js.
* **Database:** MySQL (Cloud Hosting trên Aiven) sử dụng thư viện `mysql2`.
* **Bảo mật & Xác thực:** `jsonwebtoken`, `bcrypt`/`bcryptjs`, `cors` (Cấu hình linh hoạt chặn Preflight errors).
* **AI Integration:** `@google/generative-ai` (Gemini API).
* **File Handling:** `multer`, `xlsx` (Nhận và đọc file tải lên từ phía người dùng).

---

## 🗂️ Cấu Trúc Dự Án (Architecture)

### 1. Frontend Structure (`/src`)
```text
src/
├── components/      # Các UI component dùng chung (Navbar, Layout, v.v.)
├── pages/           # Chứa các màn hình chính
│   ├── auth/        # LoginPage, RegisterPage
│   ├── exam/        # Dashboard, ExamRoom, PracticeRoom, CreateExam, ExamStats
│   └── user/        # ProfilePage
├── services/        # Logic gọi API (chứa axiosClient.js cấu hình tập trung)
└── App.jsx          # Thiết lập Routing và kiểm tra trạng thái Authentication
```

### 2. Backend Structure
```text
backend/
├── routes/          # Định nghĩa các Endpoints (authRoutes, examRoutes, chatRoutes...)
├── controllers/     # Xử lý logic nghiệp vụ cho từng Route
├── config/          # Cấu hình kết nối MySQL Pool với Aiven
├── middlewares/     # Xử lý trung gian (Xác thực Token JWT)
└── server.js        # File khởi chạy ứng dụng chính, thiết lập Middleware & CORS
```

---

## 🚀 Hướng Dẫn Cài Đặt (Local Development)

### Yêu cầu hệ thống:
* Node.js (Khuyên dùng v22 trở lên).
* Database: MySQL (Local hoặc thông tin kết nối từ Aiven Cloud).

### Bước 1: Khởi tạo Backend
1. Mở Terminal, di chuyển vào thư mục Backend.
2. Cài đặt thư viện: `npm install`
3. Tạo file `.env` ở thư mục gốc Backend và cấu hình kết nối MySQL:
   ```env
   PORT=3000
   # Cấu hình MySQL Aiven
   DB_HOST=mysql-xxxx-your-project.aivencloud.com
   DB_PORT=xxxx
   DB_USER=avnadmin
   DB_PASSWORD=your_aiven_password
   DB_NAME=smart_quiz_db
   
   # API Keys & Auth
   JWT_SECRET=chuoi_ki_tu_bi_mat_cua_ban
   GEMINI_API_KEY=api_key_cua_google_gemini
   FRONTEND_URL=http://localhost:5173
   ```
4. Khởi chạy Server: `npm run dev` (Server sẽ chạy tại `http://localhost:3000`).

### Bước 2: Khởi tạo Frontend
1. Mở một Terminal mới, di chuyển vào thư mục Frontend.
2. Cài đặt thư viện: `npm install`
3. Mở file `src/services/axiosClient.js` và đảm bảo `baseURL` đang trỏ đúng về cổng `3000` (nếu chạy local).
4. Khởi chạy ứng dụng: `npm run dev`
5. Truy cập `http://localhost:5173` trên trình duyệt để trải nghiệm.

---

## 🔗 Danh sách API Endpoints (Core)

Mọi endpoints đều bắt đầu từ thư mục gốc của Server (Ví dụ: `http://localhost:3000/...`)

| Route | HTTP Method | Endpoint | Mô tả | Authorization |
| :--- | :---: | :--- | :--- | :---: |
| **Auth** | `POST` | `/auth/login` | Đăng nhập hệ thống | ❌ |
| **Auth** | `POST` | `/auth/register` | Tạo tài khoản mới | ❌ |
| **Exam** | `GET` | `/exams` | Lấy danh sách toàn bộ đề thi Public | ✅ |
| **Exam** | `GET` | `/exams/my-exams` | Lấy danh sách đề thi do User tạo | ✅ |
| **Exam** | `POST` | `/exams` | Tạo đề thi mới (Thủ công hoặc Excel) | ✅ |
| **Chat** | `POST` | `/chat` | Giao tiếp với AI Gemini | ✅ |
| **User** | `GET` | `/users/profile` | Lấy thông tin tài khoản hiện tại | ✅ |

*(Chú thích: ✅ Yêu cầu truyền Header `Authorization: Bearer <Token>`)*
### 📥 Tài liệu hỗ trợ
Để đảm bảo tính năng Import câu hỏi hoạt động chính xác, vui lòng tải và sử dụng file mẫu bên dưới:

👉 **[Tải File Excel Mẫu Tại Đây (Click để tải)](https://github.com/dkien08/Quizz/raw/master/tailieu/sample_quiz.xlsx)**
