// Bảng người dùng
Table users {
  id int [pk, increment] // Khóa chính, tự tăng
  email varchar(255)
  password varchar(255)
  full_name varchar(255)
  role varchar(50) [note: "admin hoặc student"]
}

// Bảng đề thi
Table exams {
  id int [pk, increment]
  title varchar(255)
  description text
  duration int [note: "Thời gian tính bằng phút"]
  created_at datetime
}

// Bảng câu hỏi
Table questions {
  id int [pk, increment]
  exam_id int [ref: > exams.id] // Liên kết với bảng exams
  content text
  image_url varchar(500)
}

// Bảng đáp án
Table options {
  id int [pk, increment]
  question_id int [ref: > questions.id] // Liên kết với câu hỏi
  content text
  is_correct boolean [note: "1: Đúng, 0: Sai"]
}

// Bảng kết quả thi
Table results {
  id int [pk, increment]
  user_id int [ref: > users.id]
  exam_id int [ref: > exams.id]
  score float
  submitted_at datetime
}