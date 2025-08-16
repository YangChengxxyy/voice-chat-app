#!/bin/bash

# VoiceChat Mini 测试启动脚本
# 用于测试修复后的 Socket.io 连接

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查端口是否被占用并清理
check_and_clean_port() {
    local port=$1
    local service_name=$2

    if lsof -ti:$port > /dev/null 2>&1; then
        log_warning "端口 $port ($service_name) 被占用，正在清理..."
        local pids=$(lsof -ti:$port)
        for pid in $pids; do
            kill -9 $pid 2>/dev/null || true
            log_info "已终止进程 $pid"
        done
        sleep 2

        if lsof -ti:$port > /dev/null 2>&1; then
            log_error "无法释放端口 $port"
            exit 1
        fi
        log_success "端口 $port 已释放"
    else
        log_info "端口 $port 可用"
    fi
}

# 清理函数
cleanup() {
    log_info "正在清理进程..."

    # 终止后台进程
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        log_info "已终止服务器进程 (PID: $SERVER_PID)"
    fi

    if [ ! -z "$CLIENT_PID" ]; then
        kill $CLIENT_PID 2>/dev/null || true
        log_info "已终止客户端进程 (PID: $CLIENT_PID)"
    fi

    # 清理可能残留的进程
    pkill -f "server.js" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true

    log_success "清理完成"
    exit 0
}

# 注册清理函数
trap cleanup SIGINT SIGTERM

# 检查 Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js 未安装"
    exit 1
fi

NODE_VERSION=$(node -v)
log_success "Node.js 版本: $NODE_VERSION"

# 检查依赖
if [ ! -d "node_modules" ]; then
    log_warning "依赖包未安装，正在安装..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "依赖安装失败"
        exit 1
    fi
    log_success "依赖安装完成"
fi

# 清理端口
check_and_clean_port 3001 "Socket.io 服务器"
check_and_clean_port 3000 "Next.js 开发服务器"

# 创建日志目录
mkdir -p logs

echo ""
log_info "🚀 启动 VoiceChat Mini 测试版本..."
echo ""

# 启动 Socket.io 服务器
log_info "启动 Socket.io 服务器..."
node server.js > logs/server-test.log 2>&1 &
SERVER_PID=$!

# 等待服务器启动
sleep 3

# 检查服务器状态
if ! kill -0 $SERVER_PID 2>/dev/null; then
    log_error "Socket.io 服务器启动失败"
    cat logs/server-test.log
    exit 1
fi

if ! lsof -ti:3001 > /dev/null 2>&1; then
    log_error "服务器未能监听端口 3001"
    exit 1
fi

log_success "Socket.io 服务器启动成功 (PID: $SERVER_PID)"

# 启动 Next.js 开发服务器
log_info "启动 Next.js 开发服务器..."
npm run dev > logs/client-test.log 2>&1 &
CLIENT_PID=$!

# 等待客户端启动
sleep 5

# 检查客户端状态
if ! kill -0 $CLIENT_PID 2>/dev/null; then
    log_error "Next.js 开发服务器启动失败"
    cat logs/client-test.log
    cleanup
    exit 1
fi

log_success "Next.js 开发服务器启动成功 (PID: $CLIENT_PID)"

echo ""
echo "=================================================================="
log_success "🎉 VoiceChat Mini 测试版本启动完成！"
echo "=================================================================="
echo ""
echo -e "${GREEN}📱 应用地址:${NC}"
echo "   🏠 主页: http://localhost:3000"
echo "   🧪 测试页面: http://localhost:3000/test"
echo ""
echo -e "${BLUE}🔌 Socket.io 服务器:${NC} http://localhost:3001"
echo ""
echo -e "${YELLOW}🧪 测试流程:${NC}"
echo "   1. 打开测试页面: http://localhost:3000/test"
echo "   2. 检查连接状态是否为 'connected'"
echo "   3. 测试发送 Ping 和自定义消息"
echo "   4. 观察是否有连接断开/重连循环"
echo "   5. 如果测试页面稳定，再测试语音聊天功能"
echo ""
echo -e "${BLUE}📊 实时日志:${NC}"
echo "   服务器: tail -f logs/server-test.log"
echo "   客户端: tail -f logs/client-test.log"
echo ""
echo -e "${RED}⚠️  按 Ctrl+C 停止所有服务${NC}"
echo ""

# 显示初始服务器日志
echo -e "${BLUE}📋 服务器启动日志:${NC}"
head -20 logs/server-test.log 2>/dev/null || echo "暂无日志"
echo ""

# 监控进程状态
log_info "监控服务状态中... (每10秒检查一次)"
CHECK_COUNT=0

while true; do
    sleep 10
    CHECK_COUNT=$((CHECK_COUNT + 1))

    # 检查服务器进程
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        log_error "Socket.io 服务器意外停止"
        echo "最近的服务器日志:"
        tail -20 logs/server-test.log
        cleanup
        exit 1
    fi

    # 检查客户端进程
    if ! kill -0 $CLIENT_PID 2>/dev/null; then
        log_error "Next.js 开发服务器意外停止"
        echo "最近的客户端日志:"
        tail -20 logs/client-test.log
        cleanup
        exit 1
    fi

    # 每分钟显示一次状态
    if [ $((CHECK_COUNT % 6)) -eq 0 ]; then
        MINUTES=$((CHECK_COUNT / 6))
        log_info "服务运行正常 (已运行 ${MINUTES} 分钟)"

        # 显示端口状态
        if lsof -ti:3001 > /dev/null 2>&1 && lsof -ti:3000 > /dev/null 2>&1; then
            echo -e "   ${GREEN}✓${NC} 所有端口正常监听"
        else
            log_warning "端口状态异常"
        fi
    fi
done
