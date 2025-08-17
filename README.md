# VoiceChat Mini - 实时语音聊天系统

基于 Next.js + WebRTC + Socket.io 构建的4人语音聊天应用。

## ✨ 特性

- 🎙️ **实时语音通话** - WebRTC技术，支持回声消除
- 👥 **多人同时在线** - 最多4人同时语音聊天
- 🚀 **即时连接** - 无需注册，快速创建或加入房间
- 📱 **响应式设计** - 支持桌面端和移动端
- ⌨️ **快捷键支持** - 空格键切换静音

## 🛠️ 技术栈

- **Next.js 14** - React框架
- **TypeScript** - 类型安全
- **Socket.io** - 实时通信
- **WebRTC** - 音频传输
- **Tailwind CSS** - 样式框架

## 📋 系统要求

- Node.js 18+
- 现代浏览器
- 麦克风权限

## 🚀 快速开始

### 方法1: Docker 部署（推荐）

**检查 Docker Compose 版本兼容性:**
```bash
./check-docker.sh
```

**通用部署脚本（自动适配 docker compose 版本）:**
```bash
./universal-deploy.sh
```

**传统部署脚本:**
```bash
./deploy.sh
```

**停止服务:**
```bash
./stop.sh
```

**清理重新部署:**
```bash
./universal-deploy.sh --clean
```

访问应用：http://localhost:3000

**注意**: 新版本 Docker 使用 `docker compose`，旧版本使用 `docker-compose`。脚本会自动检测并适配。

### 方法2: 一键启动

**Linux/macOS:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

### 方法3: 手动启动

1. 安装依赖：
```bash
npm install
```

2. 启动Socket.io服务器：
```bash
npm run server
```

3. 启动Next.js服务器：
```bash
npm run dev
```

4. 访问应用：http://localhost:3000

### 测试连接

访问测试页面检查Socket.io连接状态：
http://localhost:3000/test

## 🐳 Docker 部署

### 系统要求

- Docker Desktop 或 Docker Engine
- Docker Compose (新版本使用 `docker compose`，旧版本使用 `docker-compose`)
- 代理配置（如果在国内网络环境）

### Docker Compose 版本兼容性

本项目支持两种 Docker Compose 命令：

| 版本类型 | 命令 | 说明 |
|---------|------|------|
| **新版本** | `docker compose` | Docker Desktop 内置，推荐使用 |
| **旧版本** | `docker-compose` | 独立安装的工具 |

**自动检测命令:**
```bash
./check-docker.sh
```

### 部署方式

#### 方式1: 通用部署（推荐）
自动检测 Docker Compose 版本并部署：
```bash
# 标准部署
./universal-deploy.sh

# 清理后部署
./universal-deploy.sh --clean

# 不使用代理部署
./universal-deploy.sh --no-proxy
```

#### 方式2: 传统部署
使用预配置的部署脚本：
```bash
./deploy.sh
```

#### 方式3: 手动部署
根据您的 Docker Compose 版本选择命令：

**新版本 Docker (docker compose):**
```bash
docker compose build
docker compose up -d
```

**旧版本 Docker (docker-compose):**
```bash
docker-compose build
docker-compose up -d
```

### 管理命令

**停止服务:**
```bash
./stop.sh
```

**查看状态:**
```bash
# 自动适配版本
./universal-deploy.sh --help

# 或手动使用对应命令
docker compose ps    # 新版本
docker-compose ps    # 旧版本
```

**查看日志:**
```bash
docker compose logs -f    # 新版本
docker-compose logs -f    # 旧版本
```

### 服务信息

- **Web 应用端口**: 3000
- **Socket.io 服务端口**: 3001
- **健康检查**: http://localhost:3001/health

### 故障排除

**如果遇到 "docker-compose: command not found" 错误:**
1. 检查您使用的是新版本 Docker，应该使用 `docker compose`
2. 或安装独立的 `docker-compose` 工具
3. 使用 `./check-docker.sh` 检测当前环境
4. 使用 `./universal-deploy.sh` 自动适配版本

## 🎮 使用说明

1. **创建房间**: 点击"创建房间"，系统生成房间ID
2. **加入房间**: 输入房间ID，输入姓名，允许麦克风权限
3. **音频控制**:
   - 静音/取消静音: 点击麦克风按钮或按空格键
   - 调节音量: 使用音量滑块
   - 离开房间: Ctrl + L

## 🐛 故障排除

### 常见问题

**无法访问麦克风**
- 检查浏览器权限设置

**音频质量差**
- 建议使用耳机
- 检查网络连接

**Socket.io连接失败**
- 确保服务器正常运行
- 检查端口3001是否被占用
- 访问测试页面检查连接状态

### 查看日志

```bash
# 服务器日志
tail -f logs/server.log

# 客户端日志
tail -f logs/client.log
```

## 📄 许可证

MIT License
