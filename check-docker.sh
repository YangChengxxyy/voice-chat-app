#!/bin/bash

# Docker Compose 兼容性检查脚本
# 自动检测系统支持的 Docker Compose 命令

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 检测 Docker Compose 命令..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker 未安装或不在 PATH 中${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 已安装${NC}"

# 检查 Docker 是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker 服务未运行，请启动 Docker${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 服务正在运行${NC}"

# 检测 docker compose 命令支持
echo "🔍 检测 Docker Compose 命令支持..."

COMPOSE_CMD=""

# 优先检查新版本的 docker compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
    COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || docker compose version 2>/dev/null | head -n1)
    echo -e "${GREEN}✅ 支持 'docker compose' (新版本)${NC}"
    echo -e "   版本: ${COMPOSE_VERSION}"
# 检查旧版本的 docker-compose
elif command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
    COMPOSE_VERSION=$(docker-compose version --short 2>/dev/null || docker-compose version 2>/dev/null | head -n1)
    echo -e "${YELLOW}⚠️  支持 'docker-compose' (旧版本)${NC}"
    echo -e "   版本: ${COMPOSE_VERSION}"
    echo -e "${YELLOW}   建议升级到新版本 Docker 以使用 'docker compose'${NC}"
else
    echo -e "${RED}❌ 未找到 Docker Compose${NC}"
    echo ""
    echo "请安装 Docker Compose："
    echo "1. 更新 Docker Desktop 到最新版本"
    echo "2. 或安装 Docker Compose 插件"
    echo "3. 或安装独立的 docker-compose"
    exit 1
fi

# 将检测结果写入环境文件
cat > .docker-compose-cmd << EOF
# Docker Compose 命令配置
# 由 check-docker.sh 自动生成
COMPOSE_CMD="$COMPOSE_CMD"
EOF

echo ""
echo -e "${GREEN}🎉 Docker Compose 检测完成${NC}"
echo -e "   使用命令: ${GREEN}$COMPOSE_CMD${NC}"
echo -e "   配置已保存到: ${GREEN}.docker-compose-cmd${NC}"
echo ""

# 提供使用建议
echo "💡 使用建议："
if [ "$COMPOSE_CMD" = "docker compose" ]; then
    echo "   您的系统支持新版本命令，所有脚本将使用 'docker compose'"
else
    echo "   您的系统使用旧版本命令，建议升级到最新版本 Docker"
    echo "   当前脚本将使用 'docker-compose'"
fi

echo ""
echo "🚀 现在可以运行部署脚本："
echo "   ./deploy.sh"
