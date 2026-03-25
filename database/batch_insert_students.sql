USE xuexitong;
SET @class_id = (SELECT id FROM classes WHERE invite_code='WU2024');

-- 批量插入49个学生（第1个已存在）
INSERT INTO users (username, password, role, name, email, phone, is_profile_complete, status) VALUES
('20240002', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student2', 'student2@test.com', '13800000002', 1, 1),
('20240003', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student3', 'student3@test.com', '13800000003', 1, 1),
('20240004', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student4', 'student4@test.com', '13800000004', 1, 1),
('20240005', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student5', 'student5@test.com', '13800000005', 1, 1),
('20240006', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student6', 'student6@test.com', '13800000006', 1, 1),
('20240007', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student7', 'student7@test.com', '13800000007', 1, 1),
('20240008', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student8', 'student8@test.com', '13800000008', 1, 1),
('20240009', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student9', 'student9@test.com', '13800000009', 1, 1),
('20240010', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student10', 'student10@test.com', '13800000010', 1, 1),
('20240011', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student11', 'student11@test.com', '13800000011', 1, 1),
('20240012', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student12', 'student12@test.com', '13800000012', 1, 1),
('20240013', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student13', 'student13@test.com', '13800000013', 1, 1),
('20240014', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student14', 'student14@test.com', '13800000014', 1, 1),
('20240015', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student15', 'student15@test.com', '13800000015', 1, 1),
('20240016', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student16', 'student16@test.com', '13800000016', 1, 1),
('20240017', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student17', 'student17@test.com', '13800000017', 1, 1),
('20240018', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student18', 'student18@test.com', '13800000018', 1, 1),
('20240019', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student19', 'student19@test.com', '13800000019', 1, 1),
('20240020', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student20', 'student20@test.com', '13800000020', 1, 1);

-- 获取刚插入的学生ID
SET @last_id = LAST_INSERT_ID();

-- 插入学生信息
INSERT INTO student_profiles (user_id, student_id, class_name, department, major) 
SELECT id, username, 'Test Class 2024', 'Computer Science', 'Software Engineering'
FROM users WHERE username BETWEEN '20240002' AND '20240020';

-- 加入班级
INSERT INTO class_students (class_id, student_id, status)
SELECT @class_id, id, 'active'
FROM users WHERE username BETWEEN '20240002' AND '20240020';
