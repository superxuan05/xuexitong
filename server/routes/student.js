const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../utils/auth');
const wsManager = require('../utils/websocket');

// 所有路由都需要学生身份验证
router.use(authMiddleware);
router.use(roleMiddleware(['student']));

// 获取学生概览数据
router.get('/dashboard', async (req, res) => {
    try {
        const studentId = req.user.id;

        // 获取今日课程
        const todayCourses = await query(`
            SELECT c.*, u.name as teacher_name, cr.check_in_code, cr.id as record_id,
                   sci.status as check_in_status, sci.check_in_time
            FROM class_students cs
            JOIN classes cl ON cs.class_id = cl.id
            JOIN courses c ON c.class_id = cl.id
            JOIN users u ON c.teacher_id = u.id
            LEFT JOIN check_in_records cr ON cr.course_id = c.id AND DATE(cr.start_time) = CURDATE()
            LEFT JOIN student_check_ins sci ON sci.record_id = cr.id AND sci.student_id = ?
            WHERE cs.student_id = ? AND cs.status = 'active' AND c.status = 1
        `, [studentId, studentId]);

        // 获取签到统计
        const [stats] = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN sci.status = 'checked' THEN 1 ELSE 0 END) as checked,
                SUM(CASE WHEN sci.status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN sci.status = 'absent' THEN 1 ELSE 0 END) as absent
            FROM student_check_ins sci
            JOIN check_in_records cr ON sci.record_id = cr.id
            WHERE sci.student_id = ?
        `, [studentId]);

        res.json({
            success: true,
            data: {
                courses: todayCourses,
                stats: {
                    total: stats.total || 0,
                    checked: stats.checked || 0,
                    late: stats.late || 0,
                    absent: stats.absent || 0
                }
            }
        });
    } catch (error) {
        console.error('获取学生概览失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取学生课程列表
router.get('/courses', async (req, res) => {
    try {
        const studentId = req.user.id;

        const courses = await query(`
            SELECT c.*, u.name as teacher_name, cl.name as class_name
            FROM class_students cs
            JOIN classes cl ON cs.class_id = cl.id
            JOIN courses c ON c.class_id = cl.id
            JOIN users u ON c.teacher_id = u.id
            WHERE cs.student_id = ? AND cs.status = 'active' AND c.status = 1
        `, [studentId]);

        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('获取课程列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取考勤记录
router.get('/attendance', async (req, res) => {
    try {
        const studentId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        // 构建查询条件
        let whereClause = 'WHERE sci.student_id = ?';
        const params = [studentId];

        if (req.query.course && req.query.course !== '全部课程') {
            whereClause += ' AND c.name = ?';
            params.push(req.query.course);
        }

        if (req.query.status) {
            whereClause += ' AND sci.status = ?';
            params.push(req.query.status);
        }

        if (req.query.dateRange === 'week') {
            whereClause += ' AND cr.start_time >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        } else if (req.query.dateRange === 'month') {
            whereClause += ' AND cr.start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        }

        // 获取总数
        const [countResult] = await query(`
            SELECT COUNT(*) as total
            FROM student_check_ins sci
            JOIN check_in_records cr ON sci.record_id = cr.id
            JOIN courses c ON cr.course_id = c.id
            JOIN users u ON cr.teacher_id = u.id
            ${whereClause}
        `, params);

        // 获取记录
        const records = await query(`
            SELECT 
                sci.id,
                c.name as course,
                u.name as teacher,
                DATE_FORMAT(cr.start_time, '%Y-%m-%d') as date,
                CONCAT(DATE_FORMAT(cr.start_time, '%H:%i'), ' - ', DATE_FORMAT(cr.end_time, '%H:%i')) as time,
                DATE_FORMAT(sci.check_in_time, '%H:%i:%s') as checkInTime,
                sci.status
            FROM student_check_ins sci
            JOIN check_in_records cr ON sci.record_id = cr.id
            JOIN courses c ON cr.course_id = c.id
            JOIN users u ON cr.teacher_id = u.id
            ${whereClause}
            ORDER BY cr.start_time DESC
            LIMIT ? OFFSET ?
        `, [...params, pageSize, offset]);

        // 获取统计
        const [stats] = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN sci.status = 'checked' THEN 1 ELSE 0 END) as checked,
                SUM(CASE WHEN sci.status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN sci.status = 'absent' THEN 1 ELSE 0 END) as absent
            FROM student_check_ins sci
            WHERE sci.student_id = ?
        `, [studentId]);

        res.json({
            success: true,
            data: {
                list: records,
                total: countResult.total,
                stats: {
                    total: stats.total || 0,
                    checked: stats.checked || 0,
                    late: stats.late || 0,
                    absent: stats.absent || 0
                }
            }
        });
    } catch (error) {
        console.error('获取考勤记录失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 学生签到
router.post('/checkin', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { record_id, check_in_code } = req.body;

        // 验证签到码
        const [record] = await query(
            'SELECT * FROM check_in_records WHERE id = ? AND check_in_code = ? AND status = "ongoing" AND end_time > NOW()',
            [record_id, check_in_code]
        );

        if (!record) {
            return res.status(400).json({ success: false, message: '签到码错误或已过期' });
        }

        // 检查学生是否在该班级
        const [enrollment] = await query(`
            SELECT cs.* FROM class_students cs
            JOIN courses c ON c.class_id = cs.class_id
            WHERE c.id = ? AND cs.student_id = ? AND cs.status = 'active'
        `, [record.course_id, studentId]);

        if (!enrollment) {
            return res.status(403).json({ success: false, message: '您不在该课程的班级中' });
        }

        // 更新签到状态
        await query(
            'UPDATE student_check_ins SET status = "checked", check_in_time = NOW() WHERE record_id = ? AND student_id = ?',
            [record_id, studentId]
        );

        // 获取学生信息
        const [studentInfo] = await query(
            'SELECT name, username FROM users WHERE id = ?',
            [studentId]
        );

        // 获取课程信息
        const [courseInfo] = await query(
            'SELECT c.name as course_name FROM check_in_records cr JOIN courses c ON cr.course_id = c.id WHERE cr.id = ?',
            [record_id]
        );

        // 发送实时通知给教师
        wsManager.sendToUser(record.teacher_id, {
            type: 'student_checked_in',
            message: `学生 ${studentInfo.name} 签到了课程 ${courseInfo.course_name}`,
            data: {
                student_id: studentId,
                student_name: studentInfo.name,
                student_username: studentInfo.username,
                record_id: record_id,
                course_name: courseInfo.course_name,
                check_in_time: new Date().toISOString(),
                timestamp: new Date().toISOString()
            }
        });

        res.json({ success: true, message: '签到成功' });
    } catch (error) {
        console.error('签到失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取学生个人信息
router.get('/profile', async (req, res) => {
    try {
        const studentId = req.user.id;

        const [user] = await query(
            'SELECT id, username, name, email, phone, created_at FROM users WHERE id = ?',
            [studentId]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        // 获取学生档案
        const [profile] = await query(
            'SELECT * FROM student_profiles WHERE user_id = ?',
            [studentId]
        );

        // 获取班级信息
        const classInfo = await query(`
            SELECT cl.name as class_name FROM class_students cs
            JOIN classes cl ON cs.class_id = cl.id
            WHERE cs.student_id = ? AND cs.status = 'active'
            LIMIT 1
        `, [studentId]);

        res.json({
            success: true,
            data: {
                ...user,
                profile: profile || {},
                class_name: classInfo.length > 0 ? classInfo[0].class_name : null
            }
        });
    } catch (error) {
        console.error('获取学生信息失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新学生个人信息
router.put('/profile', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { name, email, phone, major } = req.body;

        await query(
            'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone, studentId]
        );

        // 检查是否已有学生档案
        const [existing] = await query(
            'SELECT id FROM student_profiles WHERE user_id = ?',
            [studentId]
        );

        if (existing) {
            await query(
                'UPDATE student_profiles SET major = ? WHERE user_id = ?',
                [major, studentId]
            );
        } else {
            const [user] = await query(
                'SELECT username FROM users WHERE id = ?',
                [studentId]
            );
            await query(
                'INSERT INTO student_profiles (user_id, student_id, major) VALUES (?, ?, ?)',
                [studentId, user.username, major]
            );
        }

        res.json({ success: true, message: '更新成功' });
    } catch (error) {
        console.error('更新学生信息失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取学生已加入的班级列表
router.get('/classes', async (req, res) => {
    try {
        const studentId = req.user.id;

        const classes = await query(`
            SELECT 
                cl.id,
                cl.name,
                cl.course_name,
                u.name as teacher_name,
                DATE_FORMAT(cs.join_time, '%Y-%m-%d') as join_time
            FROM class_students cs
            JOIN classes cl ON cs.class_id = cl.id
            JOIN users u ON cl.teacher_id = u.id
            WHERE cs.student_id = ? AND cs.status = 'active'
            ORDER BY cs.join_time DESC
        `, [studentId]);

        res.json({ success: true, data: classes });
    } catch (error) {
        console.error('获取班级列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 加入班级
router.post('/join-class', async (req, res) => {
    try {
        const studentId = req.user.id;
        const { invite_code } = req.body;

        // 查找班级
        const [classInfo] = await query(
            'SELECT * FROM classes WHERE invite_code = ? AND status = 1',
            [invite_code]
        );

        if (!classInfo) {
            return res.status(404).json({ success: false, message: '邀请码无效或班级不存在' });
        }

        // 检查是否已在班级中
        const [existing] = await query(
            'SELECT * FROM class_students WHERE class_id = ? AND student_id = ? AND status = "active"',
            [classInfo.id, studentId]
        );

        if (existing) {
            return res.status(400).json({ success: false, message: '您已经在这个班级中了' });
        }

        // 检查是否曾经加入过（已退出）
        const [previous] = await query(
            'SELECT * FROM class_students WHERE class_id = ? AND student_id = ?',
            [classInfo.id, studentId]
        );

        if (previous) {
            // 重新激活
            await query(
                'UPDATE class_students SET status = "active", join_time = NOW() WHERE id = ?',
                [previous.id]
            );
        } else {
            // 新加入
            await query(
                'INSERT INTO class_students (class_id, student_id, status, join_time) VALUES (?, ?, "active", NOW())',
                [classInfo.id, studentId]
            );
        }

        // 获取学生信息
        const [studentInfo] = await query(
            'SELECT name, username FROM users WHERE id = ?',
            [studentId]
        );

        // 发送实时通知给教师
        wsManager.sendToUser(classInfo.teacher_id, {
            type: 'student_joined',
            message: `新学生 ${studentInfo.name} 加入了班级 ${classInfo.name}`,
            data: {
                student_id: studentId,
                student_name: studentInfo.name,
                student_username: studentInfo.username,
                class_id: classInfo.id,
                class_name: classInfo.name,
                timestamp: new Date().toISOString()
            }
        });

        res.json({
            success: true,
            message: '加入班级成功',
            data: {
                class_id: classInfo.id,
                class_name: classInfo.name
            }
        });
    } catch (error) {
        console.error('加入班级失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 退出班级
router.post('/classes/:id/leave', async (req, res) => {
    try {
        const studentId = req.user.id;
        const classId = req.params.id;

        await query(
            'UPDATE class_students SET status = "inactive" WHERE class_id = ? AND student_id = ?',
            [classId, studentId]
        );

        res.json({ success: true, message: '已退出班级' });
    } catch (error) {
        console.error('退出班级失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;
