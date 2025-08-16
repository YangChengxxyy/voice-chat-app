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

### 方法1: 一键启动（推荐）

**Linux/macOS:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

### 方法2: 手动启动

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