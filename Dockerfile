# 基础镜像
FROM node:20-slim AS base
WORKDIR /app

# 安装系统依赖
RUN apt-get update -y && \
    apt-get install -y openssl curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 依赖阶段：只装依赖
FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm ci --ignore-scripts

# 构建阶段：编译、生成Prisma Client、Next.js构建
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/prisma ./prisma
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/ipam_activation_generator
RUN npm run build

# 运行阶段：只包含生产运行所需内容
FROM base AS runner
WORKDIR /app

# 非root用户运行
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /app nextjs

# 只复制生产运行所需内容
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/ipam_activation_generator
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]