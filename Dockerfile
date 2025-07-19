FROM node:20-slim

# 安装系统依赖
RUN apt-get update -y && \
    apt-get install -y openssl curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制依赖文件
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# 设置国内npm源
RUN npm config set registry https://registry.npmmirror.com/

# 安装依赖并生成Prisma Client
RUN npm ci --ignore-scripts
RUN npx prisma generate

# 复制全部代码
COPY . .

# 构建Next.js
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/ipam_activation_generator
RUN npm run build

EXPOSE 3000
CMD ["npx", "next", "start"]