# Use the official Node.js runtime as the base image
FROM node:20-slim AS base

# Install system dependencies including OpenSSL
RUN apt-get update -y && \
    apt-get install -y openssl curl postgresql-client && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Enable corepack for package manager management
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm config set registry https://registry.npmmirror.com/ && \
    npm ci --ignore-scripts && \
    npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1
# Prevent automatic Prisma installation
ENV PRISMA_SKIP_POSTINSTALL_GENERATE 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /app nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma files with proper permissions
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy scripts and set permissions
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
RUN chmod +x /app/scripts/start.sh

# Create necessary directories with proper permissions
RUN mkdir -p /app/temp /app/backups /app/.npm /app/.npm-global/lib /app/.npm-global/bin /app/logs && \
    chown -R nextjs:nodejs /app

# Set npm environment variables for nextjs user
ENV HOME=/app
ENV NPM_CONFIG_CACHE=/app/.npm
ENV NPM_CONFIG_PREFIX=/app/.npm-global

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# Use the start script
CMD ["/app/scripts/start.sh"] 