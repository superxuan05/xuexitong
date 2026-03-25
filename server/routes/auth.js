const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../utils/auth');

// 注册验证规则
const registerValidation = [
    body('username')
        .notEmpty().withMessage('用户名不能为空')
        .isLength({ min: 3, max: 50 }).withMessage('用户名长度应在3-50个字符之间'),
    body('password')
        .notEmpty().withMessage('密码不能为空')
        .isLength({ min: 6 }).withMessage('密码长度至少为6个字符'),
    body('role')
        .notEmpty().withMessage('角色不能为空')
        .isIn(['student', 'teacher']).withMessage('角色必须是student或teacher'),
    body('name')
        .notEmpty().withMessage('姓名不能为空')
        .isLength({ max: 50 }).withMessage('姓名长度不能超过50个字符'),
    body('email')
        .optional()
        .isEmail().withMessage('邮箱格式不正确'),
    body('phone')
        .optional({ checkFalsy: true })
        .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确')
];

// 登录验证规则
const loginValidation = [
    body('username')
        .notEmpty().withMessage('用户名不能为空'),
    body('password')
        .notEmpty().withMessage('密码不能为空')
];

// 完善信息验证规则
const completeProfileValidation = [
    body('studentId')
        .notEmpty().withMessage('学号不能为空'),
    body('name')
        .notEmpty().withMessage('姓名不能为空'),
    body('phone')
        .notEmpty().withMessage('手机号不能为空')
        .matches(/^1[3-9]\d{9}$/).withMessage('手机号格式不正确'),
    body('className')
        .notEmpty().withMessage('班级不能为空'),
    body('department')
        .notEmpty().withMessage('学院不能为空')
];

// 路由定义
// POST /api/auth/register - 用户注册
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login - 用户登录
router.post('/login', loginValidation, authController.login);

// GET /api/auth/me - 获取当前用户信息（需要认证）
router.get('/me', authMiddleware, authController.getCurrentUser);

// POST /api/auth/complete-profile - 完善学生信息（需要认证）
router.post('/complete-profile', authMiddleware, completeProfileValidation, authController.completeProfile);

module.exports = router;