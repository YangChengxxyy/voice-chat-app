# Docker Compose 兼容性指南

## 📋 概述

VoiceChat Mini 现在完全支持新旧两种 Docker Compose 命令格式，确保在不同 Docker 版本下都能正常部署。

## 🔧 Docker Compose 版本差异

### 命令格式对比

| 版本类型 | 命令格式 | 安装方式 | 推荐程度 |
|---------|----------|----------|----------|
| **新版本** | `docker compose` | Docker Desktop 内置 | ⭐⭐⭐⭐⭐ 强烈推荐 |
| **旧版本** | `docker-compose` | 独立安装 | ⭐⭐⭐ 兼容支持 |

### 版本检测

使用以下命令检查您的 Docker Compose 版本：

```bash
# 检查新版本命令
docker compose version

# 检查旧版本命令
docker-compose version
```

## 🚀 部署解决方案

### 方案1: 自动检测部署（推荐）

我们提供了智能部署脚本，自动检测并使用正确的命令：

```bash
# 运行兼容性检查
./check-docker.sh

# 使用通用部署脚本（自动适配）
./universal-deploy.sh
```

### 方案2: 传统部署脚本

已更新的传统脚本也支持自动检测：

```bash
# 部署服务
./deploy.sh

# 停止服务
./stop.sh
```

### 方案3: 手动选择命令

根据您的环境手动选择相应命令：

**新版本 Docker Desktop (推荐):**
```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

**旧版本独立安装:**
```bash
docker-compose build
docker-compose up -d
docker-compose ps
docker-compose logs -f
docker-compose down
```

## 🛠️ 兼容性功能

### 自动检测机制

所有脚本都包含以下检测逻辑：

```bash
# 自动检测 Docker Compose 命令
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    echo "✅ 使用新版本命令"
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    echo "✅ 使用旧版本命令"
else
    echo "❌ 未找到 Docker Compose"
    exit 1
fi
```

### 提供的工具

1. **check-docker.sh** - Docker 环境检测工具
2. **universal-deploy.sh** - 通用部署脚本
3. **deploy.sh** - 传统部署脚本（已更新）
4. **stop.sh** - 停止脚本（已更新）
5. **health-check.sh** - 健康检查工具

## 📚 使用示例

### 完整部署流程

```bash
# 1. 检查环境
./check-docker.sh

# 2. 设置代理（如需要）
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7890

# 3. 部署服务
./universal-deploy.sh

# 4. 验证部署
./health-check.sh

# 5. 查看状态
docker compose ps    # 或 docker-compose ps

# 6. 停止服务
./stop.sh
```

### 故障排除

如果遇到命令不存在的错误：

**错误**: `docker-compose: command not found`
**解决方案**:
```bash
# 检查是否支持新版本命令
docker compose version

# 如果支持，使用新版本命令
docker compose up -d

# 或使用自动检测脚本
./universal-deploy.sh
```

**错误**: `docker compose: 'compose' is not a docker command`
**解决方案**:
```bash
# 安装独立的 docker-compose
pip install docker-compose

# 或升级 Docker Desktop 到最新版本
```

## 🎯 部署状态确认

### 成功部署标志

部署成功后，您应该看到：

```bash
$ ./health-check.sh --quick
🚀 快速健康检查...
检查 Socket.io 健康检查 ... ✅ 正常
检查 Next.js 应用 ... ✅ 正常
✅ 快速检查通过
```

### 服务访问地址

- **Web 应用**: http://localhost:3000
- **Socket.io 服务**: http://localhost:3001
- **健康检查**: http://localhost:3001/health

### 容器状态检查

```bash
# 检查容器状态（自动适配命令）
docker compose ps

# 预期输出
NAME               STATUS
voicechat-socket   Up X minutes
voicechat-web      Up X minutes
```

## 🔧 配置说明

### docker-compose.yml 兼容性

我们的 `docker-compose.yml` 文件兼容两种命令格式：

- 移除了过时的 `version` 字段警告（通过注释处理）
- 优化了健康检查配置
- 支持多阶段构建

### 环境变量

部署脚本自动设置必要的环境变量：

```bash
# 代理设置
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7890

# Docker Compose 命令
export COMPOSE_CMD="docker compose"  # 或 "docker-compose"
```

## 📝 总结

✅ **已解决的问题**:
- Docker Compose 命令兼容性
- 自动版本检测
- 统一的部署体验
- 完整的错误处理

✅ **提供的功能**:
- 自动检测 Docker Compose 版本
- 智能命令选择
- 完整的部署和管理工具
- 详细的健康检查

✅ **支持的环境**:
- Docker Desktop (新版本 `docker compose`)
- 独立安装的 docker-compose
- macOS、Linux、Windows (WSL)
- 代理网络环境

现在您可以在任何支持 Docker 的环境中轻松部署 VoiceChat Mini，无需担心命令兼容性问题！

---
**最后更新**: 2025-08-17  
**兼容性**: Docker Compose v1.x + v2.x  
**状态**: ✅ 生产就绪