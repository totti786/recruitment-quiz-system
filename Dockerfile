FROM registry.testlab.local/recruitment-quiz-server:latest AS old
FROM registry.testlab.local/library/node:20-alpine AS builder
WORKDIR /app
COPY --from=old /usr/bin/openssl /usr/bin/openssl
COPY --from=old /usr/lib/libssl.so.3 /usr/lib/libssl.so.3
COPY --from=old /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.3
RUN chmod +x /usr/bin/openssl
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/server/node_modules/@prisma/engines/libquery_engine-linux-musl-openssl-3.0.x.so.node
ENV PRISMA_SCHEMA_ENGINE_BINARY=/app/server/node_modules/@prisma/engines/schema-engine-linux-musl-openssl-3.0.x
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
COPY client ./client
COPY server ./server
COPY docs ./docs
COPY README.md ./README.md
# Offline deps (musl node_modules + prebuilt client/dist) — provided out-of-band,
# NOT committed to git (see .gitignore). Placed on the build host before build.
ADD quiz-alpine-offline.tar.gz ./
RUN ./server/node_modules/.bin/prisma generate --schema=./server/prisma/schema.prisma

# --- runtime (fully offline: openssl via old image, no apk) ---
FROM registry.testlab.local/library/node:20-alpine
WORKDIR /app
COPY --from=old /usr/bin/openssl /usr/bin/openssl
COPY --from=old /usr/lib/libssl.so.3 /usr/lib/libssl.so.3
COPY --from=old /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.3
RUN chmod +x /usr/bin/openssl

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL="file:/app/data/quiz.db"
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/server/node_modules/@prisma/engines/libquery_engine-linux-musl-openssl-3.0.x.so.node
ENV PRISMA_SCHEMA_ENGINE_BINARY=/app/server/node_modules/@prisma/engines/schema-engine-linux-musl-openssl-3.0.x

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

CMD ["sh","-c","npx prisma migrate deploy && node prisma/seed.js || true && node server.js"]
