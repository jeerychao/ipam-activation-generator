#!/bin/bash

# 设置默认的DATABASE_URL用于构建
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ipam_activation_generator"

echo "Building with DATABASE_URL: $DATABASE_URL"

# 运行构建
npm run build 