# 基于官方 Node.js 镜像
FROM node:20-slim AS builder

# 设置工作目录
WORKDIR /app

# 拷贝依赖文件
COPY package.json package-lock.json ./

# 使用国内 npm 镜像加速并安装依赖
RUN npm config set registry https://registry.npmmirror.com/ && npm install --frozen-lockfile

# 拷贝全部源代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 生产环境镜像
FROM node:20-slim AS runner
WORKDIR /app

# 仅拷贝生产依赖和构建产物
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/next-env.d.ts ./
COPY --from=builder /app/tsconfig.json ./

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"] 