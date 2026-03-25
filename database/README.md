# 智签系统数据库

## 数据库配置

- **数据库名称**: xuexitong
- **root密码**: 123456
- **用户名**: xuexitong
- **用户密码**: 123456
- **端口**: 3306

## 快速启动

### 方式一：使用 Docker（推荐）

1. 确保已安装 Docker 和 Docker Compose

2. 在 database 目录下运行：
```bash
docker-compose up -d
```

3. 等待数据库初始化完成（约30秒）

4. 访问 phpMyAdmin（可选）：
   - 地址: http://localhost:8080
   - 用户名: root
   - 密码: 123456

5. 停止数据库：
```bash
docker-compose down
```

### 方式二：手动导入

1. 安装 MySQL 8.0

2. 创建数据库：
```sql
CREATE DATABASE xuexitong CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. 导入数据：
```bash
mysql -u root -p xuexitong < init.sql
```

## 数据库表结构

### 核心表

| 表名 | 说明 |
|------|------|
| users | 用户表（学生和老师） |
| student_profiles | 学生信息表 |
| teacher_profiles | 教师信息表 |
| classes | 班级表 |
| class_students | 班级学生关联表 |
| courses | 课程表 |
| check_in_records | 签到记录表 |
| student_check_ins | 学生签到明细表 |

## 测试账号

### 教师账号
- 用户名: T2021001
- 密码: 123456
- 姓名: 李老师

### 学生账号
- 用户名: 2021001001
- 密码: 123456
- 姓名: 张三

- 用户名: 2021001002
- 密码: 123456
- 姓名: 李四

- 用户名: 2021001003
- 密码: 123456
- 姓名: 王五（未完善信息）

## 常用查询

### 1. 查询所有教师
```sql
SELECT * FROM users WHERE role = 'teacher';
```

### 2. 查询某班级的所有学生
```sql
SELECT u.* FROM users u
JOIN class_students cs ON u.id = cs.student_id
WHERE cs.class_id = 1 AND cs.status = 'active';
```

### 3. 查询某学生的签到记录
```sql
SELECT c.name as course_name, ci.check_in_time, sci.status
FROM student_check_ins sci
JOIN check_in_records ci ON sci.record_id = ci.id
JOIN courses c ON ci.course_id = c.id
WHERE sci.student_id = 2;
```

### 4. 查询某课程的出勤统计
```sql
SELECT 
    COUNT(*) as total_students,
    SUM(CASE WHEN sci.status = 'checked' THEN 1 ELSE 0 END) as checked_count,
    SUM(CASE WHEN sci.status = 'late' THEN 1 ELSE 0 END) as late_count,
    SUM(CASE WHEN sci.status = 'absent' THEN 1 ELSE 0 END) as absent_count
FROM student_check_ins sci
WHERE sci.record_id = 1;
```

## 连接配置

### Node.js (使用 mysql2)
```javascript
const mysql = require('mysql2/promise');

const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'xuexitong',
    password: '123456',
    database: 'xuexitong'
});
```

### 后端 API 连接示例
```javascript
// config/database.js
module.exports = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'xuexitong',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'xuexitong',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
```