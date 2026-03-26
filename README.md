# 智签 - 课堂签到系统

[![GitHub](https://img.shields.io/badge/GitHub-superxuan05%2Fxuexitong-blue)](https://github.com/superxuan05/xuexitong)
[![Vue3](https://img.shields.io/badge/Vue-3.0-green)](https://vuejs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://www.mysql.com/)

智签是一款基于 Vue3 + Node.js + MySQL 的现代化课堂签到系统，支持教师发起签到、学生实时签到、考勤记录管理等功能。

## 功能特性

### 教师端
- 班级管理：创建班级、管理学生、生成邀请码
- 课程管理：设置课程时间、编辑课程信息
- 签到功能：发起签到、设置签到时长、实时查看签到情况
- 考勤记录：查看历史签到记录、导出考勤数据
- 个人设置：修改个人信息、密码等

### 学生端
- 加入班级：通过邀请码加入班级
- 实时签到：输入签到码完成签到
- 考勤记录：查看个人签到历史
- 个人设置：完善个人信息

### 后台管理
- 用户管理：管理系统用户
- 班级管理：查看所有班级信息
- 课程管理：管理课程数据
- 签到记录：查看所有签到记录

## 技术栈

### 前端
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vue Router** - 官方路由管理器
- **Vite** - 下一代前端构建工具

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 应用框架
- **MySQL2** - MySQL 数据库驱动
- **JWT** - JSON Web Token 认证
- **bcryptjs** - 密码加密
- **WebSocket** - 实时通信

### 数据库
- **MySQL 8.0** - 关系型数据库

## 项目结构

```
xuexitong/
├── xuexitong/              # 前端项目
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   │   ├── student/    # 学生端页面
│   │   │   └── teacher/    # 教师端页面
│   │   ├── utils/          # 工具函数
│   │   └── router/         # 路由配置
│   └── package.json
├── server/                 # 后端 API
│   ├── routes/             # API 路由
│   ├── controllers/        # 控制器
│   ├── utils/              # 工具函数
│   └── package.json
├── admin/                  # 后台管理系统
│   └── src/
├── database/               # 数据库脚本
│   ├── init.sql            # 数据库初始化
│   └── docker-compose.yml  # Docker 配置
└── *.bat                   # 启动脚本
```

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/superxuan05/xuexitong.git
cd xuexitong
```

### 2. 安装依赖

```bash
# 安装前端依赖
cd xuexitong
npm install

# 安装后端依赖
cd ../server
npm install

# 安装后台管理依赖
cd ../admin
npm install
```

### 3. 配置数据库

#### 方式一：使用本地 MySQL

1. 安装 MySQL 8.0
2. 创建数据库用户：
```sql
CREATE USER 'xuexitong'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON xuexitong.* TO 'xuexitong'@'localhost';
FLUSH PRIVILEGES;
```

3. 初始化数据库：
```bash
cd database
mysql -u xuexitong -p123456 < init.sql
```

#### 方式二：使用 Docker

```bash
cd database
docker-compose up -d
```

### 4. 启动服务

#### 方式一：一键启动（Windows）

```bash
# 使用本地 MySQL
start-all-local.bat

# 或使用 Docker
start-all.bat
```

#### 方式二：手动启动

```bash
# 启动后端
cd server
npm run dev

# 启动前端（新终端）
cd xuexitong
npm run dev

# 启动后台管理（新终端）
cd admin
npm run dev
```

### 5. 访问系统

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000
- 后台管理：http://localhost:5174

## 测试账号

### 教师账号
- 工号：T2024001
- 密码：123456

### 学生账号
- 学号：20240001 - 20240050
- 密码：123456

### 后台管理
- 账号：admin
- 密码：123456

## API 文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 教师端
- `GET /api/teacher/classes` - 获取班级列表
- `POST /api/teacher/classes` - 创建班级
- `POST /api/teacher/checkin` - 发起签到
- `POST /api/teacher/checkin/:id/end` - 结束签到

### 学生端
- `GET /api/student/classes` - 获取已加入班级
- `POST /api/student/join-class` - 加入班级
- `POST /api/student/checkin` - 学生签到

## 部署

### 前端部署

```bash
cd xuexitong
npm run build
```

构建后的文件在 `dist/` 目录，可部署到任何静态托管服务。

### 后端部署

```bash
cd server
npm start
```

### Docker 部署

```bash
# 构建并启动所有服务
docker-compose up -d
```

## 开发计划

- [x] 用户注册/登录
- [x] 角色区分（教师/学生）
- [x] 班级管理
- [x] 签到功能
- [x] 实时通知（WebSocket）
- [x] 考勤记录
- [x] 后台管理系统
- [ ] 签到位置验证
- [ ] 人脸识别签到
- [ ] 数据统计分析
- [ ] 移动端适配优化

## 贡献指南

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/xxx`
3. 提交更改：`git commit -am 'Add some feature'`
4. 推送分支：`git push origin feature/xxx`
5. 创建 Pull Request

## 许可证

[MIT](LICENSE)

## 联系方式

- 作者：superxuan05
- GitHub：https://github.com/superxuan05/xuexitong

---

Made with ❤️ by superxuan05
