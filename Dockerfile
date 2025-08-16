# VoiceChat Mini - Docker 多阶段构建
FROM node:18-alpine AS base

# 安装依赖包，包括 Python 和 make（用于某些 npm 包的编译）
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括 devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 生产阶段 - Next.js 应用
FROM node:18-alpine AS nextjs

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建结果和依赖
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

# 设置正确的权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]

# 生产阶段 - Socket.io 服务器
FROM node:18-alpine AS socketio

WORKDIR /app

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 socketio

# 复制依赖和服务器代码
COPY --from=base /app/node_modules ./node_modules
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package.json ./package.json

# 设置正确的权限
RUN chown -R socketio:nodejs /app

USER socketio

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: process.env.PORT || 3001, path: '/health', timeout: 2000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.end();"

CMD ["node", "server.js"]

# 开发阶段（可选）
FROM node:18-alpine AS development

WORKDIR /app

# 安装开发依赖
RUN apk add --no-cache libc6-compat python3 make g++

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖
RUN npm install

# 复制源代码
COPY . .

EXPOSE 3000 3001

ENV NODE_ENV=development

# 开发模式下的启动命令
CMD ["sh", "-c", "npm run server & npm run dev"]
