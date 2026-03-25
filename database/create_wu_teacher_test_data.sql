-- 为吴老师创建测试数据
-- 包含：1个吴老师账号、1个7天24小时的课程、50个测试学生

USE xuexitong;

-- 1. 创建吴老师账号（密码：123456）
INSERT INTO users (username, password, role, name, email, phone, is_profile_complete, status) VALUES
('T2024001', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'teacher', 'Wu Lao Shi', 'wu@example.com', '13900139001', 1, 1);

SET @wu_teacher_id = LAST_INSERT_ID();

-- 2. 创建吴老师的教师信息
INSERT INTO teacher_profiles (user_id, teacher_id, department, title) VALUES
(@wu_teacher_id, 'T2024001', 'Computer Science', 'Professor');

-- 3. 创建测试班级
INSERT INTO classes (name, course_name, teacher_id, invite_code, student_count, status) VALUES
('Test Class 2024', '7x24 Test Course', @wu_teacher_id, 'WU2024', 50, 1);

SET @test_class_id = LAST_INSERT_ID();

-- 4. 创建7天24小时的课程（每天都可以签到）
INSERT INTO courses (name, teacher_id, class_id, classroom, schedule, week_day, start_time, end_time, status) VALUES
('7x24 Test Course', @wu_teacher_id, @test_class_id, 'Online', 'All Day', 1, '00:00', '23:59', 1),
('7x24 Test Course', @wu_teacher_id, @test_class_id, 'Online', 'All Day', 2, '00:00', '23:59', 1),
('7x24 Test Course', @wu_teacher_id, @test_class_id, 'Online', 'All Day', 3, '00:00', '23:59', 1),
('7x24 Test Course', @wu_teacher_id, @test_class_id, 'Online', 'All Day', 4, '00:00', '23:59', 1),
('7x24 Test Course', @wu_teacher_id, @test_class_id, 'Online', 'All Day', 5, '00:00', '23:59', 1),
('7x24 Test Course', @wu_teacher_id, @test_class_id, 'Online', 'All Day', 6, '00:00', '23:59', 1),
('7x24 Test Course', @wu_teacher_id, @test_class_id, 'Online', 'All Day', 7, '00:00', '23:59', 1);

-- 5. 创建50个测试学生
-- 先创建存储过程
DROP PROCEDURE IF EXISTS CreateTestStudents;

DELIMITER //

CREATE PROCEDURE CreateTestStudents()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE student_user_id BIGINT;
    
    WHILE i <= 50 DO
        -- 插入用户
        INSERT INTO users (username, password, role, name, email, phone, is_profile_complete, status) VALUES
        (CONCAT('2024', LPAD(i, 4, '0')), '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', CONCAT('Student', i), CONCAT('student', i, '@test.com'), CONCAT('138', LPAD(FLOOR(RAND() * 100000000), 8, '0')), 1, 1);
        
        SET student_user_id = LAST_INSERT_ID();
        
        -- 插入学生信息
        INSERT INTO student_profiles (user_id, student_id, class_name, department, major) VALUES
        (student_user_id, CONCAT('2024', LPAD(i, 4, '0')), 'Test Class 2024', 'Computer Science', 'Software Engineering');
        
        -- 将学生加入班级
        INSERT INTO class_students (class_id, student_id, status) VALUES
        (@test_class_id, student_user_id, 'active');
        
        SET i = i + 1;
    END WHILE;
END//

DELIMITER ;

-- 调用存储过程创建50个学生
CALL CreateTestStudents();

-- 删除存储过程
DROP PROCEDURE IF EXISTS CreateTestStudents;

-- 更新班级学生人数
UPDATE classes SET student_count = 50 WHERE id = @test_class_id;

-- 查询验证
SELECT 'Teacher Info' as info;
SELECT id, username, name, role FROM users WHERE username = 'T2024001';

SELECT 'Class Info' as info;
SELECT * FROM classes WHERE teacher_id = @wu_teacher_id;

SELECT 'Course Info' as info;
SELECT c.id, c.name, c.week_day, c.start_time, c.end_time, cl.name as class_name 
FROM courses c 
JOIN classes cl ON c.class_id = cl.id 
WHERE c.teacher_id = @wu_teacher_id;

SELECT 'Total Students' as info;
SELECT COUNT(*) as total_students FROM class_students WHERE class_id = @test_class_id;

SELECT 'First 10 Students' as info;
SELECT u.username, u.name, sp.student_id 
FROM users u 
JOIN student_profiles sp ON u.id = sp.user_id 
JOIN class_students cs ON u.id = cs.student_id 
WHERE cs.class_id = @test_class_id 
LIMIT 10;
