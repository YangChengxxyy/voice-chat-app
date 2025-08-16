# Docker 容器化部署指南 - 完整容器化方案

## 🐳 Docker 部署概览

Docker 容器化部署提供了一致的运行环境，简化了部署和扩展过程。这种方案适合：
- 开发环境与生产环境一致性要求高
- 需要快速部署和扩展
- 微服务架构
- CI/CD 自动化部署
- 多环境管理（开发、测试、生产）

### 架构图
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────── │
│  │   Next.js       │  │   Socket.io     │  │     Nginx     ││
│  │  Container      │  │   Container     │  │   Container   ││
│  │   Port 3000     │  │   Port 3001     │  │  Port 80/443  ││
│  └─────────────────┘  └─────────────────┘  └─────────────── │
│           │                     │                    │      │
│  ┌─────────────────────────────────────────────────────────│
│  │              Docker Bridge Network                      ││
│  └─────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
```

## 🚀 快速开始

### 1. 前置要求

#### 安装 Docker 和 Docker Compose

**Linux (Ubuntu/Debian):**
```bash
# 更新包索引
sudo apt update

# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组
sudo usermod -aG docker $USER
```

**macOS:**
```bash
# 使用 Homebrew 安装
brew install --cask docker

# 或下载 Docker Desktop
# https://www.docker.com/products/docker-desktop
```

**Windows:**
```bash
# 下载并安装 Docker Desktop
# https://www.docker.com/products/docker-desktop

# 确保启用 WSL 2
```

#### 验证安装
```bash
# 检查 Docker 版本
docker --version
docker compose version

# 测试 Docker
docker run hello-world
```

### 2. 项目准备

#### 克隆项目
```bash
git clone https://github.com/your-username/chat-mini.git
cd chat-mini
```

#### 创建环境变量文件
```bash
# 复制环境变量模板
cp .env.template .env.docker

# 编辑环境变量
vim .env.docker
```

#### 环境变量配置
```bash
# Docker 生产环境配置
NODE_ENV=production

# Socket.io 服务器配置
PORT=3001
CORS_ORIGIN=http://localhost:3000,https://your-domain.com

# Next.js 配置
NEXT_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302
NEXT_PUBLIC_MAX_USERS_PER_ROOM=4
NEXT_PUBLIC_DEBUG=false

# 容器配置
COMPOSE_PROJECT_NAME=voicechat-mini
COMPOSE_FILE=docker-compose.yml
```

### 3. 基础部署

#### 构建和启动服务
```bash
# 构建镜像
docker compose build

# 启动服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

#### 验证部署
```bash
# 检查容器状态
docker compose ps

# 测试服务
curl http://localhost:3000
curl http://localhost:3001/health

# 查看容器日志
docker compose logs web-app
docker compose logs socket-server
```

## 📝 详细配置

### 4. Dockerfile 解析

#### 多阶段构建优势
- **减小镜像大小**: 只包含运行时必需的文件
- **安全性**: 移除构建工具和源代码
- **缓存优化**: 分层构建提高构建速度
- **环境隔离**: 开发和生产环境分离

#### 构建阶段说明
```dockerfile
# 基础阶段 - 安装生产依赖
FROM node:18-alpine AS base
# 优点：Alpine Linux 体积小，安全性高

# 构建阶段 - 编译应用
FROM node:18-alpine AS builder
# 包含完整的构建工具链

# 生产阶段 - Next.js 应用
FROM node:18-alpine AS nextjs
# 只包含运行时必需的文件

# 生产阶段 - Socket.io 服务器
FROM node:18-alpine AS socketio
# 独立的服务器容器
```

### 5. Docker Compose 配置

#### 基础服务配置
```yaml
# Socket.io 服务器
socket-server:
  # 健康检查确保服务可用
  healthcheck:
    test: ["CMD", "node", "-e", "...健康检查代码..."]
    interval: 30s
    timeout: 10s
    retries: 3

# Next.js 应用
web-app:
  # 依赖于 Socket.io 服务器
  depends_on:
    socket-server:
      condition: service_healthy
```

#### 网络配置
```yaml
networks:
  voicechat-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### 6. 生产环境部署

#### 使用 Nginx 反向代理
```bash
# 创建 Nginx 配置
mkdir -p nginx
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server web-app:3000;
    }

    upstream socketio {
        server socket-server:3001;
    }

    server {
        listen 80;
        server_name your-domain.com;

        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /socket.io/ {
            proxy_pass http://socketio;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 启动包含 Nginx 的服务
docker compose --profile with-nginx up -d
```

#### SSL/HTTPS 配置
```bash
# 创建 SSL 目录
mkdir -p ssl

# 使用 Let's Encrypt 获取证书（在宿主机上执行）
sudo certbot certonly --standalone -d your-domain.com

# 复制证书到 SSL 目录
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/

# 更新 Nginx 配置支持 HTTPS
cat >> nginx/nginx.conf << 'EOF'
    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL 配置
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 其他配置同 HTTP...
    }

    # HTTP 重定向到 HTTPS
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }
EOF
```

### 7. 扩展性配置

#### Redis 集群支持
```bash
# 创建 Redis 配置
cat > redis.conf << 'EOF'
# Redis 配置
port 6379
bind 0.0.0.0
protected-mode no

# 持久化
save 900 1
save 300 10
save 60 10000

# 日志
loglevel notice
logfile ""

# 内存管理
maxmemory 256mb
maxmemory-policy allkeys-lru
EOF

# 启动 Redis 服务
docker compose --profile with-redis up -d
```

#### 多实例部署
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  socket-server:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379

  web-app:
    deploy:
      replicas: 2

  nginx:
    depends_on:
      - web-app
      - socket-server
```

```bash
# 启动多实例部署
docker compose -f docker-compose.yml -f docker-compose.scale.yml up -d --scale socket-server=3 --scale web-app=2
```

### 8. 监控和日志

#### 启动监控服务
```bash
# 创建 Prometheus 配置
mkdir -p monitoring
cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'voicechat-web'
    static_configs:
      - targets: ['web-app:3000']

  - job_name: 'voicechat-socket'
    static_configs:
      - targets: ['socket-server:3001']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
EOF

# 启动监控服务
docker compose --profile monitoring up -d

# 访问监控界面
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3002 (admin/admin123)
```

#### 日志管理
```bash
# 查看所有服务日志
docker compose logs

# 查看特定服务日志
docker compose logs -f web-app
docker compose logs -f socket-server

# 导出日志
docker compose logs --no-color > voicechat-logs.txt

# 清理日志
docker compose logs --tail=0 -f
```

### 9. 开发环境配置

#### 开发模式启动
```bash
# 创建开发环境配置
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  web-app-dev:
    build:
      context: .
      dockerfile: Dockerfile
      target: development
    ports:
      - "3000:3000"
      - "3001:3001"
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_DEBUG=true
      - NEXT_PUBLIC_SERVER_URL=http://localhost:3001
    networks:
      - voicechat-network

networks:
  voicechat-network:
    driver: bridge
EOF

# 启动开发环境
docker compose -f docker-compose.dev.yml up
```

#### 热重载配置
```dockerfile
# 开发环境 Dockerfile 片段
FROM node:18-alpine AS development

# 安装 nodemon 用于热重载
RUN npm install -g nodemon

# 开发启动命令
CMD ["sh", "-c", "nodemon server.js & npm run dev"]
```

### 10. 部署脚本

#### 创建部署脚本
```bash
# 创建部署脚本
cat > deploy.sh << 'EOF'
#!/bin/bash

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 环境
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi

    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi

    log_info "Docker 环境检查通过"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    docker compose build --no-cache
    log_info "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    docker compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    if docker compose ps | grep -q "Up"; then
        log_info "服务启动成功"
    else
        log_error "服务启动失败"
        docker compose logs
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    # 检查 Web 应用
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "Web 应用健康检查通过"
    else
        log_error "Web 应用健康检查失败"
        exit 1
    fi
    
    # 检查 Socket.io 服务器
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "Socket.io 服务器健康检查通过"
    else
        log_error "Socket.io 服务器健康检查失败"
        exit 1
    fi
}

# 主函数
main() {
    log_info "开始部署 VoiceChat Mini..."
    
    check_docker
    build_images
    start_services
    health_check
    
    log_info "部署完成！"
    echo ""
    echo "访问地址："
    echo "  - Web 应用: http://localhost:3000"
    echo "  - Socket.io: http://localhost:3001"
    echo ""
    echo "管理命令："
    echo "  - 查看状态: docker compose ps"
    echo "  - 查看日志: docker compose logs -f"
    echo "  - 停止服务: docker compose down"
}

main "$@"
EOF

chmod +x deploy.sh
```

#### 创建更新脚本
```bash
cat > update.sh << 'EOF'
#!/bin/bash

set -e

echo "开始更新应用..."

# 拉取最新代码
git pull origin main

# 重新构建镜像
docker compose build --no-cache

# 滚动更新服务
docker compose up -d --force-recreate

# 清理旧镜像
docker image prune -f

echo "更新完成！"
EOF

chmod +x update.sh
```

### 11. 常用运维命令

#### Docker Compose 管理
```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看服务状态
docker compose ps

# 查看服务日志
docker compose logs -f [service-name]

# 进入容器
docker compose exec web-app sh
docker compose exec socket-server sh

# 扩展服务实例
docker compose up -d --scale socket-server=3

# 更新服务
docker compose up -d --force-recreate [service-name]
```

#### 容器管理
```bash
# 查看所有容器
docker ps -a

# 查看容器资源使用
docker stats

# 清理停止的容器
docker container prune

# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 完整清理
docker system prune -a --volumes
```

#### 镜像管理
```bash
# 查看镜像
docker images

# 构建镜像
docker build -t voicechat-mini:latest .

# 推送镜像到仓库
docker tag voicechat-mini:latest your-registry/voicechat-mini:latest
docker push your-registry/voicechat-mini:latest

# 从仓库拉取镜像
docker pull your-registry/voicechat-mini:latest
```

### 12. 故障排除

#### 常见问题解决

**容器启动失败**
```bash
# 查看容器日志
docker compose logs [service-name]

# 查看容器详细信息
docker inspect [container-name]

# 检查容器资源限制
docker stats
```

**网络连接问题**
```bash
# 查看网络配置
docker network ls
docker network inspect voicechat-mini_voicechat-network

# 测试容器间连通性
docker compose exec web-app ping socket-server
docker compose exec socket-server ping web-app
```

**端口冲突**
```bash
# 查看端口占用
netstat -tulnp | grep :3000
netstat -tulnp | grep :3001

# 修改端口映射
# 在 docker-compose.yml 中修改 ports 配置
```

**存储空间不足**
```bash
# 查看 Docker 存储使用
docker system df

# 清理存储空间
docker system prune -a --volumes

# 查看容器存储使用
docker exec [container-name] df -h
```

#### 调试模式
```bash
# 启用调试模式
export COMPOSE_LOG_LEVEL=DEBUG
docker compose --verbose up

# 容器调试
docker compose run --rm web-app sh
docker compose run --rm socket-server sh
```

### 13. 安全配置

#### 容器安全加固
```dockerfile
# 使用非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# 只读根文件系统
version: '3.8'
services:
  web-app:
    read_only: true
    tmpfs:
      - /tmp
      - /var/cache
```

#### 网络安全
```yaml
# 限制网络访问
version: '3.8'
services:
  socket-server:
    networks:
      - backend
  web-app:
    networks:
      - frontend
      - backend
  nginx:
    networks:
      - frontend

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true
```

#### 秘钥管理
```bash
# 使用 Docker Secrets
echo "your-secret-key" | docker secret create jwt-secret -

# 在服务中使用
version: '3.8'
services:
  web-app:
    secrets:
      - jwt-secret
secrets:
  jwt-secret:
    external: true
```

### 14. 性能优化

#### 镜像优化
```dockerfile
# 多阶段构建减小镜像大小
# 使用 .dockerignore 排除不必要文件
# 合并 RUN 指令减少层数

# .dockerignore 示例
node_modules
.git
.env*
README.md
Dockerfile
docker-compose.yml
```

#### 资源限制
```yaml
version: '3.8'
services:
  web-app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

#### 缓存优化
```bash
# 启用 BuildKit 构建缓存
export DOCKER_BUILDKIT=1
docker compose build

# 使用缓存挂载
# syntax=docker/dockerfile:1
FROM node:18-alpine
RUN --mount=type=cache,target=/usr/local/share/.cache/npm \
    npm install
```

### 15. 备份和恢复

#### 数据备份
```bash
# 备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份容器数据
docker run --rm -v voicechat-mini_prometheus-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/prometheus-data_$DATE.tar.gz -C /data .

docker run --rm -v voicechat-mini_grafana-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/grafana-data_$DATE.tar.gz -C /data .

# 备份配置文件
tar czf $BACKUP_DIR/configs_$DATE.tar.gz docker-compose.yml .env.docker nginx/

echo "备份完成: $DATE"
EOF

chmod +x backup.sh
```

#### 恢复数据
```bash
# 恢复脚本
cat > restore.sh << 'EOF'
#!/bin/bash

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "使用方法: $0 <backup-file>"
    exit 1
fi

# 停止服务
docker compose down

# 恢复数据
docker run --rm -v voicechat-mini_prometheus-data:/data -v $(pwd):/backup alpine tar xzf /backup/$BACKUP_FILE -C /data

# 启动服务
docker compose up -d

echo "恢复完成"
EOF

chmod +x restore.sh
```

### 16. CI/CD 集成

#### GitHub Actions 示例
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: your-username/voicechat-mini:latest
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /path/to/voicechat-mini
          docker compose pull
          docker compose up -d --force-recreate
```

### 17. 成本优化

#### 资源使用优化
```yaml
# 使用轻量级基础镜像
FROM node:18-alpine  # ~50MB vs node:18 ~300MB

# 多服务共享网络
# 减少不必要的端口暴露
# 使用健康检查避免资源浪费
```

#### 部署策略
```bash
# 开发环境：单容器部署
# 测试环境：基础多容器部署
# 生产环境：完整监控和负载均衡

# 根据负载动态扩展
docker compose up -d --scale socket-server=3
```

## 🎯 部署选择建议

### 何时使用 Docker 部署

**适合场景：**
- 多环境一致性要求高
- 需要快速扩展
- 微服务架构
- 团队协作开发
- CI/CD 自动化

**不适合场景：**
- 资源极度受限
- 简单的单体应用
- 学习成本敏感
- 传统运维团队

### 与其他方案对比

| 特性 | Docker | VPS 直装 | Serverless |
|------|--------|----------|------------|
| 部署复杂度 | 中等 | 高 | 低 |
| 运维成本 | 中等 | 高 | 低 |
| 扩展性 | 好 | 有限 | 极好 |
| 成本 | 中等 | 低 | 按使用量 |
| 学习曲线 | 中等 | 陡峭 | 平缓 |

## 📋 部署检查清单

- [ ] Docker 环境准备完成
- [ ] 项目代码构建成功
- [ ] 环境变量配置正确
- [ ] 容器网络连通正常
- [ ] 健康检查通过
- [ ] 日志输出正常
- [ ] 监控服务运行
- [ ] 备份策略就绪
- [ ] 安全配置完成
- [ ] 性能测试通过

## 🔗 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 参考](https://docs.docker.com/compose/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Docker 最佳实践](https://nodejs.org/en/docs/guides/nodejs-docker-webapp)

Docker 容器化部署为您提供了强大的部署灵活性和环境一致性，是现代应用部署的推荐方案！