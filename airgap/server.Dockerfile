# =============================================================================
# Recruitment Quiz System — server image, built FULLY OFFLINE on the
# air-gapped network. Every external input has been made local:
#   • base image  → <BASE_REGISTRY>/base/node:20-openssl   (pre-pushed by
#     prep.sh — includes openssl + Prisma engines + PRISMA_*_BINARY env vars)
#   • npm deps    → <NPM_REGISTRY>                         (Verdaccio proxy)
#   • Prisma      → engines baked into the base image — no downloads, nothing
#     heavy in the repo
#
# Build from the REPO ROOT (context = .):
#   docker build -f airgap/server.Dockerfile \
#     --build-arg BASE_REGISTRY=<gitlab-registry> \
#     --build-arg NPM_REGISTRY=http://verdaccio.local:4873/ \
#     -t <gitlab-registry>/<project>/server:latest .
# =============================================================================
ARG BASE_REGISTRY=registry.gitlab.local
ARG NPM_REGISTRY=http://verdaccio.local:4873/

# ---- deps stage -------------------------------------------------------------
FROM ${BASE_REGISTRY}/base/node:20-openssl AS deps
ARG NPM_REGISTRY
WORKDIR /app

# PRISMA_QUERY_ENGINE_LIBRARY / PRISMA_SCHEMA_ENGINE_BINARY are inherited from
# the base image (point at /opt/prisma-engines/), so `prisma generate` uses
# those files directly — zero downloads, no binaries.prisma.sh needed.

ENV npm_config_registry=${NPM_REGISTRY}
COPY server/package*.json ./
RUN npm ci --ignore-scripts

COPY server/prisma ./prisma/
RUN npx prisma generate

# NOTE: deliberately NO `npm prune --omit=dev` here. The runtime entrypoint runs
# `npx prisma migrate deploy`, which needs the `prisma` CLI (a devDependency).
# Pruning it forces npx to hit a registry at container start — instant failure
# offline. Dev deps staying in the image is the price of a fully offline build.

# ---- runtime stage ----------------------------------------------------------
FROM ${BASE_REGISTRY}/base/node:20-openssl
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY server/ ./

RUN mkdir -p uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
