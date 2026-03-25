const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'xuexitong-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 生成JWT令牌
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// 验证JWT令牌
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// 密码加密
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// 密码验证
const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};

// 认证中间件
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: '未提供认证令牌'
        });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: '令牌无效或已过期'
        });
    }

    req.user = decoded;
    next();
};

// 角色验证中间件
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: '未认证'
            });
        }

        // 支持中英文角色名验证
        const userRole = req.user.role;
        const roleMapping = {
            'student': ['student', '学生'],
            'teacher': ['teacher', '老师', '教师']
        };
        
        // 检查用户角色是否匹配允许的角色列表
        const isAllowed = roles.some(allowedRole => {
            // 直接匹配
            if (userRole === allowedRole) return true;
            // 通过映射匹配
            const mappedRoles = roleMapping[allowedRole] || [allowedRole];
            return mappedRoles.includes(userRole);
        });

        if (!isAllowed) {
            console.log(`权限不足: 用户角色 '${userRole}' 不在允许的角色列表 [${roles.join(', ')}] 中`);
            return res.status(403).json({
                success: false,
                message: '权限不足',
                debug: {
                    userRole: userRole,
                    requiredRoles: roles
                }
            });
        }

        next();
    };
};

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    authMiddleware,
    roleMiddleware
};