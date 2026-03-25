const { query, transaction } = require('../config/database');
const { generateToken, hashPassword, comparePassword } = require('../utils/auth');
const { validationResult } = require('express-validator');

// 用户注册
const register = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMsgs = errors.array().map(e => e.msg).join(', ');
            return res.status(400).json({
                success: false,
                message: '参数验证失败: ' + errorMsgs,
                errors: errors.array()
            });
        }

        const { username, password, role, name, email, phone } = req.body;

        // 检查用户名是否已存在
        const existingUser = await query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: '用户名已存在'
            });
        }

        // 加密密码
        const hashedPassword = await hashPassword(password);

        // 创建用户
        const result = await query(
            `INSERT INTO users (username, password, role, name, email, phone, is_profile_complete) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, hashedPassword, role, name, email, phone, role === 'teacher' ? 1 : 0]
        );

        const userId = result.insertId;

        // 如果是学生，创建学生档案
        if (role === 'student') {
            await query(
                'INSERT INTO student_profiles (user_id, student_id) VALUES (?, ?)',
                [userId, username]
            );
        }
        // 如果是教师，创建教师档案
        else if (role === 'teacher') {
            await query(
                'INSERT INTO teacher_profiles (user_id, teacher_id) VALUES (?, ?)',
                [userId, username]
            );
        }

        // 生成令牌
        const token = generateToken({
            id: userId,
            username,
            role,
            name
        });

        res.status(201).json({
            success: true,
            message: '注册成功',
            data: {
                user: {
                    id: userId,
                    username,
                    role,
                    name,
                    email,
                    phone,
                    isProfileComplete: role === 'teacher'
                },
                token
            }
        });

    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

// 用户登录
const login = async (req, res) => {
    try {
        // 验证请求数据
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // 查询用户
        const users = await query(
            `SELECT id, username, password, role, name, email, phone, 
                    avatar, status, is_profile_complete 
             FROM users WHERE username = ? AND status = 1`,
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        const user = users[0];

        // 验证密码
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }

        // 生成令牌
        const token = generateToken({
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name
        });

        // 根据角色获取额外信息
        let profile = null;
        if (user.role === 'student') {
            const profiles = await query(
                `SELECT sp.*, c.name as class_name 
                 FROM student_profiles sp 
                 LEFT JOIN classes c ON sp.class_name = c.name
                 WHERE sp.user_id = ?`,
                [user.id]
            );
            if (profiles.length > 0) {
                profile = profiles[0];
            }
        } else if (user.role === 'teacher') {
            const profiles = await query(
                'SELECT * FROM teacher_profiles WHERE user_id = ?',
                [user.id]
            );
            if (profiles.length > 0) {
                profile = profiles[0];
            }
        }

        res.json({
            success: true,
            message: '登录成功',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    isProfileComplete: user.is_profile_complete === 1,
                    profile
                },
                token
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;

        const users = await query(
            `SELECT id, username, role, name, email, phone, 
                    avatar, status, is_profile_complete 
             FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: '用户不存在'
            });
        }

        const user = users[0];

        // 根据角色获取额外信息
        let profile = null;
        if (user.role === 'student') {
            const profiles = await query(
                `SELECT sp.*, c.name as class_name 
                 FROM student_profiles sp 
                 LEFT JOIN classes c ON sp.class_name = c.name
                 WHERE sp.user_id = ?`,
                [user.id]
            );
            if (profiles.length > 0) {
                profile = profiles[0];
            }
        } else if (user.role === 'teacher') {
            const profiles = await query(
                'SELECT * FROM teacher_profiles WHERE user_id = ?',
                [user.id]
            );
            if (profiles.length > 0) {
                profile = profiles[0];
            }
        }

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    isProfileComplete: user.is_profile_complete === 1,
                    profile
                }
            }
        });

    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

// 完善学生信息
const completeProfile = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: '参数验证失败',
                errors: errors.array()
            });
        }

        const userId = req.user.id;
        const { studentId, name, phone, className, department, major } = req.body;

        // 更新用户信息
        await query(
            `UPDATE users SET name = ?, phone = ?, is_profile_complete = 1 WHERE id = ?`,
            [name, phone, userId]
        );

        // 更新或创建学生档案
        const existingProfile = await query(
            'SELECT id FROM student_profiles WHERE user_id = ?',
            [userId]
        );

        if (existingProfile.length > 0) {
            await query(
                `UPDATE student_profiles 
                 SET student_id = ?, class_name = ?, department = ?, major = ? 
                 WHERE user_id = ?`,
                [studentId, className, department, major, userId]
            );
        } else {
            await query(
                `INSERT INTO student_profiles (user_id, student_id, class_name, department, major) 
                 VALUES (?, ?, ?, ?, ?)`,
                [userId, studentId, className, department, major]
            );
        }

        res.json({
            success: true,
            message: '信息完善成功'
        });

    } catch (error) {
        console.error('完善信息错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器内部错误'
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    completeProfile
};