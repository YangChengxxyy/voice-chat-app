#!/bin/bash

# VoiceChat Mini - 停止脚本
# 用于停止所有运行中的服务

set -e

echo "🛑 停止 VoiceChat Mini 服务..."

# 停止 Docker Compose 服务
echo "📦 停止 Docker 容器..."
docker-compose down

# 检查是否还有相关容器在运行
echo "🔍 检查剩余容器..."
RUNNING_CONTAINERS=$(docker ps --filter "name=voicechat" --format "table {{.Names}}\t{{.Status}}" | grep -v "NAMES" || true)

if [ -n "$RUNNING_CONTAINERS" ]; then
    echo "⚠️  发现以下容器仍在运行："
    echo "$RUNNING_CONTAINERS"
    echo "🔧 正在强制停止..."
    docker ps --filter "name=voicechat" -q | xargs -r docker stop
    docker ps --filter "name=voicechat" -q | xargs -r docker rm
else
    echo "✅ 所有相关容器已停止"
fi

# 检查端口占用
echo "🔍 检查端口占用情况..."
PORT_3000=$(lsof -ti:3000 || true)
PORT_3001=$(lsof -ti:3001 || true)

if [ -n "$PORT_3000" ]; then
    echo "⚠️  端口 3000 仍被占用 (PID: $PORT_3000)"
    echo "   使用以下命令手动释放: kill $PORT_3000"
fi

if [ -n "$PORT_3001" ]; then
    echo "⚠️  端口 3001 仍被占用 (PID: $PORT_3001)"
    echo "   使用以下命令手动释放: kill $PORT_3001"
fi

if [ -z "$PORT_3000" ] && [ -z "$PORT_3001" ]; then
    echo "✅ 端口 3000 和 3001 已释放"
fi

echo ""
echo "🎯 服务停止完成！"
echo ""
echo "📋 其他操作："
echo "   重新启动: ./deploy.sh"
echo "   清理资源: ./deploy.sh --clean"
echo "   查看日志: docker-compose logs"
echo ""
