USE xuexitong;
SET @class_id = (SELECT id FROM classes WHERE invite_code='WU2024');

INSERT INTO users (username, password, role, name, email, phone, is_profile_complete, status) VALUES
('20240001', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student1', 'student1@test.com', '13800000001', 1, 1),
('20240002', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student2', 'student2@test.com', '13800000002', 1, 1),
('20240003', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student3', 'student3@test.com', '13800000003', 1, 1),
('20240004', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student4', 'student4@test.com', '13800000004', 1, 1),
('20240005', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student5', 'student5@test.com', '13800000005', 1, 1),
('20240006', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student6', 'student6@test.com', '13800000006', 1, 1),
('20240007', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student7', 'student7@test.com', '13800000007', 1, 1),
('20240008', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student8', 'student8@test.com', '13800000008', 1, 1),
('20240009', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student9', 'student9@test.com', '13800000009', 1, 1),
('20240010', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', 'Student10', 'student10@test.com', '13800000010', 1, 1);

SET @s1 = LAST_INSERT_ID();
INSERT INTO student_profiles (user_id, student_id, class_name, department, major) VALUES
(@s1 - 9, '20240001', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 8, '20240002', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 7, '20240003', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 6, '20240004', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 5, '20240005', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 4, '20240006', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 3, '20240007', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 2, '20240008', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1 - 1, '20240009', 'Test Class 2024', 'Computer Science', 'Software Engineering'),
(@s1, '20240010', 'Test Class 2024', 'Computer Science', 'Software Engineering');

INSERT INTO class_students (class_id, student_id, status) VALUES
(@class_id, @s1 - 9, 'active'),(@class_id, @s1 - 8, 'active'),(@class_id, @s1 - 7, 'active'),(@class_id, @s1 - 6, 'active'),(@class_id, @s1 - 5, 'active'),
(@class_id, @s1 - 4, 'active'),(@class_id, @s1 - 3, 'active'),(@class_id, @s1 - 2, 'active'),(@class_id, @s1 - 1, 'active'),(@class_id, @s1, 'active');
