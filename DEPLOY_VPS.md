# VPS/云服务器部署指南 - 完整单服务器方案

## 🖥️ VPS 部署概览

这种方案将前端和后端部署在同一台服务器上，适合:
- 个人项目或小团队使用
- 预算有限的情况
- 需要完全控制服务器环境
- 学习和测试目的

### 架构图
```
┌─────────────────────────────────────────┐
│               VPS 服务器                 │
│  ┌─────────────────┐  ┌─────────────────┐│
│  │   Next.js App   │  │  Socket.io      ││
│  │   (Frontend)    │  │  Server         ││
│  │   Port 3000     │  │  (Backend)      ││
│  └─────────────────┘  │  Port 3001      ││
│           │            └─────────────────┘│
│  ┌─────────────────┐                     │
│  │     Nginx       │                     │
│  │   (反向代理)      │                     │
│  │   Port 80/443   │                     │
│  └─────────────────┘                     │
└─────────────────────────────────────────┘
```

## 🚀 部署步骤

### 1. 服务器准备

#### 推荐配置
- **CPU**: 1-2 核心
- **内存**: 2GB 以上
- **存储**: 20GB SSD
- **操作系统**: Ubuntu 20.04/22.04 LTS
- **网络**: 至少 1Mbps 上行带宽

#### 推荐服务商
- **阿里云**: ECS 轻量应用服务器
- **腾讯云**: 轻量应用服务器
- **华为云**: 云耀云服务器
- **DigitalOcean**: Droplets
- **Vultr**: Cloud Compute
- **Linode**: Shared CPU

### 2. 服务器初始化

#### 连接服务器
```bash
# 使用 SSH 连接（替换为您的服务器 IP）
ssh root@your-server-ip

# 或使用密钥连接
ssh -i your-key.pem ubuntu@your-server-ip
```

#### 更新系统
```bash
# 更新包列表
apt update

# 升级系统
apt upgrade -y

# 安装基础工具
apt install -y curl wget vim git htop ufw
```

#### 创建部署用户
```bash
# 创建新用户
adduser deploy

# 添加到 sudo 组
usermod -aG sudo deploy

# 切换到新用户
su - deploy
```

### 3. 安装 Node.js

#### 使用 NodeSource 仓库（推荐）
```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 安装 Node.js
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
```

#### 或使用 nvm 安装
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell
source ~/.bashrc

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

### 4. 安装 PM2（进程管理器）

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 --version

# 设置 PM2 开机自启
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
```

### 5. 部署应用代码

#### 克隆代码
```bash
# 进入用户目录
cd ~

# 克隆项目（替换为您的仓库地址）
git clone https://github.com/your-username/chat-mini.git

# 进入项目目录
cd chat-mini
```

#### 安装依赖
```bash
# 安装项目依赖
npm install

# 构建 Next.js 应用
npm run build
```

### 6. 配置环境变量

#### 创建生产环境配置
```bash
# 创建环境变量文件
vim .env.production
```

#### 环境变量内容
```bash
# 生产环境配置
NODE_ENV=production

# Socket.io 服务器配置
PORT=3001
CORS_ORIGIN=https://your-domain.com

# Next.js 配置
NEXT_PUBLIC_SERVER_URL=https://your-domain.com

# WebRTC 配置
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302

# 房间配置
NEXT_PUBLIC_MAX_USERS_PER_ROOM=4
ROOM_CLEANUP_INTERVAL=1800000

# SSL 配置（如果使用）
SSL_CERT_PATH=/etc/ssl/certs/your-domain.crt
SSL_KEY_PATH=/etc/ssl/private/your-domain.key
```

### 7. 配置 PM2

#### 创建 PM2 配置文件
```bash
vim ecosystem.config.js
```

#### PM2 配置内容
```javascript
module.exports = {
  apps: [
    {
      name: 'voicechat-socket',
      script: 'server.js',
      cwd: '/home/deploy/chat-mini',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/deploy/logs/socket-error.log',
      out_file: '/home/deploy/logs/socket-out.log',
      log_file: '/home/deploy/logs/socket-combined.log',
      time: true
    },
    {
      name: 'voicechat-web',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/chat-mini',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/deploy/logs/web-error.log',
      out_file: '/home/deploy/logs/web-out.log',
      log_file: '/home/deploy/logs/web-combined.log',
      time: true
    }
  ]
};
```

#### 创建日志目录
```bash
mkdir -p ~/logs
```

#### 启动应用
```bash
# 启动所有应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 保存 PM2 配置
pm2 save
```

### 8. 安装和配置 Nginx

#### 安装 Nginx
```bash
sudo apt install -y nginx

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### 配置 Nginx
```bash
# 创建站点配置
sudo vim /etc/nginx/sites-available/voicechat
```

#### Nginx 配置内容
```nginx
# HTTP 配置（稍后可升级为 HTTPS）
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 客户端最大上传大小
    client_max_body_size 10M;

    # 主应用代理（Next.js）
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Socket.io 代理
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # 安全头部
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

#### 启用站点
```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/voicechat /etc/nginx/sites-enabled/

# 删除默认站点
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

### 9. 配置域名和 DNS

#### 域名解析设置
在您的域名提供商控制台中添加 A 记录:
```
类型: A
主机记录: @
记录值: your-server-ip
TTL: 600

类型: A
主机记录: www
记录值: your-server-ip
TTL: 600
```

#### 验证域名解析
```bash
# 检查域名解析
nslookup your-domain.com
dig your-domain.com
```

### 10. 配置 SSL/HTTPS（推荐）

#### 安装 Certbot
```bash
# 安装 snapd
sudo apt install snapd

# 安装 certbot
sudo snap install --classic certbot

# 创建链接
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

#### 获取 SSL 证书
```bash
# 获取证书并自动配置 Nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

#### 更新后的 Nginx 配置
Certbot 会自动修改 Nginx 配置，添加 HTTPS 重定向和 SSL 设置。

### 11. 配置防火墙

#### 使用 UFW 配置防火墙
```bash
# 启用 UFW
sudo ufw enable

# 允许 SSH
sudo ufw allow ssh

# 允许 HTTP 和 HTTPS
sudo ufw allow 'Nginx Full'

# 查看状态
sudo ufw status
```

### 12. 监控和日志管理

#### 设置日志轮转
```bash
# 创建日志轮转配置
sudo vim /etc/logrotate.d/voicechat
```

#### 日志轮转配置
```bash
/home/deploy/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reload all
    endscript
}
```

#### 设置系统监控
```bash
# 安装 htop 和 iotop
sudo apt install -y htop iotop

# 监控 PM2 进程
pm2 monit

# 查看系统资源
htop
```

### 13. 备份策略

#### 创建备份脚本
```bash
# 创建备份目录
mkdir -p ~/backups

# 创建备份脚本
vim ~/backup.sh
```

#### 备份脚本内容
```bash
#!/bin/bash

BACKUP_DIR="/home/deploy/backups"
PROJECT_DIR="/home/deploy/chat-mini"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建项目备份
tar -czf "$BACKUP_DIR/chat-mini_$DATE.tar.gz" -C /home/deploy chat-mini

# 备份 Nginx 配置
sudo cp /etc/nginx/sites-available/voicechat "$BACKUP_DIR/nginx_$DATE.conf"

# 删除30天前的备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "nginx_*.conf" -mtime +30 -delete

echo "Backup completed: $DATE"
```

#### 设置定时备份
```bash
# 设置执行权限
chmod +x ~/backup.sh

# 添加到 crontab
crontab -e

# 添加以下行（每天凌晨2点执行备份）
0 2 * * * /home/deploy/backup.sh >> /home/deploy/logs/backup.log 2>&1
```

### 14. 性能优化

#### Node.js 性能调优
```bash
# 在 ecosystem.config.js 中添加 Node.js 优化参数
node_args: [
  '--max-old-space-size=1024',
  '--optimize-for-size'
]
```

#### Nginx 性能优化
```bash
# 编辑 Nginx 主配置
sudo vim /etc/nginx/nginx.conf
```

```nginx
# 在 http 块中添加
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;

# 客户端缓冲区
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
```

### 15. 安全加固

#### 更新系统安全设置
```bash
# 禁用 root SSH 登录
sudo vim /etc/ssh/sshd_config

# 修改以下设置
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes

# 重启 SSH 服务
sudo systemctl restart ssh
```

#### 安装 Fail2ban
```bash
# 安装 Fail2ban
sudo apt install -y fail2ban

# 创建本地配置
sudo vim /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
logpath = /var/log/nginx/error.log
```

#### 启动 Fail2ban
```bash
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 16. 更新部署流程

#### 创建更新脚本
```bash
vim ~/update.sh
```

```bash
#!/bin/bash

PROJECT_DIR="/home/deploy/chat-mini"
cd "$PROJECT_DIR"

echo "开始更新应用..."

# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 构建应用
npm run build

# 重启应用
pm2 restart all

echo "应用更新完成!"
```

```bash
# 设置执行权限
chmod +x ~/update.sh
```

### 17. 常用运维命令

#### PM2 管理命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs
pm2 logs voicechat-web
pm2 logs voicechat-socket

# 重启应用
pm2 restart all
pm2 restart voicechat-web

# 停止应用
pm2 stop all

# 删除应用
pm2 delete all

# 监控资源使用
pm2 monit
```

#### Nginx 管理命令
```bash
# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx

# 重启 Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看访问日志
sudo tail -f /var/log/nginx/access.log

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 系统监控命令
```bash
# 查看系统资源
htop
top

# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看网络连接
netstat -tulnp

# 查看端口监听
ss -tulnp
```

### 18. 故障排除

#### 常见问题和解决方案

**应用无法启动**
```bash
# 检查日志
pm2 logs
cat /home/deploy/logs/socket-error.log

# 检查端口占用
sudo netstat -tulnp | grep :3000
sudo netstat -tulnp | grep :3001

# 检查 Node.js 进程
ps aux | grep node
```

**Nginx 502 错误**
```bash
# 检查上游服务是否运行
curl http://localhost:3000
curl http://localhost:3001

# 检查 Nginx 错误日志
sudo tail -f /var/log/nginx/error.log

# 检查 SELinux（如果启用）
sudo setsebool -P httpd_can_network_connect 1
```

**SSL 证书问题**
```bash
# 检查证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 测试 SSL 配置
openssl s_client -connect your-domain.com:443
```

### 19. 成本估算

#### 服务器成本（月费用）
- **阿里云轻量服务器**: ¥24-108/月
- **腾讯云轻量服务器**: ¥25-120/月
- **DigitalOcean Droplet**: $6-24/月
- **Vultr VPS**: $6-24/月

#### 域名成本（年费用）
- **.com 域名**: ¥55-120/年
- **.cn 域名**: ¥35-80/年

#### 总计成本
**最低配置**: 约 ¥50-150/月（含域名）

### 20. 部署验证清单

完成部署后，请验证以下功能：

- [ ] 域名访问正常
- [ ] HTTPS 证书有效
- [ ] 首页加载正常
- [ ] 创建房间功能
- [ ] 加入房间功能
- [ ] Socket.io 连接正常
- [ ] 语音通话功能
- [ ] 移动端兼容性
- [ ] PM2 进程管理
- [ ] Nginx 反向代理
- [ ] 日志记录正常
- [ ] 防火墙配置
- [ ] 备份机制
- [ ] SSL 自动续期

## 🎯 总结

VPS 部署虽然需要更多的配置工作，但提供了完全的控制权和成本优势。适合：

**优势**:
- 完全控制服务器环境
- 成本相对较低
- 学习服务器运维知识
- 数据完全自主控制

**劣势**:
- 需要运维知识
- 安全责任自负
- 扩展性有限
- 需要监控和维护

选择这种部署方式需要具备一定的 Linux 运维经验，但对于学习和个人项目来说是很好的选择。