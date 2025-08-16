#!/bin/bash

# VoiceChat Mini 启动脚本
set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}启动 VoiceChat Mini...${NC}"

# 清理函数
cleanup() {
    echo -e "\n${YELLOW}正在清理进程...${NC}"
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null || true
    fi
    pkill -f "server.js" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    echo -e "${GREEN}清理完成${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: Node.js 未安装${NC}"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "安装依赖包..."
    npm install
fi

# 清理端口
echo "检查端口占用..."
lsof -ti:3001 2>/dev/null | xargs -r kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs -r kill -9 2>/dev/null || true
sleep 2

# 创建日志目录
mkdir -p logs

# 启动服务
echo "启动 Socket.io 服务器..."
node server.js > logs/server.log 2>&1 &
SERVER_PID=$!
sleep 3

echo "启动 Next.js 服务器..."
npm run dev > logs/client.log 2>&1 &
CLIENT_PID=$!
sleep 5

echo ""
echo "================================================="
echo -e "${GREEN}  VoiceChat Mini 已启动!${NC}"
echo "================================================="
echo ""
echo "应用地址: http://localhost:3000"
echo "测试页面: http://localhost:3000/test"
echo ""
echo "日志文件:"
echo "  服务器: tail -f logs/server.log"
echo "  客户端: tail -f logs/client.log"
echo ""
echo -e "${YELLOW}按 Ctrl+C 停止所有服务${NC}"
echo ""

# 监控进程
while true; do
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}Socket.io 服务器意外停止${NC}"
        cleanup
        exit 1
    fi
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        echo -e "${RED}Next.js 服务器意外停止${NC}"
        cleanup
        exit 1
    fi
    sleep 10
done
