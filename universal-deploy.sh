#!/bin/bash

# VoiceChat Mini - 通用部署脚本
# 自动适配 docker-compose 和 docker compose 命令
# 支持代理设置和完整的部署流程

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 VoiceChat Mini 通用部署脚本${NC}"
echo "======================================"

# 检测 Docker Compose 命令
detect_compose_command() {
    echo "🔍 检测 Docker Compose 命令..."

    # 检查 Docker 是否安装
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装或不在 PATH 中${NC}"
        echo "请先安装 Docker Desktop 或 Docker Engine"
        exit 1
    fi

    # 检查 Docker 是否运行
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker 服务未运行，请启动 Docker${NC}"
        exit 1
    fi

    # 检测 Docker Compose 命令
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || docker compose version | head -n1 | awk '{print $NF}')
        echo -e "${GREEN}✅ 检测到新版本: docker compose${NC}"
        echo -e "   版本: ${COMPOSE_VERSION}"
    elif command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
        COMPOSE_VERSION=$(docker-compose version --short 2>/dev/null || docker-compose version | head -n1 | awk '{print $NF}')
        echo -e "${YELLOW}⚠️  检测到旧版本: docker-compose${NC}"
        echo -e "   版本: ${COMPOSE_VERSION}"
        echo -e "${YELLOW}   建议升级到最新版本 Docker Desktop${NC}"
    else
        echo -e "${RED}❌ 未找到 Docker Compose${NC}"
        echo ""
        echo "请安装 Docker Compose："
        echo "1. 升级 Docker Desktop 到最新版本（推荐）"
        echo "2. 或单独安装 Docker Compose 插件"
        echo "3. 或安装独立的 docker-compose 工具"
        exit 1
    fi
}

# 设置代理
setup_proxy() {
    echo ""
    echo "🌐 设置网络代理..."
    export https_proxy=http://127.0.0.1:7890
    export http_proxy=http://127.0.0.1:7890
    export all_proxy=socks5://127.0.0.1:7890
    echo -e "${GREEN}✅ 代理设置完成${NC}"
    echo "   HTTP Proxy: $http_proxy"
    echo "   HTTPS Proxy: $https_proxy"
    echo "   All Proxy: $all_proxy"
}

# 清理现有服务
cleanup_existing() {
    echo ""
    echo "🛑 清理现有服务..."

    # 停止现有容器
    echo "📦 停止现有容器..."
    $COMPOSE_CMD down 2>/dev/null || true

    # 清理选项
    if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
        echo "🧹 执行深度清理..."
        $COMPOSE_CMD down --rmi all --volumes --remove-orphans 2>/dev/null || true

        # 清理未使用的镜像和容器
        echo "🗑️  清理 Docker 系统..."
        docker system prune -f

        echo -e "${GREEN}✅ 深度清理完成${NC}"
    else
        echo -e "${GREEN}✅ 基础清理完成${NC}"
    fi
}

# 构建服务
build_services() {
    echo ""
    echo "🔨 构建 Docker 镜像..."

    # 检查 docker-compose.yml 文件
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${RED}❌ 未找到 docker-compose.yml 文件${NC}"
        exit 1
    fi

    # 构建镜像
    if $COMPOSE_CMD build; then
        echo -e "${GREEN}✅ 镜像构建成功${NC}"
    else
        echo -e "${RED}❌ 镜像构建失败${NC}"
        exit 1
    fi
}

# 启动服务
start_services() {
    echo ""
    echo "🚀 启动服务..."

    if $COMPOSE_CMD up -d; then
        echo -e "${GREEN}✅ 服务启动成功${NC}"
    else
        echo -e "${RED}❌ 服务启动失败${NC}"
        exit 1
    fi
}

# 等待服务就绪
wait_for_services() {
    echo ""
    echo "⏳ 等待服务就绪..."

    # 先等待一段时间让容器完全启动
    echo "   初始等待 15 秒..."
    sleep 15

    local max_attempts=30
    local attempt=0

    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))
        echo -n "."

        # 检查 Socket.io 服务
        if curl -s http://localhost:3001/health &> /dev/null; then
            echo ""
            echo -e "${GREEN}✅ 服务已就绪${NC}"
            return 0
        fi

        sleep 3
    done

    echo ""
    echo -e "${YELLOW}⚠️  服务启动时间较长，继续检查...${NC}"
}

# 验证服务
verify_services() {
    echo ""
    echo "🧪 验证服务状态..."

    local errors=0

    # 检查容器状态
    echo "📦 检查容器状态..."
    $COMPOSE_CMD ps

    echo ""
    echo "🔗 检查服务端点..."

    # 检查 Socket.io 健康检查
    echo -n "   Socket.io 健康检查 ... "
    if curl -s -f http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✅ 正常${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
        ((errors++))
    fi

    # 检查 Next.js 应用
    echo -n "   Next.js 应用 ... "
    if curl -s -f http://localhost:3000 > /dev/null; then
        echo -e "${GREEN}✅ 正常${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
        ((errors++))
    fi

    # 检查 Socket.io 连接端点
    echo -n "   Socket.io 连接端点 ... "
    if curl -s http://localhost:3001/socket.io/ | grep -q "0"; then
        echo -e "${GREEN}✅ 正常${NC}"
    else
        echo -e "${RED}❌ 失败${NC}"
        ((errors++))
    fi

    return $errors
}

# 显示部署结果
show_results() {
    local errors=$1

    echo ""
    echo "======================================"

    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}🎉 部署成功！${NC}"
        echo ""
        echo -e "${GREEN}📍 访问地址：${NC}"
        echo -e "   🌐 Web 应用: ${BLUE}http://localhost:3000${NC}"
        echo -e "   🔌 Socket 服务: ${BLUE}http://localhost:3001${NC}"
        echo -e "   ❤️  健康检查: ${BLUE}http://localhost:3001/health${NC}"
        echo ""
        echo -e "${GREEN}📋 常用命令：${NC}"
        echo -e "   查看日志: ${YELLOW}$COMPOSE_CMD logs -f${NC}"
        echo -e "   停止服务: ${YELLOW}$COMPOSE_CMD down${NC}"
        echo -e "   重启服务: ${YELLOW}$COMPOSE_CMD restart${NC}"
        echo -e "   查看状态: ${YELLOW}$COMPOSE_CMD ps${NC}"
        echo -e "   健康检查: ${YELLOW}./health-check.sh${NC}"
        echo ""
    else
        echo -e "${RED}❌ 部署失败，发现 $errors 个问题${NC}"
        echo ""
        echo -e "${YELLOW}🔧 故障排除建议：${NC}"
        echo "1. 检查 Docker 服务是否正常运行"
        echo "2. 确认端口 3000 和 3001 未被占用"
        echo "3. 检查代理设置是否正确"
        echo "4. 查看详细日志: $COMPOSE_CMD logs"
        echo "5. 重试部署: $0"
        echo "6. 深度清理后重试: $0 --clean"
        echo ""
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo "VoiceChat Mini 通用部署脚本"
    echo ""
    echo "用法:"
    echo "  $0                 标准部署"
    echo "  $0 --clean        清理后部署"
    echo "  $0 --help         显示帮助"
    echo "  $0 --no-proxy     不设置代理"
    echo ""
    echo "功能:"
    echo "  • 自动检测 docker compose 命令版本"
    echo "  • 自动设置网络代理"
    echo "  • 完整的服务构建和部署"
    echo "  • 服务健康检查和验证"
    echo "  • 详细的错误诊断"
    echo ""
}

# 主函数
main() {
    # 解析命令行参数
    local clean_mode=false
    local use_proxy=true

    for arg in "$@"; do
        case $arg in
            --clean|-c)
                clean_mode=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            --no-proxy)
                use_proxy=false
                shift
                ;;
            *)
                echo "未知参数: $arg"
                echo "使用 --help 查看帮助"
                exit 1
                ;;
        esac
    done

    # 执行部署步骤
    detect_compose_command

    if [ "$use_proxy" = true ]; then
        setup_proxy
    else
        echo -e "${YELLOW}⚠️  跳过代理设置${NC}"
    fi

    if [ "$clean_mode" = true ]; then
        cleanup_existing --clean
    else
        cleanup_existing
    fi

    build_services
    start_services
    wait_for_services

    # 验证服务并显示结果
    if verify_services; then
        show_results 0

        # 运行健康检查（如果存在）
        if [ -f "./health-check.sh" ]; then
            echo -e "${BLUE}🔍 运行完整健康检查...${NC}"
            echo ""
            ./health-check.sh --quick || true
        fi

    else
        show_results $?
        exit 1
    fi
}

# 执行主函数
main "$@"
