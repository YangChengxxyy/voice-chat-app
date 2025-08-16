# Railway 部署指南 - Socket.io 服务器

## 🚂 Railway 部署步骤

### 1. 准备工作

#### 安装 Railway CLI
```bash
# macOS
brew install railway

# Windows (使用 npm)
npm install -g @railway/cli

# 验证安装
railway --version
```

#### 登录 Railway
```bash
railway login
```

### 2. 项目配置

#### 创建 Procfile（可选）
在项目根目录创建 `Procfile`:
```
web: node server.js
```

#### 确保 package.json 配置正确
```json
{
  "scripts": {
    "start": "node server.js",
    "start:server": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3. 部署到 Railway

#### 方法一：通过 CLI 部署
```bash
# 在项目根目录执行
railway login
railway init
railway up
```

#### 方法二：通过 GitHub 连接

1. 将代码推送到 GitHub:
```bash
git add .
git commit -m "Deploy to Railway"
git push origin main
```

2. 在 Railway 控制台:
   - 访问 [railway.app](https://railway.app)
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择您的仓库

### 4. 环境变量配置

在 Railway 项目设置中添加以下环境变量:

```bash
# 必需的环境变量
NODE_ENV=production
PORT=3001

# CORS 配置（替换为您的 Vercel 域名）
CORS_ORIGIN=https://your-app.vercel.app

# 可选配置
ROOM_CLEANUP_INTERVAL=1800000
```

### 5. 域名和网络配置

#### 获取 Railway 服务 URL
部署完成后，Railway 会为您提供一个 URL，类似于:
```
https://your-project-name.railway.app
```

#### 配置自定义域名（可选）
1. 在 Railway 项目设置中点击 "Domains"
2. 添加自定义域名
3. 按照提示配置 DNS 记录

### 6. 监控和日志

#### 查看部署日志
```bash
railway logs
```

#### 监控应用状态
```bash
railway status
```

### 7. 常见问题解决

#### 端口配置问题
确保服务器代码使用环境变量中的端口:
```javascript
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### CORS 错误
确保在服务器中正确配置 CORS:
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: false,
  }
});
```

#### 连接超时
调整 Socket.io 超时设置:
```javascript
const io = new Server(httpServer, {
  pingTimeout: 60000,
  pingInterval: 25000,
  // ... 其他配置
});
```

### 8. 生产环境优化

#### 启用健康检查
在 `server.js` 中添加健康检查端点:
```javascript
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

httpServer.on('request', app);
```

#### 环境变量验证
添加环境变量验证:
```javascript
const requiredEnvVars = ['PORT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}
```

### 9. Railway CLI 常用命令

```bash
# 查看项目列表
railway projects

# 连接到现有项目
railway link

# 查看环境变量
railway variables

# 设置环境变量
railway variables set NODE_ENV=production

# 查看服务状态
railway status

# 重新部署
railway up

# 查看实时日志
railway logs --follow

# 删除项目
railway delete
```

### 10. 成本优化

#### Railway 定价策略
- 免费套餐: 每月 $5 的使用额度
- Pro 套餐: $20/月 起
- 按使用量计费: CPU、内存、网络

#### 优化建议
1. 使用睡眠模式（Hobby 套餐）
2. 设置合理的资源限制
3. 定期清理不用的项目

### 11. 部署验证

部署完成后，验证服务是否正常运行:

```bash
# 检查健康状态
curl https://your-project.railway.app/health

# 测试 Socket.io 连接
# 在浏览器控制台中:
const socket = io('https://your-project.railway.app');
socket.on('connect', () => console.log('Connected!'));
```

### 12. 获取部署 URL

部署成功后，您会得到类似这样的 URL:
```
https://voicechat-mini-production.railway.app
```

将此 URL 配置到您的 Vercel 环境变量中:
```
NEXT_PUBLIC_SERVER_URL=https://voicechat-mini-production.railway.app
```

## 🎯 下一步

完成 Railway 部署后，继续按照 `DEPLOY_VERCEL.md` 部署前端应用。