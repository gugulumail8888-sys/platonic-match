# ==========================================
# 開発環境ステージ
# node:22-alpine … pnpm 9.x 対応の LTS
# ==========================================
FROM node:22-alpine AS development

WORKDIR /app

# pnpm 9.x を固定（Node 22 対応・安定版）
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# 依存関係のインストール
COPY package.json pnpm-lock.yaml* ./
# lockfile がない場合も動作するよう --no-frozen-lockfile
RUN pnpm install --no-frozen-lockfile

# ソースコードのコピー
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]

# ==========================================
# ビルドステージ
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

# 本番ビルド
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL

RUN pnpm build

# ==========================================
# 本番環境ステージ
# ==========================================
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# 必要なファイルのみコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
