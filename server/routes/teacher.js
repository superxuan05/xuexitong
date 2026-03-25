const express = require('express');
const router = express.Router();
const { query, transaction, getConnection } = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../utils/auth');
const wsManager = require('../utils/websocket');

// 所有路由都需要教师身份验证
router.use(authMiddleware);
router.use(roleMiddleware(['teacher']));

// 获取教师概览数据
router.get('/dashboard', async (req, res) => {
    try {
        const teacherId = req.user.id;

        // 获取课程数量
        const [courseStats] = await query(
            'SELECT COUNT(*) as total FROM courses WHERE teacher_id = ? AND status = 1',
            [teacherId]
        );

        // 获取班级数量
        const [classStats] = await query(
            'SELECT COUNT(*) as total FROM classes WHERE teacher_id = ? AND status = 1',
            [teacherId]
        );

        // 获取学生总数
        const [studentStats] = await query(`
            SELECT COUNT(DISTINCT cs.student_id) as total 
            FROM class_students cs 
            JOIN classes c ON cs.class_id = c.id 
            WHERE c.teacher_id = ? AND cs.status = 'active'
        `, [teacherId]);

        // 获取今日签到次数
        const [checkInStats] = await query(`
            SELECT COUNT(*) as total 
            FROM check_in_records 
            WHERE teacher_id = ? AND DATE(start_time) = CURDATE()
        `, [teacherId]);

        // 获取最近课程
        const recentCourses = await query(`
            SELECT c.*, cl.name as class_name 
            FROM courses c 
            LEFT JOIN classes cl ON c.class_id = cl.id 
            WHERE c.teacher_id = ? AND c.status = 1 
            ORDER BY c.created_at DESC LIMIT 5
        `, [teacherId]);

        // 获取今日签到记录
        const todayCheckIns = await query(`
            SELECT cr.*, c.name as course_name, cl.name as class_name,
                   (SELECT COUNT(*) FROM student_check_ins WHERE record_id = cr.id AND status = 'checked') as checked_count,
                   (SELECT COUNT(*) FROM student_check_ins WHERE record_id = cr.id) as total_count
            FROM check_in_records cr
            LEFT JOIN courses c ON cr.course_id = c.id
            LEFT JOIN classes cl ON c.class_id = cl.id
            WHERE cr.teacher_id = ? AND DATE(cr.start_time) = CURDATE()
            ORDER BY cr.start_time DESC
        `, [teacherId]);

        // 获取今日课程（用于发起签到）- 根据当前时间判断
        const todayCourses = await query(`
            SELECT c.*, cl.name as class_name, cl.student_count,
                   cr.id as record_id, cr.check_in_code, cr.status as check_in_status,
                   cr.start_time as check_in_start, cr.end_time as check_in_end,
                   CASE 
                       WHEN CURTIME() BETWEEN c.start_time AND c.end_time THEN 'ongoing'
                       WHEN CURTIME() > c.end_time THEN 'completed'
                       ELSE 'upcoming'
                   END as course_status
            FROM courses c
            LEFT JOIN classes cl ON c.class_id = cl.id
            LEFT JOIN check_in_records cr ON c.id = cr.course_id 
                AND cr.teacher_id = ? 
                AND DATE(cr.start_time) = CURDATE()
            WHERE c.teacher_id = ? AND c.status = 1
                AND (c.week_day = WEEKDAY(CURDATE()) + 1 OR c.week_day IS NULL)
            ORDER BY c.start_time ASC
            LIMIT 10
        `, [teacherId, teacherId]);

        res.json({
            success: true,
            data: {
                stats: {
                    courseCount: courseStats.total,
                    classCount: classStats.total,
                    studentCount: studentStats.total,
                    todayCheckInCount: checkInStats.total
                },
                recentCourses,
                todayCheckIns,
                todayCourses
            }
        });
    } catch (error) {
        console.error('获取教师概览失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取教师的课程列表
router.get('/courses', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const courses = await query(`
            SELECT c.*, cl.name as class_name, cl.student_count 
            FROM courses c 
            LEFT JOIN classes cl ON c.class_id = cl.id 
            WHERE c.teacher_id = ? AND c.status = 1 
            ORDER BY c.created_at DESC
        `, [teacherId]);

        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('获取课程列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 创建课程
router.post('/courses', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { name, class_id, classroom, schedule } = req.body;

        const result = await query(
            'INSERT INTO courses (name, teacher_id, class_id, classroom, schedule) VALUES (?, ?, ?, ?, ?)',
            [name, teacherId, class_id, classroom, schedule]
        );

        res.json({ success: true, message: '创建成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('创建课程失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取教师的班级列表
router.get('/classes', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const classes = await query(`
            SELECT c.*, 
                   (SELECT COUNT(*) FROM class_students WHERE class_id = c.id AND status = 'active') as actual_count
            FROM classes c 
            WHERE c.teacher_id = ? AND c.status = 1 
            ORDER BY c.created_at DESC
        `, [teacherId]);

        res.json({ success: true, data: classes });
    } catch (error) {
        console.error('获取班级列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 创建班级
router.post('/classes', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { name, course_name, invite_code, week_day, start_time, end_time, classroom } = req.body;

        // 使用事务处理
        const result = await transaction(async (connection) => {
            // 创建班级
            const [classResult] = await connection.execute(
                'INSERT INTO classes (name, course_name, teacher_id, invite_code) VALUES (?, ?, ?, ?)',
                [name, course_name, teacherId, invite_code]
            );

            const classId = classResult.insertId;

            // 创建关联的课程（包含时间信息）
            if (course_name) {
                await connection.execute(
                    'INSERT INTO courses (name, teacher_id, class_id, classroom, week_day, start_time, end_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
                    [course_name, teacherId, classId, classroom || '', week_day || 1, start_time || '08:00:00', end_time || '09:40:00']
                );
            }

            return { classId, invite_code };
        });

        res.json({
            success: true,
            message: '创建成功',
            data: {
                id: result.classId,
                invite_code: result.invite_code
            }
        });
    } catch (error) {
        console.error('创建班级失败:', error);
        res.status(500).json({ success: false, message: '服务器错误: ' + error.message });
    }
});

// 获取班级学生列表
router.get('/classes/:id/students', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const classId = req.params.id;

        // 验证班级是否属于该教师
        const [classInfo] = await query(
            'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
            [classId, teacherId]
        );

        if (!classInfo) {
            return res.status(403).json({ success: false, message: '无权访问该班级' });
        }

        const students = await query(`
            SELECT u.id, u.username, u.name, u.email, u.phone, 
                   sp.student_id, cs.join_time, cs.status
            FROM class_students cs
            JOIN users u ON cs.student_id = u.id
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE cs.class_id = ?
            ORDER BY cs.join_time DESC
        `, [classId]);

        res.json({ success: true, data: students });
    } catch (error) {
        console.error('获取班级学生失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 从班级移除学生
router.delete('/classes/:classId/students/:studentId', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { classId, studentId } = req.params;

        // 验证班级是否属于该教师
        const [classInfo] = await query(
            'SELECT id FROM classes WHERE id = ? AND teacher_id = ?',
            [classId, teacherId]
        );

        if (!classInfo) {
            return res.status(403).json({ success: false, message: '无权访问该班级' });
        }

        await query(
            "UPDATE class_students SET status = 'inactive' WHERE class_id = ? AND student_id = ?",
            [classId, studentId]
        );

        res.json({ success: true, message: '移除成功' });
    } catch (error) {
        console.error('移除学生失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 发起签到
router.post('/checkin/start', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { course_id, duration = 5 } = req.body;

        // 生成4位随机签到码
        const checkInCode = Math.floor(1000 + Math.random() * 9000).toString();

        // 获取课程信息
        const [course] = await query(
            'SELECT class_id FROM courses WHERE id = ? AND teacher_id = ?',
            [course_id, teacherId]
        );

        if (!course) {
            return res.status(404).json({ success: false, message: '课程不存在' });
        }

        // 创建签到记录
        const result = await query(
            `INSERT INTO check_in_records (course_id, teacher_id, check_in_code, start_time, end_time, duration, status) 
             VALUES (?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE), ?, 'ongoing')`,
            [course_id, teacherId, checkInCode, duration, duration]
        );

        // 获取该班级所有学生，创建签到明细（初始状态为缺勤）
        const students = await query(
            'SELECT student_id FROM class_students WHERE class_id = ? AND status = \'active\'',
            [course.class_id]
        );

        for (const student of students) {
            await query(
                `INSERT INTO student_check_ins (record_id, student_id, check_in_time, status) 
                 VALUES (?, ?, NOW(), 'absent')`,
                [result.insertId, student.student_id]
            );
        }

        res.json({
            success: true,
            message: '签到发起成功',
            data: {
                record_id: result.insertId,
                check_in_code: checkInCode,
                duration
            }
        });
    } catch (error) {
        console.error('发起签到失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 结束签到
router.post('/checkin/:id/end', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const recordId = req.params.id;

        // 获取签到记录信息（用于WebSocket通知）
        const [record] = await query(
            'SELECT cr.*, c.name as course_name, c.class_id FROM check_in_records cr JOIN courses c ON cr.course_id = c.id WHERE cr.id = ? AND cr.teacher_id = ?',
            [recordId, teacherId]
        );

        if (!record) {
            return res.status(404).json({ success: false, message: '签到记录不存在' });
        }

        await query(
            "UPDATE check_in_records SET status = 'completed', end_time = NOW() WHERE id = ? AND teacher_id = ?",
            [recordId, teacherId]
        );

        // 通知该班级的所有学生签到已结束
        const students = await query(
            'SELECT student_id FROM class_students WHERE class_id = ? AND status = "active"',
            [record.class_id]
        );

        students.forEach(student => {
            wsManager.sendToUser(student.student_id, {
                type: 'check_in_ended',
                message: `课程 "${record.course_name}" 签到已结束`,
                data: {
                    record_id: recordId,
                    course_name: record.course_name,
                    end_time: new Date().toISOString()
                }
            });
        });

        res.json({ success: true, message: '签到已结束' });
    } catch (error) {
        console.error('结束签到失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取签到记录列表
router.get('/checkin-records', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        const [countResult] = await query(
            'SELECT COUNT(*) as total FROM check_in_records WHERE teacher_id = ?',
            [teacherId]
        );

        const records = await query(`
            SELECT cr.*, c.name as course_name, cl.name as class_name,
                   (SELECT COUNT(*) FROM student_check_ins WHERE record_id = cr.id AND status = 'checked') as checked_count,
                   (SELECT COUNT(*) FROM student_check_ins WHERE record_id = cr.id AND status = 'late') as late_count,
                   (SELECT COUNT(*) FROM student_check_ins WHERE record_id = cr.id) as total_count
            FROM check_in_records cr
            LEFT JOIN courses c ON cr.course_id = c.id
            LEFT JOIN classes cl ON c.class_id = cl.id
            WHERE cr.teacher_id = ?
            ORDER BY cr.created_at DESC
            LIMIT ? OFFSET ?
        `, [teacherId, pageSize, offset]);

        res.json({
            success: true,
            data: {
                list: records,
                total: countResult.total
            }
        });
    } catch (error) {
        console.error('获取签到记录失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取签到详情
router.get('/checkin-records/:id/details', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const recordId = req.params.id;

        const details = await query(`
            SELECT sci.*, u.name as student_name, u.username, sp.student_id
            FROM student_check_ins sci
            JOIN users u ON sci.student_id = u.id
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE sci.record_id = ?
            ORDER BY sci.check_in_time
        `, [recordId]);

        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'checked' THEN 1 ELSE 0 END) as checked,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
            FROM student_check_ins WHERE record_id = ?
        `, [recordId]);

        res.json({
            success: true,
            data: {
                details,
                stats: stats[0]
            }
        });
    } catch (error) {
        console.error('获取签到详情失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取教师个人信息
router.get('/profile', async (req, res) => {
    try {
        const teacherId = req.user.id;

        const [user] = await query(
            'SELECT id, username, name, email, phone, avatar FROM users WHERE id = ?',
            [teacherId]
        );

        const [profile] = await query(
            'SELECT * FROM teacher_profiles WHERE user_id = ?',
            [teacherId]
        );

        res.json({
            success: true,
            data: {
                ...user,
                profile
            }
        });
    } catch (error) {
        console.error('获取教师信息失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新教师个人信息
router.put('/profile', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const { name, email, phone, department, title } = req.body;

        await query(
            'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone, teacherId]
        );

        // 检查是否已有教师档案
        const [existing] = await query(
            'SELECT id FROM teacher_profiles WHERE user_id = ?',
            [teacherId]
        );

        if (existing) {
            await query(
                'UPDATE teacher_profiles SET department = ?, title = ? WHERE user_id = ?',
                [department, title, teacherId]
            );
        } else {
            const [user] = await query(
                'SELECT username FROM users WHERE id = ?',
                [teacherId]
            );
            await query(
                'INSERT INTO teacher_profiles (user_id, teacher_id, department, title) VALUES (?, ?, ?, ?)',
                [teacherId, user.username, department, title]
            );
        }

        res.json({ success: true, message: '更新成功' });
    } catch (error) {
        console.error('更新教师信息失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新课程信息
router.put('/courses/:id', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const courseId = req.params.id;
        const { name, week_day, start_time, end_time, classroom } = req.body;

        // 验证课程是否属于该教师
        const [course] = await query(
            'SELECT * FROM courses WHERE id = ? AND teacher_id = ?',
            [courseId, teacherId]
        );

        if (!course) {
            return res.status(403).json({ success: false, message: '无权修改此课程' });
        }

        await query(
            'UPDATE courses SET name = ?, week_day = ?, start_time = ?, end_time = ?, classroom = ? WHERE id = ?',
            [name, week_day, start_time, end_time, classroom, courseId]
        );

        res.json({ success: true, message: '课程更新成功' });
    } catch (error) {
        console.error('更新课程失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新班级签到设置
router.put('/classes/:id/settings', async (req, res) => {
    try {
        const teacherId = req.user.id;
        const classId = req.params.id;
        const { allow_late, late_minutes, allow_makeup, makeup_hours } = req.body;

        // 验证班级是否属于该教师
        const [classInfo] = await query(
            'SELECT * FROM classes WHERE id = ? AND teacher_id = ?',
            [classId, teacherId]
        );

        if (!classInfo) {
            return res.status(403).json({ success: false, message: '无权修改此班级' });
        }

        // 检查是否已有设置记录
        const [existing] = await query(
            'SELECT * FROM class_settings WHERE class_id = ?',
            [classId]
        );

        if (existing) {
            await query(
                'UPDATE class_settings SET allow_late = ?, late_minutes = ?, allow_makeup = ?, makeup_hours = ? WHERE class_id = ?',
                [allow_late, late_minutes, allow_makeup, makeup_hours, classId]
            );
        } else {
            await query(
                'INSERT INTO class_settings (class_id, allow_late, late_minutes, allow_makeup, makeup_hours) VALUES (?, ?, ?, ?, ?)',
                [classId, allow_late, late_minutes, allow_makeup, makeup_hours]
            );
        }

        res.json({ success: true, message: '设置保存成功' });
    } catch (error) {
        console.error('保存设置失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;