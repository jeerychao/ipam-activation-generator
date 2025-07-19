#!/bin/bash

# 设置错误时退出
set -e

echo "Starting IPAM Activation Generator..."

# 等待数据库准备就绪
echo "Waiting for database to be ready..."
until npx prisma db push --accept-data-loss; do
  echo "Database is not ready yet. Retrying in 5 seconds..."
  sleep 5
done

echo "Database is ready!"

# 生成Prisma客户端
echo "Generating Prisma client..."
npx prisma generate

# 启动应用
echo "Starting application..."
exec node server.js 