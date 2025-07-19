#!/bin/bash

# 激活码生成器快速启动脚本

echo "=== 激活码生成器快速启动 ==="

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查是否在正确的目录
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ 请在激活码生成器项目根目录运行此脚本"
    exit 1
fi

# 创建环境变量文件（如果不存在）
if [ ! -f ".env.local" ]; then
    echo "📝 创建环境变量文件..."
    cp env.example .env.local
    echo "✅ 环境变量文件已创建"
fi

# 停止现有容器
echo "🔄 停止现有容器..."
docker-compose down

# 删除现有数据卷（可选）
read -p "是否删除现有数据库数据？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ 删除数据卷..."
    docker volume rm ipam-activation-generator_pgdata 2>/dev/null || true
fi

# 构建并启动服务
echo "🔨 构建应用..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 20

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查数据库
if docker-compose exec db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ 数据库运行正常"
else
    echo "❌ 数据库启动失败"
    echo "📋 查看数据库日志: docker-compose logs db"
    exit 1
fi

# 检查应用
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 应用启动成功"
    echo ""
    echo "🎉 激活码生成器已成功启动！"
    echo ""
    echo "📋 访问信息:"
    echo "   🌐 应用地址: http://localhost:3000"
    echo "   🗄️ 数据库端口: localhost:5433"
    echo ""
    echo "📋 常用命令:"
    echo "   查看日志: docker-compose logs -f"
    echo "   停止服务: docker-compose down"
    echo "   重启服务: docker-compose restart"
    echo "   查看数据库: npx prisma studio"
    echo ""
    echo "📝 数据库迁移已完成！"
    echo "   - 数据现在存储在 PostgreSQL 数据库中"
    echo "   - 数据持久化，容器重启不丢失"
    echo "   - 支持多用户并发访问"
    echo "   - 完整的数据管理和备份功能"
else
    echo "❌ 应用启动失败"
    echo "📋 查看应用日志: docker-compose logs app"
    exit 1
fi

echo ""
echo "=== 启动完成 ===" 