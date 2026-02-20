# ========================================
# BUFFS API - Dockerfile
# ========================================
# Multi-stage build para imagem otimizada de produção.
#
# Estágio 1 (builder): instala todas as deps e compila TypeScript
# Estágio 2 (production): apenas deps de produção + dist compilado
# ========================================

# ------ ESTÁGIO 1: BUILD ------
FROM node:20-alpine AS builder

WORKDIR /app

# Copia manifests primeiro (cache de layers)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instala todas as dependências (incluindo devDeps para build)
RUN npm ci --no-audit

# Copia o código fonte
COPY src ./src

# Compila TypeScript
RUN npm run build

# ------ ESTÁGIO 2: PRODUÇÃO ------
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copia manifests
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --only=production --no-audit && npm cache clean --force

# Copia o dist compilado do estágio anterior
COPY --from=builder /app/dist ./dist

# Cria diretório de logs
RUN mkdir -p logs

# Usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "dist/main.js"]
