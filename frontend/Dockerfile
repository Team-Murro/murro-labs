# --- Build Stage (빌드용) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Next.js 환경변수 설정 (빌드 시점)
ENV NODE_ENV=production
RUN --mount=type=cache,target=/app/.next/cache npm run build

# --- Run Stage (실행용 - 초경량) ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 빌드된 결과물 중 필요한 것만 쏙쏙 골라옴 (Standalone 모드)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# 실행 포트
EXPOSE 3000
CMD ["node", "server.js"]
