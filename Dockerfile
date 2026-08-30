FROM registry.testlab.local/library/node:20-alpine AS builder
WORKDIR /app

# Prisma needs openssl on alpine
RUN apk add --no-cache openssl

# --- install deps first (better layer cache) ---
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/
COPY client/package.json client/package-lock.json ./client/

RUN npm ci
RUN npm ci --prefix server
RUN npm ci --prefix client

# --- copy source ---
COPY client ./client
COPY server ./server
COPY docs ./docs
COPY README.md ./README.md

# --- generate Prisma client + build frontend ---
RUN npx --prefix server prisma generate
RUN npm run build

# --- runtime ---
FROM registry.testlab.local/library/node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl tini wget

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/quiz.db"

# copy built artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
# node_modules (keep dev deps for prisma migrate at runtime — ~50MB overhead, simplest for airgap)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/client/node_modules ./client/node_modules

RUN mkdir -p /app/data && chown -R node:node /app

USER node
EXPOSE 3001
WORKDIR /app/server

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=20s \
  CMD wget -qO- http://localhost:3001/api/health | grep -q '"status":"OK"'

ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js || true && node server.js"]
