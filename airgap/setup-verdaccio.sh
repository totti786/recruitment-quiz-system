#!/usr/bin/env bash
# =============================================================================
# setup-verdaccio.sh — run ON THE AIR-GAPPED DOCKER HOST (one-time).
#
# Starts a local npm proxy/cache. `npm ci` in the build hits this instead of
# registry.npmjs.org. First build still needs the cache seeded — see
# airgap/README.md "Seeding Verdaccio" (two options).
#
# The image is pulled from your internal registry (pre-pushed by prep.sh as
# <REGISTRY>/base/verdaccio:5). Set REGISTRY if it differs from the default.
# =============================================================================
set -euo pipefail
REGISTRY="${REGISTRY:-registry.gitlab.local}"

docker volume create verdaccio-data >/dev/null 2>&1 || true
docker pull "$REGISTRY/base/verdaccio:5"
docker tag  "$REGISTRY/base/verdaccio:5" verdaccio/verdaccio:5

docker rm -f verdaccio >/dev/null 2>&1 || true
docker run -d --name verdaccio --restart unless-stopped \
  -p 4873:4873 \
  -v verdaccio-data:/verdaccio \
  verdaccio/verdaccio:5

echo ""
echo "Verdaccio up at http://$(hostname -I | awk '{print $1}'):4873/"
echo "Set NPM_REGISTRY accordingly in GitLab → Settings → CI/CD → Variables."
