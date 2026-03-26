const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入路由
const authRoutes = require('../routes/auth');
const adminRoutes = require('../routes/admin');
const teacherRoutes = require('../routes/teacher');
const studentRoutes = require('../routes/student');

const app = express();

// 中间件
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '接口不存在'
    });
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('错误:', err);
    res.status(500).json({
        success: false,
        message: '服务器内部错误',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Vercel Serverless 导出
module.exports = app;
