const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { testConnection } = require('./config/database');
const wsManager = require('./utils/websocket');

// 加载环境变量
dotenv.config();

// 导入路由
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();
const PORT = process.env.PORT || 3000;

// 创建HTTP服务器（用于WebSocket）
const server = http.createServer(app);

// 中间件
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

// 启动服务器
const startServer = async () => {
    try {
        // 测试数据库连接
        await testConnection();

        // 启动HTTP服务器
        server.listen(PORT, () => {
            console.log(`\n🚀 服务器启动成功`);
            console.log(`📡 监听端口: ${PORT}`);
            console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
            console.log(`\nAPI地址:`);
            console.log(`  - 注册: POST http://localhost:${PORT}/api/auth/register`);
            console.log(`  - 登录: POST http://localhost:${PORT}/api/auth/login`);
            console.log(`  - 获取用户信息: GET http://localhost:${PORT}/api/auth/me`);
            console.log(`  - 完善信息: POST http://localhost:${PORT}/api/auth/complete-profile`);
            console.log(`  - 健康检查: GET http://localhost:${PORT}/api/health`);
            console.log(`  - WebSocket: ws://localhost:${PORT}\n`);
        });

        // 初始化WebSocket服务器
        wsManager.init(server);

    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
};

startServer();

// 导出WebSocket管理器供路由使用
module.exports = { wsManager };