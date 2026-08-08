# ========== 阶段一：安装依赖 + 构建 ==========
FROM node:22-alpine AS builder
WORKDIR /app

# 安装 pnpm 9（与 pnpm-lock.yaml lockfileVersion 9 匹配）
RUN npm install -g pnpm@9

# 先拷贝依赖清单，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 拷贝源码并构建（next.config.ts 已配置 output: "standalone"）
COPY . .
RUN pnpm build

# ========== 阶段二：运行（standalone 自包含） ==========
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 非 root 用户运行，更安全
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001

# standalone 产物（含 server.js 与精简 node_modules）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 静态资源与 public 目录（standalone 不自动包含，需手动拷贝）
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
