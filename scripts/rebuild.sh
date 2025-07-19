#!/bin/bash

echo "清理Docker容器和镜像..."
docker-compose down -v
docker system prune -f

echo "给脚本添加执行权限..."
chmod +x scripts/build.sh
chmod +x scripts/start.sh
chmod +x scripts/rebuild.sh

echo "重新构建镜像..."
docker-compose build --no-cache

echo "启动服务..."
docker-compose up -d

echo "等待服务启动..."
sleep 10

echo "检查服务状态..."
docker-compose ps

echo "查看应用日志..."
docker-compose logs app 