#!/bin/bash

# 激活码生成器数据库设置脚本

echo "=== 激活码生成器数据库设置 ==="

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 停止并删除现有容器
echo "🔄 停止现有容器..."
docker-compose down

# 删除现有数据卷（可选）
read -p "是否删除现有数据库数据？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ 删除数据卷..."
    docker volume rm ipam-activation-generator_pgdata 2>/dev/null || true
fi

# 启动数据库
echo "🚀 启动数据库..."
docker-compose up -d db

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 检查数据库连接
echo "🔍 检查数据库连接..."
docker-compose exec db pg_isready -U postgres

if [ $? -eq 0 ]; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 构建并启动应用
echo "🔨 构建应用..."
docker-compose build

echo "🚀 启动应用..."
docker-compose up -d

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 15

# 检查应用状态
echo "🔍 检查应用状态..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ 应用启动成功"
    echo "🌐 访问地址: http://localhost:3000"
else
    echo "❌ 应用启动失败"
    echo "📋 查看日志: docker-compose logs app"
fi

echo "=== 设置完成 ===" 