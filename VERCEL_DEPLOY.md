# Vercel 部署指南

## 特点

- ✅ **免费额度大**：每月 100GB 带宽
- ✅ **国内访问快**：有香港、新加坡节点
- ✅ **自动部署**：Git 推送自动部署
- ✅ **永不休眠**：无冷启动问题
- ⚠️ **Serverless**：WebSocket 需要特殊处理

## 部署步骤

### 1. 注册 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 登录
3. 导入你的仓库 `superxuan05/xuexitong`

### 2. 配置项目

在 Vercel Dashboard 中：

**Framework Preset**: `Other`

**Build Command**:
```bash
cd server && npm install
```

**Output Directory**: `server`

**Install Command**: `npm install`

### 3. 配置环境变量

在 Project Settings → Environment Variables 中添加：

```
DB_HOST=your-db-host
DB_PORT=3306
DB_USER=xuexitong
DB_PASSWORD=your-password
DB_NAME=xuexitong
DB_SSL=true
JWT_SECRET=your-secret-key
CLIENT_URL=*
```

### 4. 数据库选择

Vercel 不提供数据库，需要配合以下服务：

#### 选项 A：Railway MySQL（推荐）
- 免费，无时间限制
- 注册：https://railway.app
- 创建 MySQL 数据库
- 复制连接信息到 Vercel 环境变量

#### 选项 B：PlanetScale
- 免费 5GB 存储
- MySQL 兼容
- 注册：https://planetscale.com

#### 选项 C：阿里云 RDS
- 国内访问快
- 约 30元/月

### 5. 部署

点击 **Deploy**，等待部署完成。

部署后你会得到一个类似 `https://xuexitong-backend.vercel.app` 的地址。

## WebSocket 说明

Vercel Serverless 不支持传统 WebSocket，需要改用：

1. **Vercel Edge Functions** + **Ably/Pusher**（第三方实时服务）
2. **Server-Sent Events (SSE)** 替代 WebSocket
3. **轮询** 方式（简单但不实时）

### 简单的轮询方案

修改前端 `websocket.ts`：

```typescript
// 改为轮询方式
setInterval(() => {
  fetch('/api/student/courses')
    .then(res => res.json())
    .then(data => {
      // 检查是否有新的签到
    })
}, 5000) // 每5秒轮询一次
```

## 前端配置

修改前端 API 地址：

```typescript
// xuexitong/src/utils/api.ts
const API_BASE_URL = 'https://xuexitong-backend.vercel.app'
```

重新构建并部署到 GitHub Pages。

## 自定义域名（可选）

1. 在 Vercel Project Settings → Domains
2. 添加你的域名
3. 按提示配置 DNS

## 注意事项

1. **函数执行时间限制**：
   - Hobby 版：10 秒
   - Pro 版：60 秒
   - 长时间操作需要拆分

2. **冷启动**：
   - 几乎没有冷启动问题
   - 比 Render 响应更快

3. **数据库连接**：
   - 使用连接池
   - 配置 `connectionLimit: 5`（Serverless 建议）

## 完整部署流程

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
vercel --prod
```

## 推荐方案

| 组件 | 推荐服务 | 费用 |
|-----|---------|-----|
| 前端 | GitHub Pages | 免费 |
| 后端 | Vercel | 免费 |
| 数据库 | Railway MySQL | 免费 |
| 总计 | - | **完全免费** |
