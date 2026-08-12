#!/usr/bin/env bash
# =============================================================================
# prep.sh — run ON AN INTERNET-CONNECTED MACHINE (once per release, or whenever
# the Prisma version / base images change). Everything it produces is consumed
# by the air-gapped network:
#
#   1. Prisma engines (linux-musl + debian-openssl-3.0.x) — downloaded and
#      BAKED INTO base/node:20-openssl. NOT committed to the repo.
#   2. Base images (node:20-alpine, node:20-alpine+openssl+engines,
#      nginx:alpine, verdaccio) → pushed to your internal GitLab registry
#      under <REGISTRY>/base/
#   3. [--with-npm-cache] npm cache bundle → npm-offline-cache.tar.gz
#      (only needed if you skip Verdaccio — see airgap/README.md "Option B")
#
# Usage:
#   REGISTRY=gitlab.local:5050 TOKEN=<gitlab-pat> bash airgap/prep.sh
#   REGISTRY=gitlab.local:5050 TOKEN=<gitlab-pat> bash airgap/prep.sh --with-npm-cache
#
# REGISTRY  = your internal GitLab container registry (host[:port])
# TOKEN     = GitLab PAT with `write_registry` scope
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

REGISTRY="${REGISTRY:?Set REGISTRY — your internal GitLab registry, e.g. gitlab.local:5050}"
TOKEN="${TOKEN:?Set TOKEN — GitLab PAT with write_registry scope}"
LOGIN_USER="${LOGIN_USER:-ci-user}"
WITH_NPM_CACHE="${1:-}"

info() { echo -e "\033[0;36m[i]\033[0m $*"; }
ok()   { echo -e "\033[0;32m[+]\033[0m $*"; }
err()  { echo -e "\033[0;31m[x]\033[0m $*" >&2; }

# ---- 1. Prisma engines -------------------------------------------------------
info "Downloading Prisma engines (linux-musl + debian-openssl-3.0.x)..."
TMP="$(mktemp -d)"
trap 'docker run --rm -v "$TMP:/app" alpine chown -R "$(id -u):$(id -g)" /app >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT
cp server/package.json server/package-lock.json "$TMP/"
cp -r server/prisma "$TMP/prisma"

# Run the real install inside node:20-alpine (same base as the prod image) so
# the engine download matches the lockfile exactly. --ignore-scripts skips the
# @prisma/engines postinstall download; `prisma generate` then fetches engines
# for every binaryTarget in schema.prisma from binaries.prisma.sh.
docker run --rm -v "$TMP:/app" -w /app node:20-alpine sh -c \
  'apk add --no-cache openssl >/dev/null 2>&1 && npm ci --ignore-scripts --no-audit --no-fund >/dev/null && npx prisma generate'

# Engines land in two places: CLI engines in node_modules/@prisma/engines
# (native only — schema-engine + libquery_engine), client engines for each
# binaryTarget in node_modules/.prisma/client (libquery_engine-<target>).
ENG_STAGE="$(mktemp -d)"
mkdir -p "$ENG_STAGE/engines"
cp "$TMP"/node_modules/@prisma/engines/libquery_engine-* "$ENG_STAGE/engines/" 2>/dev/null || true
cp "$TMP"/node_modules/@prisma/engines/schema-engine-*    "$ENG_STAGE/engines/" 2>/dev/null || true
cp "$TMP"/node_modules/.prisma/client/libquery_engine-*   "$ENG_STAGE/engines/" 2>/dev/null || true

if ! ls "$ENG_STAGE/engines"/schema-engine-* >/dev/null 2>&1; then
  err "No engines produced — check server/prisma/schema.prisma binaryTargets."
  exit 1
fi
ok "Engines staged: $(ls "$ENG_STAGE/engines" | tr '\n' ' ')"

# ---- 2. Base images ----------------------------------------------------------
info "Pulling base images (needs internet)..."
docker pull node:20-alpine
docker pull nginx:alpine
docker pull verdaccio/verdaccio:5

# base/node:20-openssl = node:20-alpine + openssl + Prisma engines + the env
# vars that make prisma use them (no downloads at build time, nothing to
# commit). Rebuild via this script whenever the Prisma version changes.
cat > "$ENG_STAGE/Dockerfile" <<'EOF'
FROM node:20-alpine
RUN apk add --no-cache openssl
COPY engines/ /opt/prisma-engines/
ENV PRISMA_QUERY_ENGINE_LIBRARY=/opt/prisma-engines/libquery_engine-linux-musl-openssl-3.0.x.so.node
ENV PRISMA_SCHEMA_ENGINE_BINARY=/opt/prisma-engines/schema-engine-linux-musl-openssl-3.0.x
EOF
docker build -t "$REGISTRY/base/node:20-openssl" "$ENG_STAGE"
rm -rf "$ENG_STAGE"

info "Logging into $REGISTRY..."
echo "$TOKEN" | docker login "$REGISTRY" -u "$LOGIN_USER" --password-stdin

while read -r src dst; do
  docker tag "$src" "$REGISTRY/$dst"
  docker push "$REGISTRY/$dst"
  ok "pushed $REGISTRY/$dst"
done <<'EOF'
node:20-alpine           base/node:20-alpine
nginx:alpine             base/nginx:alpine
verdaccio/verdaccio:5    base/verdaccio:5
EOF
# the openssl+engines variant is already tagged with the registry
docker push "$REGISTRY/base/node:20-openssl"
ok "pushed $REGISTRY/base/node:20-openssl"

# ---- 3. (optional) npm cache bundle ------------------------------------------
if [ "$WITH_NPM_CACHE" = "--with-npm-cache" ]; then
  info "Bundling npm cache for offline installs (server + client)..."
  rm -rf npm-offline-cache && mkdir -p npm-offline-cache
  docker run --rm -v "$TMP:/app" -v "$PWD/npm-offline-cache:/cache" -w /app node:20-alpine \
    sh -c 'npm ci --ignore-scripts --no-audit --no-fund --cache /cache >/dev/null'

  CTMP="$(mktemp -d)"
  cp client/package.json client/package-lock.json "$CTMP/"
  docker run --rm -v "$CTMP:/app" -v "$PWD/npm-offline-cache:/cache" -w /app node:20-alpine \
    sh -c 'npm ci --ignore-scripts --no-audit --no-fund --cache /cache >/dev/null'
  docker run --rm -v "$CTMP:/app" alpine chown -R "$(id -u):$(id -g)" /app >/dev/null 2>&1 || true
  rm -rf "$CTMP"

  # fix ownership of the cache dir (container ran as root)
  docker run --rm -v "$PWD/npm-offline-cache:/cache" alpine chown -R "$(id -u):$(id -g)" /cache >/dev/null 2>&1 || true

  tar czf npm-offline-cache.tar.gz -C npm-offline-cache .
  rm -rf npm-offline-cache
  ok "npm cache bundle: $(du -h npm-offline-cache.tar.gz | cut -f1)"
fi

echo ""
ok "Done. Ship to the air-gapped side:"
ok "  • base images — already in your GitLab registry (engines baked in)"
[ -f npm-offline-cache.tar.gz ] && ok "  • npm-offline-cache.tar.gz — copy to the airgap Docker host"
