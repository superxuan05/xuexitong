-- 智签系统数据库初始化脚本
-- 数据库: xuexitong
-- 密码: 123456

-- 创建数据库
CREATE DATABASE IF NOT EXISTS xuexitong DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE xuexitong;

-- 用户表（学生和老师共用）
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名/学号/工号',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    role ENUM('student', 'teacher') NOT NULL DEFAULT 'student' COMMENT '角色',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    email VARCHAR(100) COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    avatar VARCHAR(255) COMMENT '头像URL',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    is_profile_complete TINYINT DEFAULT 0 COMMENT '个人信息是否完善：0-否，1-是',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 学生信息表
CREATE TABLE IF NOT EXISTS student_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    student_id VARCHAR(50) NOT NULL UNIQUE COMMENT '学号',
    class_name VARCHAR(100) COMMENT '班级名称',
    department VARCHAR(100) COMMENT '学院',
    major VARCHAR(100) COMMENT '专业',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_class (class_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生信息表';

-- 教师信息表
CREATE TABLE IF NOT EXISTS teacher_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    teacher_id VARCHAR(50) NOT NULL UNIQUE COMMENT '工号',
    department VARCHAR(100) COMMENT '学院',
    title VARCHAR(50) COMMENT '职称',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher_id (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教师信息表';

-- 班级表
CREATE TABLE IF NOT EXISTS classes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '班级名称',
    course_name VARCHAR(100) NOT NULL COMMENT '课程名称',
    teacher_id BIGINT UNSIGNED NOT NULL COMMENT '教师ID',
    invite_code VARCHAR(20) COMMENT '邀请码',
    student_count INT DEFAULT 0 COMMENT '学生人数',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-正常',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    INDEX idx_invite_code (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级表';

-- 班级学生关联表
CREATE TABLE IF NOT EXISTS class_students (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    class_id BIGINT UNSIGNED NOT NULL,
    student_id BIGINT UNSIGNED NOT NULL,
    join_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    UNIQUE KEY uk_class_student (class_id, student_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_class (class_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='班级学生关联表';

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '课程名称',
    teacher_id BIGINT UNSIGNED NOT NULL,
    class_id BIGINT UNSIGNED NOT NULL,
    classroom VARCHAR(50) COMMENT '教室',
    schedule VARCHAR(100) COMMENT '上课时间描述',
    week_day TINYINT COMMENT '星期几(1-7)',
    start_time TIME COMMENT '开始时间',
    end_time TIME COMMENT '结束时间',
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_teacher (teacher_id),
    INDEX idx_class (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='课程表';

-- 签到记录表
CREATE TABLE IF NOT EXISTS check_in_records (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id BIGINT UNSIGNED NOT NULL,
    teacher_id BIGINT UNSIGNED NOT NULL,
    check_in_code VARCHAR(10) COMMENT '签到码',
    start_time TIMESTAMP NOT NULL COMMENT '开始时间',
    end_time TIMESTAMP COMMENT '结束时间',
    duration INT COMMENT '持续时长(分钟)',
    status ENUM('ongoing', 'completed', 'cancelled') DEFAULT 'ongoing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_course (course_id),
    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='签到记录表';

-- 学生签到明细表
CREATE TABLE IF NOT EXISTS student_check_ins (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    record_id BIGINT UNSIGNED NOT NULL COMMENT '签到记录ID',
    student_id BIGINT UNSIGNED NOT NULL,
    check_in_time TIMESTAMP NOT NULL,
    status ENUM('checked', 'late', 'absent') DEFAULT 'absent' COMMENT '签到状态',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    device_info VARCHAR(255) COMMENT '设备信息',
    FOREIGN KEY (record_id) REFERENCES check_in_records(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_record_student (record_id, student_id),
    INDEX idx_record (record_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学生签到明细表';

-- 插入测试数据

-- 测试老师账号
INSERT INTO users (username, password, role, name, email, phone, is_profile_complete) VALUES
('T2021001', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'teacher', '李老师', 'teacher@example.com', '13800138001', 1);

-- 测试学生账号
INSERT INTO users (username, password, role, name, email, phone, is_profile_complete) VALUES
('2021001001', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', '张三', 'student1@example.com', '13800138002', 1),
('2021001002', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', '李四', 'student2@example.com', '13800138003', 1),
('2021001003', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqQzBZN0UfGNEKjNqXhJhR8UqM5yG', 'student', '王五', 'student3@example.com', '13800138004', 0);

-- 教师信息
INSERT INTO teacher_profiles (user_id, teacher_id, department, title) VALUES
(1, 'T2021001', '计算机学院', '副教授');

-- 学生信息
INSERT INTO student_profiles (user_id, student_id, class_name, department, major) VALUES
(2, '2021001001', '计算机2101班', '计算机学院', '计算机科学与技术'),
(3, '2021001002', '计算机2101班', '计算机学院', '计算机科学与技术'),
(4, '2021001003', '软件工程2102班', '计算机学院', '软件工程');

-- 班级数据
INSERT INTO classes (name, course_name, teacher_id, invite_code, student_count) VALUES
('计算机2101班', '数据结构与算法', 1, 'ABC123', 45),
('软件工程2102班', '操作系统原理', 1, 'DEF456', 50),
('网络工程2101班', '计算机网络', 1, 'GHI789', 48);

-- 班级学生关联
INSERT INTO class_students (class_id, student_id) VALUES
(1, 2),
(1, 3),
(2, 4);

-- 课程数据
INSERT INTO courses (name, teacher_id, class_id, classroom, schedule) VALUES
('数据结构与算法', 1, 1, 'A101', '周一 08:00-09:40'),
('操作系统原理', 1, 2, 'B203', '周三 10:00-11:40'),
('计算机网络', 1, 3, 'C305', '周五 14:00-15:40');

-- 签到记录
INSERT INTO check_in_records (course_id, teacher_id, check_in_code, start_time, end_time, duration, status) VALUES
(1, 1, '1234', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 5 MINUTE, 5, 'completed'),
(2, 1, '5678', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 5 MINUTE, 5, 'completed');

-- 学生签到明细
INSERT INTO student_check_ins (record_id, student_id, check_in_time, status) VALUES
(1, 2, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 1 MINUTE, 'checked'),
(1, 3, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 2 MINUTE, 'checked'),
(2, 4, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 3 MINUTE, 'late');

-- 查询示例
-- 1. 查询所有老师
-- SELECT * FROM users WHERE role = 'teacher';

-- 2. 查询某班级的所有学生
-- SELECT u.* FROM users u
-- JOIN class_students cs ON u.id = cs.student_id
-- WHERE cs.class_id = 1 AND cs.status = 'active';

-- 3. 查询某学生的签到记录
-- SELECT c.name as course_name, ci.check_in_time, sci.status
-- FROM student_check_ins sci
-- JOIN check_in_records ci ON sci.record_id = ci.id
-- JOIN courses c ON ci.course_id = c.id
-- WHERE sci.student_id = 2;

-- 4. 查询某课程的出勤统计
-- SELECT 
--     COUNT(*) as total_students,
--     SUM(CASE WHEN sci.status = 'checked' THEN 1 ELSE 0 END) as checked_count,
--     SUM(CASE WHEN sci.status = 'late' THEN 1 ELSE 0 END) as late_count,
--     SUM(CASE WHEN sci.status = 'absent' THEN 1 ELSE 0 END) as absent_count
-- FROM student_check_ins sci
-- WHERE sci.record_id = 1;