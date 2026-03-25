# 智签系统后端 API

基于 Node.js + Express + MySQL 的 RESTful API 服务

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web 框架
- **MySQL2** - 数据库驱动
- **bcryptjs** - 密码加密
- **jsonwebtoken** - JWT 认证
- **express-validator** - 参数验证
- **cors** - 跨域处理
- **dotenv** - 环境变量

## 目录结构

```
server/
├── config/
│   └── database.js      # 数据库配置
├── controllers/
│   └── authController.js # 认证控制器
├── routes/
│   └── auth.js          # 认证路由
├── utils/
│   └── auth.js          # 认证工具函数
├── app.js               # 应用入口
├── package.json         # 项目配置
├── .env                 # 环境变量
└── README.md            # 说明文档
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

编辑 `.env` 文件：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=xuexitong
DB_PASSWORD=123456
DB_NAME=xuexitong
JWT_SECRET=xuexitong-secret-key-2024
CLIENT_URL=http://localhost:5173
```

### 3. 启动数据库

确保 MySQL 数据库已启动，并且已执行 `database/init.sql` 初始化脚本。

### 4. 启动服务器

开发模式（带热重载）：
```bash
npm run dev
```

生产模式：
```bash
npm start
```

## API 接口文档

### 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`

### 认证相关

#### 1. 用户注册

```http
POST /api/auth/register
```

请求参数：
```json
{
  "username": "2021001001",
  "password": "123456",
  "role": "student",
  "name": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138001"
}
```

响应示例：
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": 1,
      "username": "2021001001",
      "role": "student",
      "name": "张三",
      "email": "zhangsan@example.com",
      "phone": "13800138001",
      "isProfileComplete": false
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 2. 用户登录

```http
POST /api/auth/login
```

请求参数：
```json
{
  "username": "2021001001",
  "password": "123456"
}
```

响应示例：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "username": "2021001001",
      "role": "student",
      "name": "张三",
      "email": "zhangsan@example.com",
      "phone": "13800138001",
      "isProfileComplete": true,
      "profile": {
        "student_id": "2021001001",
        "class_name": "计算机2101班",
        "department": "计算机学院",
        "major": "计算机科学与技术"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### 3. 获取当前用户信息

```http
GET /api/auth/me
Authorization: Bearer <token>
```

响应示例：
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "2021001001",
      "role": "student",
      "name": "张三",
      "isProfileComplete": true
    }
  }
}
```

#### 4. 完善学生信息

```http
POST /api/auth/complete-profile
Authorization: Bearer <token>
```

请求参数：
```json
{
  "studentId": "2021001001",
  "name": "张三",
  "phone": "13800138001",
  "className": "计算机2101班",
  "department": "计算机学院",
  "major": "计算机科学与技术"
}
```

响应示例：
```json
{
  "success": true,
  "message": "信息完善成功"
}
```

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "errors": [
    {
      "msg": "错误信息",
      "param": "字段名",
      "location": "body"
    }
  ]
}
```

## 测试账号

### 教师账号
- 用户名: `T2021001`
- 密码: `123456`

### 学生账号
- 用户名: `2021001001`
- 密码: `123456`

## 前端集成示例

### 使用 fetch 登录

```javascript
const login = async (username, password) => {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // 保存 token
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    return data.data;
  } else {
    throw new Error(data.message);
  }
};
```

### 使用 axios 带认证请求

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

// 请求拦截器添加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 获取用户信息
const getUserInfo = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
```

## 开发计划

- [x] 用户注册/登录
- [x] JWT 认证
- [x] 完善个人信息
- [ ] 班级管理 API
- [ ] 课程管理 API
- [ ] 签到功能 API
- [ ] 考勤统计 API
- [ ] 文件上传（头像）
- [ ] WebSocket 实时通知
