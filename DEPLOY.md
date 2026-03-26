# Render 部署指南

## 部署步骤

### 1. 注册 Render 账号
1. 访问 https://render.com
2. 点击 "Get Started for Free"
3. 使用 GitHub 账号登录

### 2. 创建数据库
1. 在 Render Dashboard 点击 "New +"
2. 选择 "PostgreSQL" 或 "MySQL"
3. 配置：
   - Name: `xuexitong-db`
   - Database: `xuexitong`
   - User: `xuexitong`
   - 其他保持默认
4. 点击 "Create Database"
5. 等待数据库创建完成（约 1-2 分钟）
6. 复制连接信息（Internal Database URL）

### 3. 创建 Web Service
1. 点击 "New +" → "Web Service"
2. 选择你的 GitHub 仓库 `superxuan05/xuexitong`
3. 配置：
   - Name: `xuexitong-backend`
   - Runtime: `Node`
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Plan: `Free`
4. 点击 "Create Web Service"

### 4. 配置环境变量
在 Web Service 的 "Environment" 标签页添加：

```
NODE_ENV=production
PORT=10000
DB_HOST=your-db-host.render.com
DB_PORT=3306
DB_USER=xuexitong
DB_PASSWORD=your-db-password
DB_NAME=xuexitong
DB_SSL=true
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=*
```

### 5. 初始化数据库
数据库创建后，需要导入表结构：

**方法1：使用 Render Shell**
1. 进入数据库管理页面
2. 找到 "Shell" 标签
3. 执行 SQL 文件内容

**方法2：本地导入后迁移**
1. 在本地创建数据库结构
2. 使用 `mysqldump` 导出
3. 在 Render 数据库 Shell 中导入

### 6. 部署完成
等待部署完成，你会得到一个类似 `https://xuexitong-backend.onrender.com` 的 URL

## 前端配置

修改前端 API 地址：

```typescript
// xuexitong/src/utils/api.ts
const API_BASE_URL = 'https://xuexitong-backend.onrender.com'
```

然后重新构建并部署前端到 GitHub Pages。

## 注意事项

1. **免费数据库90天限制**：
   - 90天后数据库会被删除
   - 需要提前备份数据
   - 或者升级到付费版 ($7/月)

2. **冷启动**：
   - 免费版一段时间不访问会休眠
   - 首次访问可能需要 30 秒唤醒

3. **WebSocket 限制**：
   - Render 免费版支持 WebSocket
   - 但连接数有限制

## 备份脚本

创建定期备份：

```bash
# backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d)
mysqldump -h your-db-host.render.com -u xuexitong -p'your-password' xuexitong > backup-$DATE.sql
echo "Backup completed: backup-$DATE.sql"
```

添加到 cron 每周执行：
```bash
0 0 * * 0 /path/to/backup.sh
```
