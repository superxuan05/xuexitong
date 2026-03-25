const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { hashPassword } = require('../utils/auth');

// 获取统计数据
router.get('/statistics', async (req, res) => {
    try {
        const [userStats] = await query('SELECT COUNT(*) as total FROM users WHERE status = 1');
        const [teacherStats] = await query("SELECT COUNT(*) as total FROM users WHERE role = 'teacher' AND status = 1");
        const [studentStats] = await query("SELECT COUNT(*) as total FROM users WHERE role = 'student' AND status = 1");
        const [classStats] = await query('SELECT COUNT(*) as total FROM classes WHERE status = 1');

        res.json({
            success: true,
            data: {
                totalUsers: userStats.total,
                teacherCount: teacherStats.total,
                studentCount: studentStats.total,
                classCount: classStats.total
            }
        });
    } catch (error) {
        console.error('获取统计数据失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取最近注册用户
router.get('/recent-users', async (req, res) => {
    try {
        const users = await query(
            `SELECT id, username, role, name, created_at 
             FROM users ORDER BY created_at DESC LIMIT 10`
        );
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('获取最近用户失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取用户列表
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        const [countResult] = await query('SELECT COUNT(*) as total FROM users');
        const users = await query(
            `SELECT id, username, role, name, email, phone, status, is_profile_complete, created_at 
             FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [pageSize, offset]
        );

        res.json({
            success: true,
            data: {
                list: users,
                total: countResult.total
            }
        });
    } catch (error) {
        console.error('获取用户列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 添加用户
router.post('/users', async (req, res) => {
    try {
        const { username, password, role, name, email, phone } = req.body;
        const hashedPassword = await hashPassword(password);

        const result = await query(
            `INSERT INTO users (username, password, role, name, email, phone, is_profile_complete) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, role, name, email, phone, role === 'teacher' ? 1 : 0]
        );

        res.json({ success: true, message: '添加成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('添加用户失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新用户状态
router.put('/users/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: '更新成功' });
    } catch (error) {
        console.error('更新用户状态失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 删除用户
router.delete('/users/:id', async (req, res) => {
    try {
        await query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('删除用户失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取教师列表
router.get('/teachers', async (req, res) => {
    try {
        const teachers = await query(
            "SELECT id, username, name FROM users WHERE role = 'teacher' AND status = 1"
        );
        res.json({ success: true, data: teachers });
    } catch (error) {
        console.error('获取教师列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取班级列表
router.get('/classes', async (req, res) => {
    try {
        const classes = await query(`
            SELECT c.*, u.name as teacher_name 
            FROM classes c 
            LEFT JOIN users u ON c.teacher_id = u.id 
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, data: classes });
    } catch (error) {
        console.error('获取班级列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 添加班级
router.post('/classes', async (req, res) => {
    try {
        const { name, course_name, teacher_id, invite_code } = req.body;
        const result = await query(
            'INSERT INTO classes (name, course_name, teacher_id, invite_code) VALUES (?, ?, ?, ?)',
            [name, course_name, teacher_id, invite_code]
        );
        res.json({ success: true, message: '添加成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('添加班级失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取班级学生
router.get('/classes/:id/students', async (req, res) => {
    try {
        const students = await query(`
            SELECT u.id, u.name, sp.student_id, cs.join_time 
            FROM class_students cs 
            JOIN users u ON cs.student_id = u.id 
            LEFT JOIN student_profiles sp ON u.id = sp.user_id
            WHERE cs.class_id = ? AND cs.status = 'active'
        `, [req.params.id]);
        res.json({ success: true, data: students });
    } catch (error) {
        console.error('获取班级学生失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 删除班级
router.delete('/classes/:id', async (req, res) => {
    try {
        await query('DELETE FROM classes WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('删除班级失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取课程列表
router.get('/courses', async (req, res) => {
    try {
        const courses = await query(`
            SELECT c.*, u.name as teacher_name, cl.name as class_name 
            FROM courses c 
            LEFT JOIN users u ON c.teacher_id = u.id 
            LEFT JOIN classes cl ON c.class_id = cl.id
            ORDER BY c.created_at DESC
        `);
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('获取课程列表失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 添加课程
router.post('/courses', async (req, res) => {
    try {
        const { name, teacher_id, class_id, classroom, schedule } = req.body;
        const result = await query(
            'INSERT INTO courses (name, teacher_id, class_id, classroom, schedule) VALUES (?, ?, ?, ?, ?)',
            [name, teacher_id, class_id, classroom, schedule]
        );
        res.json({ success: true, message: '添加成功', data: { id: result.insertId } });
    } catch (error) {
        console.error('添加课程失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 删除课程
router.delete('/courses/:id', async (req, res) => {
    try {
        await query('DELETE FROM courses WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: '删除成功' });
    } catch (error) {
        console.error('删除课程失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 获取签到记录
router.get('/checkin-records', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

        const [countResult] = await query('SELECT COUNT(*) as total FROM check_in_records');
        const records = await query(`
            SELECT cr.*, c.name as course_name, u.name as teacher_name 
            FROM check_in_records cr 
            LEFT JOIN courses c ON cr.course_id = c.id 
            LEFT JOIN users u ON cr.teacher_id = u.id
            ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
        `, [pageSize, offset]);

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
        const details = await query(`
            SELECT sci.*, u.name as student_name 
            FROM student_check_ins sci 
            JOIN users u ON sci.student_id = u.id 
            WHERE sci.record_id = ?
        `, [req.params.id]);

        const stats = await query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'checked' THEN 1 ELSE 0 END) as checked,
                SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
            FROM student_check_ins WHERE record_id = ?
        `, [req.params.id]);

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

// 获取管理员个人信息
router.get('/profile', async (req, res) => {
    try {
        // 从请求头获取token并解析用户ID
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.id;

        const [user] = await query(
            'SELECT id, username, name, email, phone FROM users WHERE id = ?',
            [userId]
        );

        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('获取个人信息失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 更新管理员个人信息
router.put('/profile', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.id;

        const { name, email, phone } = req.body;

        await query(
            'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
            [name, email, phone, userId]
        );

        res.json({ success: true, message: '更新成功' });
    } catch (error) {
        console.error('更新个人信息失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

// 修改密码
router.post('/change-password', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: '未授权' });
        }
        
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const userId = decoded.id;

        const { oldPassword, newPassword } = req.body;

        // 验证原密码
        const [user] = await query('SELECT password FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ success: false, message: '用户不存在' });
        }

        const { comparePassword, hashPassword } = require('../utils/auth');
        const isMatch = await comparePassword(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: '原密码错误' });
        }

        // 更新密码
        const hashedPassword = await hashPassword(newPassword);
        await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: '密码修改成功' });
    } catch (error) {
        console.error('修改密码失败:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
});

module.exports = router;