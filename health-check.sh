#!/bin/bash

# VoiceChat Mini - 健康检查脚本
# 用于验证所有服务是否正常运行

set -e

echo "🔍 VoiceChat Mini 健康检查..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "检查 $service_name ... "

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ 正常${NC}"
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

# 检查 Docker 容器状态
check_containers() {
    echo "📦 检查 Docker 容器状态..."

    local socket_status=$(docker inspect --format='{{.State.Status}}' voicechat-socket 2>/dev/null || echo "not_found")
    local web_status=$(docker inspect --format='{{.State.Status}}' voicechat-web 2>/dev/null || echo "not_found")

    echo -n "Socket.io 容器 ... "
    if [ "$socket_status" = "running" ]; then
        echo -e "${GREEN}✅ 运行中${NC}"
    else
        echo -e "${RED}❌ $socket_status${NC}"
    fi

    echo -n "Next.js 容器 ... "
    if [ "$web_status" = "running" ]; then
        echo -e "${GREEN}✅ 运行中${NC}"
    else
        echo -e "${RED}❌ $web_status${NC}"
    fi

    echo ""
}

# 检查端口占用
check_ports() {
    echo "🔌 检查端口占用..."

    local port_3000=$(lsof -ti:3000 2>/dev/null || true)
    local port_3001=$(lsof -ti:3001 2>/dev/null || true)

    echo -n "端口 3000 ... "
    if [ -n "$port_3000" ]; then
        echo -e "${GREEN}✅ 已占用 (PID: $port_3000)${NC}"
    else
        echo -e "${YELLOW}⚠️  未占用${NC}"
    fi

    echo -n "端口 3001 ... "
    if [ -n "$port_3001" ]; then
        echo -e "${GREEN}✅ 已占用 (PID: $port_3001)${NC}"
    else
        echo -e "${YELLOW}⚠️  未占用${NC}"
    fi

    echo ""
}

# 检查网络连接
check_network() {
    echo "🌐 检查网络连接..."

    # 检查本地回环
    echo -n "本地回环 ... "
    if ping -c 1 127.0.0.1 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 正常${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
    fi

    echo ""
}

# 主要检查流程
main() {
    local errors=0

    # 检查 Docker 容器
    check_containers

    # 检查端口
    check_ports

    # 检查网络
    check_network

    # 检查服务端点
    echo "🔗 检查服务端点..."

    # 等待服务启动
    echo "⏳ 等待服务启动..."
    sleep 3

    # 检查 Socket.io 健康检查端点
    if ! check_service "Socket.io 健康检查" "http://localhost:3001/health"; then
        ((errors++))
        echo -e "${RED}   详细信息: Socket.io 服务器健康检查失败${NC}"
    fi

    # 检查 Next.js 应用
    if ! check_service "Next.js 应用" "http://localhost:3000"; then
        ((errors++))
        echo -e "${RED}   详细信息: Next.js 应用无法访问${NC}"
    fi

    # 检查 Socket.io 连接
    if ! check_service "Socket.io 连接" "http://localhost:3001/socket.io/" 400; then
        ((errors++))
        echo -e "${RED}   详细信息: Socket.io 连接端点失败${NC}"
    fi

    echo ""

    # 汇总结果
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}🎉 所有检查通过！VoiceChat Mini 运行正常${NC}"
        echo ""
        echo -e "${GREEN}📍 访问地址：${NC}"
        echo -e "   Web 应用: ${GREEN}http://localhost:3000${NC}"
        echo -e "   Socket 服务: ${GREEN}http://localhost:3001${NC}"
        echo -e "   健康检查: ${GREEN}http://localhost:3001/health${NC}"
        echo ""
        exit 0
    else
        echo -e "${RED}❌ 发现 $errors 个问题${NC}"
        echo ""
        echo -e "${YELLOW}🔧 故障排除建议：${NC}"
        echo "1. 检查 Docker 服务是否正常运行"
        echo "2. 确认容器是否正确启动: docker compose ps"
        echo "3. 查看容器日志: docker compose logs"
        echo "4. 检查端口是否被其他程序占用"
        echo "5. 确认防火墙设置"
        echo "6. 重启服务: ./deploy.sh"
        echo ""
        exit 1
    fi
}

# 显示使用帮助
show_help() {
    echo "VoiceChat Mini 健康检查脚本"
    echo ""
    echo "用法:"
    echo "  $0                 运行完整健康检查"
    echo "  $0 --help         显示此帮助信息"
    echo "  $0 --quick        快速检查（仅检查端点）"
    echo "  $0 --containers   仅检查容器状态"
    echo "  $0 --ports        仅检查端口占用"
    echo ""
}

# 快速检查
quick_check() {
    echo "🚀 快速健康检查..."
    echo ""

    local errors=0

    if ! check_service "Socket.io 健康检查" "http://localhost:3001/health"; then
        ((errors++))
    fi

    if ! check_service "Next.js 应用" "http://localhost:3000"; then
        ((errors++))
    fi

    echo ""
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✅ 快速检查通过${NC}"
    else
        echo -e "${RED}❌ 快速检查失败${NC}"
        exit 1
    fi
}

# 解析命令行参数
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --quick|-q)
        quick_check
        exit 0
        ;;
    --containers|-c)
        check_containers
        exit 0
        ;;
    --ports|-p)
        check_ports
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "未知参数: $1"
        echo "使用 --help 查看帮助"
        exit 1
        ;;
esac
