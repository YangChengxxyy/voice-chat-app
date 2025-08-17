#!/bin/bash

# VoiceChat Mini - Docker 部署脚本
# 包含代理设置和完整的部署流程

set -e

echo "🚀 开始部署 VoiceChat Mini..."

# 设置代理（如果需要）
export https_proxy=http://127.0.0.1:7890
export http_proxy=http://127.0.0.1:7890
export all_proxy=socks5://127.0.0.1:7890

echo "✅ 代理设置完成"

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

echo "✅ Docker 检查通过"

# 停止现有容器（如果存在）
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null || true

# 清理旧镜像（可选）
if [ "$1" = "--clean" ]; then
    echo "🧹 清理旧镜像..."
    docker-compose down --rmi all --volumes --remove-orphans 2>/dev/null || true
    docker system prune -f
fi

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 测试服务
echo "🧪 测试服务..."

# 测试 Socket.io 服务器
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Socket.io 服务器运行正常"
else
    echo "❌ Socket.io 服务器连接失败"
    exit 1
fi

# 测试 Next.js 应用
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js 应用运行正常"
else
    echo "❌ Next.js 应用连接失败"
    exit 1
fi

echo ""
echo "🎉 部署成功！"
echo ""
echo "📍 访问地址："
echo "   Web 应用: http://localhost:3000"
echo "   Socket 服务: http://localhost:3001"
echo ""
echo "📋 常用命令："
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo "   查看状态: docker-compose ps"
echo ""
echo "🔧 故障排除："
echo "   如果遇到问题，请检查："
echo "   1. Docker 是否正常运行"
echo "   2. 端口 3000 和 3001 是否被占用"
echo "   3. 代理设置是否正确"
echo "   4. 防火墙设置是否允许这些端口"
echo ""
echo "🔍 运行健康检查..."
./health-check.sh
