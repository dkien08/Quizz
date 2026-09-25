# API Documentation - Smart Quiz App

## Thông tin chung

- **Base URL production:** `https://quizzapp-kovj.onrender.com`
- **Base URL local:** `http://localhost:3000`
- **Content-Type:** `application/json` cho các request JSON.
- **Xác thực:** Các endpoint có ký hiệu 🔒 cần header:

```http
Authorization: Bearer <jwt_token>
```

Token được tạo bởi `POST /auth/login` và có thời hạn 24 giờ.

### Phân biệt xác thực và phân quyền

- **Có JWT:** Request phải chứa token hợp lệ.
- **Chủ đề/Admin:** Một số API còn kiểm tra người dùng là người tạo đề hoặc có `role = "admin"`.
- Các endpoint không có ký hiệu 🔒 có thể gọi mà không cần đăng nhập.

## 1. Health check

### Kiểm tra trạng thái server

`GET /health`

Không cần xác thực.

**Response `200`:**

```json
{
  "status": "OK",
  "timestamp": "2026-09-25T10:00:00.000Z"
}
```

## 2. Xác thực tài khoản

### Đăng ký

`POST /auth/register`

Không cần xác thực.

**Body:**

```json
{
  "username": "student01",
  "password": "secret123",
  "full_name": "Nguyen Van A",
  "role": "users"
}
```

`username` và `password` là bắt buộc. Nếu không truyền `role`, hệ thống mặc định là `users`.

**Response `200`:**

```json
{
  "message": "Đăng ký thành công!"
}
```

### Đăng nhập

`POST /auth/login`

Không cần xác thực.

**Body:**

```json
{
  "username": "student01",
  "password": "secret123"
}
```

**Response `200`:**

```json
{
  "message": "Đăng nhập thành công!",
  "token": "<jwt_token>",
  "user": {
    "id": 1,
    "username": "student01",
    "full_name": "Nguyen Van A",
    "role": "users"
  }
}
```

## 3. Quản lý người dùng

### Xem thông tin cá nhân 🔒

`GET /users/profile`

**Response `200`:**

```json
{
  "id": 1,
  "username": "student01",
  "full_name": "Nguyen Van A",
  "created_at": "2026-09-25T10:00:00.000Z"
}
```

### Cập nhật họ tên 🔒

`PUT /users/profile`

**Body:**

```json
{
  "full_name": "Nguyen Van B"
}
```

**Response `200`:**

```json
{
  "message": "Cập nhật thông tin thành công!"
}
```

### Đổi mật khẩu 🔒

`PUT /users/change-password`

**Body:**

```json
{
  "old_password": "secret123",
  "new_password": "new-secret456"
}
```

**Response `200`:**

```json
{
  "message": "Đổi mật khẩu thành công!"
}
```

## 4. Đề thi công khai và làm bài

### Lấy danh sách đề thi công khai

`GET /exams`

Không cần xác thực. Chỉ trả về các đề có `is_public = 1`.

**Response `200`:** Mảng đề thi, bao gồm số lượng câu hỏi và tên tác giả.

### Lấy đề thi bằng mã

`GET /exams/code/:code`

Không cần xác thực.

Có thể truyền query `mode=practice` để vào chế độ ôn tập:

```http
GET /exams/code/ABC123?mode=practice
```

- Không có `mode`: không trả về đáp án đúng.
- `mode=practice`: trả về `is_correct` của các lựa chọn.
- Nếu đề không cho phép ôn tập, response là `403`.

**Response `200`:**

```json
{
  "exam": {
    "id": 5,
    "title": "Kiểm tra Toán",
    "code": "ABC123"
  },
  "questions": [
    {
      "id": 9,
      "question_text": "2 + 2 bằng bao nhiêu?",
      "options": [{ "id": 30, "option_text": "4" }]
    }
  ]
}
```

### Nộp bài thi 🔒

`POST /exams/submit`

**Body:**

```json
{
  "exam_id": 5,
  "answers": [
    { "question_id": 9, "option_id": 30 },
    { "question_id": 10, "option_id": 35 }
  ]
}
```

**Response `200`:**

```json
{
  "message": "Nộp bài thành công!",
  "result_id": 12,
  "score": "8.50"
}
```

### Kiểm tra đáp án trong chế độ ôn tập 🔒

`POST /exams/check-answer`

**Body:**

```json
{
  "question_id": 9,
  "option_id": 30
}
```

**Response `200`:**

```json
{
  "is_correct": true,
  "ai_explanation": "..."
}
```

### Xem kết quả tổng quát 🔒

`GET /exams/result/:id`

`id` là `result_id`. Người dùng chỉ xem được kết quả của chính mình.

### Xem chi tiết bài làm 🔒

`GET /exams/result-detail/:id`

`id` là `result_id`. Response gồm nội dung câu hỏi, đáp án đã chọn, trạng thái đúng/sai và đáp án đúng.

## 5. Quản lý đề thi cho người tạo đề

Các endpoint trong phần này đều cần JWT. Những endpoint có ghi **Chủ đề/Admin** sẽ kiểm tra thêm quyền sở hữu đề hoặc `role = "admin"`.

### Lấy danh sách đề đã tạo 🔒

`GET /exams/my-exams`

Trả về các đề do user hiện tại tạo.

### Tạo đề thi 🔒

`POST /exams/create`

**Body:**

```json
{
  "title": "Kiểm tra Toán",
  "description": "Bài kiểm tra chương 1",
  "duration": 30,
  "is_public": 1,
  "allow_practice": 1,
  "questions": [
    {
      "question_text": "2 + 2 bằng bao nhiêu?",
      "options": [
        { "option_text": "3", "is_correct": 0 },
        { "option_text": "4", "is_correct": 1 }
      ]
    }
  ]
}
```

**Response `201`:**

```json
{
  "message": "Tạo đề thành công",
  "examId": 5,
  "code": "ABC123"
}
```

### Import câu hỏi từ Excel 🔒

`POST /exams/import-excel`

Gửi request dạng `multipart/form-data` với:

- `exam_id`: ID đề thi.
- `file`: file Excel.

File Excel sử dụng dữ liệu từ dòng 2, theo cấu trúc:

| Cột | Nội dung                                                |
| --- | ------------------------------------------------------- |
| A   | Nội dung câu hỏi                                        |
| B   | Đáp án A                                                |
| C   | Đáp án B                                                |
| D   | Đáp án C                                                |
| E   | Đáp án D                                                |
| F   | Đáp án đúng: `A`, `B`, `C`, `D` hoặc `1`, `2`, `3`, `4` |

**Response `200`:**

```json
{
  "message": "Đã nhập thành công 10 câu hỏi!"
}
```

### Lấy câu hỏi để chỉnh sửa 🔒

`GET /exams/:id/questions`

Trả về thông tin đề và danh sách câu hỏi, lựa chọn.

### Cập nhật đề thi 🔒 — Chủ đề/Admin

`PUT /exams/:id`

**Body:** Có thể gồm `title`, `description`, `duration`, `is_public`, `allow_practice` và mảng `questions` với cấu trúc giống API tạo đề.

**Response `200`:**

```json
{
  "message": "Cập nhật thành công!"
}
```

### Xóa đề thi 🔒 — Chủ đề/Admin

`DELETE /exams/:id`

**Response `200`:**

```json
{
  "message": "Đã xóa đề thi!"
}
```

### Lấy danh sách kết quả của một đề 🔒 — Chủ đề/Admin

`GET /exams/:id/results`

Trả về điểm, thời gian nộp và tên người làm bài.

### Xem thống kê đề thi 🔒 — Chủ đề/Admin

`GET /exams/:id/stats`

**Response `200`:**

```json
{
  "exam_title": "Kiểm tra Toán",
  "total_attempts": 2,
  "stats": [
    {
      "id": 12,
      "score": 8.5,
      "submitted_at": "2026-09-25T10:00:00.000Z",
      "full_name": "Nguyen Van A",
      "username": "student01",
      "correct_count": 8,
      "total_questions": 10,
      "email": "student01"
    }
  ]
}
```

## 6. Tính năng AI

### Giải thích câu hỏi bằng AI 🔒

`POST /exams/explain-question`

**Body:**

```json
{
  "question_id": 32
}
```

**Response `200`:**

```json
{
  "ai_explanation": "Giải thích đáp án..."
}
```

### Chatbot trợ lý học tập

`POST /chat/ask`

Không cần xác thực.

**Body:**

```json
{
  "message": "Giải thích định luật Newton"
}
```

**Response `200`:**

```json
{
  "reply": "Nội dung trả lời dạng Markdown"
}
```

## 7. Mã lỗi chung

| HTTP status | Ý nghĩa                                               |
| ----------- | ----------------------------------------------------- |
| `400`       | Request thiếu hoặc sai dữ liệu đầu vào                |
| `401`       | Thiếu JWT token                                       |
| `403`       | JWT không hợp lệ, hoặc user không có quyền            |
| `404`       | Không tìm thấy endpoint, đề thi, câu hỏi hoặc kết quả |
| `409`       | Username đã tồn tại khi đăng ký                       |
| `500`       | Lỗi server, database hoặc dịch vụ AI                  |

### Cấu trúc lỗi thường gặp

```json
{
  "message": "Mô tả lỗi"
}
```

## 8. Danh sách nhanh theo trạng thái xác thực

### Không cần JWT

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /exams`
- `GET /exams/code/:code`
- `POST /chat/ask`

### Cần JWT

- `GET /users/profile`
- `PUT /users/profile`
- `PUT /users/change-password`
- `GET /exams/my-exams`
- `POST /exams/create`
- `POST /exams/import-excel`
- `POST /exams/submit`
- `POST /exams/check-answer`
- `POST /exams/explain-question`
- `GET /exams/result/:id`
- `GET /exams/result-detail/:id`
- `GET /exams/:id/questions`
- `PUT /exams/:id`
- `DELETE /exams/:id`
- `GET /exams/:id/results`
- `GET /exams/:id/stats`
