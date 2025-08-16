# Vercel 部署指南 - Next.js 前端应用

## 🌐 Vercel 部署步骤

### 1. 准备工作

#### 安装 Vercel CLI
```bash
# 使用 npm 安装
npm install -g vercel

# 验证安装
vercel --version
```

#### 登录 Vercel
```bash
vercel login
```

### 2. 项目配置检查

#### 确保 package.json 配置正确
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

#### 检查 Next.js 配置
确保 `next.config.js` 配置正确:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      fs: false,
    };
    return config;
  },
  // 确保支持客户端渲染
  experimental: {
    esmExternals: false,
  },
};

module.exports = nextConfig;
```

### 3. 部署到 Vercel

#### 方法一：通过 CLI 部署
```bash
# 在项目根目录执行
vercel

# 首次部署时会询问项目配置
# 选择默认设置即可
```

#### 方法二：通过 GitHub 连接（推荐）

1. 将代码推送到 GitHub:
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. 在 Vercel 控制台:
   - 访问 [vercel.com](https://vercel.com)
   - 点击 "New Project"
   - 从 GitHub 导入仓库
   - 选择您的项目仓库

### 4. 环境变量配置

在 Vercel 项目设置中添加以下环境变量:

#### 必需的环境变量
```bash
# Socket.io 服务器地址（来自 Railway 部署）
NEXT_PUBLIC_SERVER_URL=https://your-socket-server.railway.app

# 环境标识
NODE_ENV=production
```

#### 可选的环境变量
```bash
# WebRTC 配置
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302

# TURN 服务器配置（如果有）
NEXT_PUBLIC_TURN_SERVERS=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME=your-username
NEXT_PUBLIC_TURN_PASSWORD=your-password

# 房间配置
NEXT_PUBLIC_MAX_USERS_PER_ROOM=4

# 调试模式
NEXT_PUBLIC_DEBUG=false
```

### 5. 域名配置

#### 获取 Vercel 域名
部署完成后，Vercel 会为您提供域名，类似于:
```
https://your-app-name.vercel.app
```

#### 配置自定义域名（可选）
1. 在 Vercel 项目设置中点击 "Domains"
2. 添加自定义域名
3. 按照提示配置 DNS 记录:
   ```
   Type: CNAME
   Name: your-subdomain
   Value: cname.vercel-dns.com
   ```

### 6. 构建优化

#### 分析包大小
```bash
# 安装分析工具
npm install --save-dev @next/bundle-analyzer

# 分析构建
npm run build
npm run analyze
```

#### 优化 Next.js 配置
在 `next.config.js` 中添加优化设置:
```javascript
const nextConfig = {
  // 启用压缩
  compress: true,
  
  // 优化图片
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  
  // 实验性功能
  experimental: {
    optimizeCss: true,
  },
  
  // 头部优化
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};
```

### 7. 更新 Railway CORS 配置

部署完成后，需要更新 Railway 上的 Socket.io 服务器 CORS 配置:

```bash
# 在 Railway 环境变量中更新
CORS_ORIGIN=https://your-app-name.vercel.app
```

或在代码中使用多个域名:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-app-name.vercel.app',
  'https://your-custom-domain.com'
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: false,
  }
});
```

### 8. 监控和分析

#### 配置 Vercel Analytics
在项目设置中启用:
- Web Analytics
- Speed Insights
- Audience Insights

#### 查看部署日志
```bash
# 查看构建日志
vercel logs

# 查看运行时日志
vercel logs --follow
```

### 9. 常见问题解决

#### 构建失败
```bash
# 检查 Node.js 版本
node --version

# 清理缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

#### Socket.io 连接失败
检查环境变量配置:
```javascript
// 在客户端代码中添加调试信息
console.log('Server URL:', process.env.NEXT_PUBLIC_SERVER_URL);
```

#### CORS 错误
确保 Railway 服务器的 CORS 配置包含 Vercel 域名

#### 404 错误
检查 Next.js 路由配置和 `vercel.json` 重写规则

### 10. 性能优化

#### 启用 CDN 缓存
Vercel 自动提供全球 CDN，但您可以优化缓存策略:
```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

#### 预渲染优化
```javascript
// 对于静态页面，启用 ISG
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 60, // 60秒重新验证
  };
}
```

### 11. Vercel CLI 常用命令

```bash
# 部署到生产环境
vercel --prod

# 部署到预览环境
vercel

# 查看项目列表
vercel projects

# 查看部署历史
vercel deployments

# 查看域名
vercel domains

# 查看环境变量
vercel env

# 设置环境变量
vercel env add NEXT_PUBLIC_SERVER_URL

# 删除项目
vercel remove
```

### 12. 环境管理

#### 多环境配置
Vercel 支持三种环境:
- Development (localhost)
- Preview (分支部署)
- Production (主分支)

为每个环境配置相应的环境变量。

### 13. 成本优化

#### Vercel 定价策略
- Hobby 套餐: 免费，有使用限制
- Pro 套餐: $20/月/用户
- Enterprise: 企业定制

#### 优化建议
1. 优化包大小减少构建时间
2. 使用适当的缓存策略
3. 监控使用量避免超额

### 14. 部署验证

部署完成后进行全面测试:

#### 功能测试清单
- [ ] 首页加载正常
- [ ] 创建房间功能
- [ ] 加入房间功能
- [ ] Socket.io 连接正常
- [ ] 音频权限请求
- [ ] 语音通话功能
- [ ] 移动端响应式
- [ ] 错误处理

#### 性能测试
```bash
# 使用 Lighthouse 测试
npx lighthouse https://your-app-name.vercel.app --output html

# 检查 Core Web Vitals
# 在 Vercel Analytics 中查看
```

### 15. 持续集成

#### 自动部署配置
Vercel 会自动部署以下情况:
- 推送到主分支 → 生产环境
- 推送到其他分支 → 预览环境
- Pull Request → 预览环境

#### 部署钩子
```javascript
// vercel.json
{
  "functions": {
    "app/api/deploy-hook.js": {
      "maxDuration": 10
    }
  }
}
```

### 16. 安全配置

#### 安全头部
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
];
```

## 🎯 部署完成检查清单

- [ ] Vercel 部署成功
- [ ] 环境变量配置正确
- [ ] Socket.io 连接正常
- [ ] Railway CORS 更新
- [ ] 自定义域名配置（如需要）
- [ ] 性能优化完成
- [ ] 安全配置就绪
- [ ] 监控和分析启用

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Socket.io 客户端文档](https://socket.io/docs/v4/client-api/)

完成 Vercel 部署后，您的语音聊天应用就可以在生产环境中使用了！