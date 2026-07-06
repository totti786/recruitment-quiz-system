#!/bin/bash
# =============================================================================
# Recruitment Quiz System — Air-Gapped Deployment Bundle
# =============================================================================
# This single file contains everything needed to deploy the Recruitment Quiz
# System on a machine with NO internet access.
#
# APPROACH: Docker images are PRE-BUILT on the internet-connected machine
# because `npm ci` (run inside Dockerfiles) requires internet. The built
# images are saved as tarballs and loaded directly on the air-gapped side.
#
# USAGE (on the internet-connected machine first):
#   1. Run:  bash AIRGAP-DEPLOY.sh export
#      → Builds Docker images, saves them + source into quiz-airgap-bundle.tar.gz
#      → Copy that tarball + THIS FILE to the air-gapped machine.
#
# USAGE (on the air-gapped machine):
#   1. Copy quiz-airgap-bundle.tar.gz and this script to the target machine
#   2. Run:  bash AIRGAP-DEPLOY.sh import
#      → Loads pre-built Docker images from the bundle
#   3. Run:  bash AIRGAP-DEPLOY.sh deploy
#      → Starts the system (no build needed — images pre-loaded)
#   4. Run:  bash AIRGAP-DEPLOY.sh seed
#      → Seeds the database with sample data (optional)
#
# PREREQUISITES (air-gapped machine):
#   - Docker Engine 24+
#   - Docker Compose v2 (docker compose plugin)
#   - bash, tar, gzip
#   - At least 2 GB free disk space
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")/recruitment-quiz-system"
BUNDLE_NAME="quiz-airgap-bundle"
BUNDLE_FILE="${BUNDLE_NAME}.tar.gz"

# ---- Docker images required (application images, built during export) ----
APP_IMAGES=(
  "recruitment-quiz-server:latest"
  "recruitment-quiz-client:latest"
)

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[x]${NC} $1"; }
info() { echo -e "${CYAN}[i]${NC} $1"; }

# =============================================================================
# EXPORT — Run on the internet-connected machine
# =============================================================================
do_export() {
  log "Exporting Recruitment Quiz System for air-gapped deployment..."
  echo ""

  # -- Step 1: Build Docker images --
  log "Step 1/4: Building Docker images (this runs npm ci — needs internet)..."
  cd "${SCRIPT_DIR}"

  # Build both images using the standalone prod compose file
  COMPOSE_FILE="docker-compose.prod.yml"
  info "Building with: ${COMPOSE_FILE}"
  docker compose -f "$COMPOSE_FILE" build --no-cache
  echo ""

  # -- Step 2: Save built images to tarball --
  log "Step 2/4: Saving built images to images.tar ..."
  docker save "${APP_IMAGES[@]}" > "${SCRIPT_DIR}/images.tar"
  IMG_SIZE=$(du -h "${SCRIPT_DIR}/images.tar" | cut -f1)
  info "Images size: ${IMG_SIZE}"

  # Verify images exist
  for img in "${APP_IMAGES[@]}"; do
    if docker image inspect "$img" &>/dev/null; then
      info "  ✓ $img built"
    else
      err "  ✗ $img — build failed!"
      exit 1
    fi
  done
  echo ""

  # -- Step 3: Package source --
  log "Step 3/4: Packaging source code..."
  TMPDIR=$(mktemp -d)
  trap "rm -rf $TMPDIR" EXIT

  # Copy source (excluding build artifacts, node_modules, git)
  rsync -a --exclude='node_modules' --exclude='dist' --exclude='.git' \
    --exclude='*.tar' --exclude='*.tar.gz' \
    "${SCRIPT_DIR}/" "${TMPDIR}/repo/"

  # Move images tarball next to repo
  mv "${SCRIPT_DIR}/images.tar" "${TMPDIR}/"

  log "Step 4/4: Compressing final bundle..."
  cd "${TMPDIR}"
  tar czf "${SCRIPT_DIR}/${BUNDLE_FILE}" repo/ images.tar
  cd "${SCRIPT_DIR}"
  rm -rf "${TMPDIR}"

  FINAL_SIZE=$(du -h "${SCRIPT_DIR}/${BUNDLE_FILE}" | cut -f1)
  echo ""
  log "============================================"
  log "  Export complete!"
  log "  Bundle: ${SCRIPT_DIR}/${BUNDLE_FILE}"
  log "  Size:   ${FINAL_SIZE}"
  log ""
  log "  Copy these to the air-gapped machine:"
  log "    1. ${BUNDLE_FILE}"
  log "    2. This script (AIRGAP-DEPLOY.sh)"
  log ""
  log "  Bundle contents:"
  log "    • Pre-built Docker images (server + client)"
  log "    • Full source code (for config / updates)"
  log "============================================"
}

# =============================================================================
# IMPORT — Run on the air-gapped machine
# =============================================================================
do_import() {
  log "Importing Docker images into air-gapped machine..."

  BUNDLE_PATH="${SCRIPT_DIR}/${BUNDLE_FILE}"
  if [ ! -f "${BUNDLE_PATH}" ]; then
    err "Bundle file '${BUNDLE_FILE}' not found in ${SCRIPT_DIR}!"
    err "Place it in the same directory as this script and try again."
    exit 1
  fi

  # -- Extract the bundle --
  log "Extracting bundle..."
  cd "${SCRIPT_DIR}"
  tar xzf "${BUNDLE_FILE}"

  # -- Load Docker images --
  log "Loading Docker images..."
  if [ -f "${SCRIPT_DIR}/images.tar" ]; then
    docker load < "${SCRIPT_DIR}/images.tar"
    rm -f "${SCRIPT_DIR}/images.tar"
  else
    err "images.tar not found inside bundle!"
    exit 1
  fi

  # -- Verify images --
  log "Verifying loaded images..."
  for img in "${APP_IMAGES[@]}"; do
    if docker image inspect "$img" &>/dev/null; then
      info "  ✓ $img"
    else
      err "  ✗ $img — NOT FOUND"
      exit 1
    fi
  done

  echo ""
  log "============================================"
  log "  Import complete! All images loaded."
  log "  Next: bash AIRGAP-DEPLOY.sh deploy"
  log "============================================"
}

# =============================================================================
# DEPLOY — Build and start on air-gapped machine
# =============================================================================
do_deploy() {
  REPO_DIR_LOCAL="${SCRIPT_DIR}/repo"
  if [ ! -d "$REPO_DIR_LOCAL" ]; then
    err "Source directory '$REPO_DIR_LOCAL' not found!"
    err "Run 'bash AIRGAP-DEPLOY.sh import' first (from the same directory)."
    exit 1
  fi

  log "Deploying Recruitment Quiz System..."
  log "(Images pre-built — no internet needed)"

  cd "$REPO_DIR_LOCAL"

  # -- Verify Docker --
  if ! docker info &>/dev/null; then
    err "Docker is not running. Start Docker first."
    exit 1
  fi

  # -- Verify images are loaded --
  for img in "${APP_IMAGES[@]}"; do
    if ! docker image inspect "$img" &>/dev/null; then
      err "Image '$img' not found. Run 'bash AIRGAP-DEPLOY.sh import' first."
      exit 1
    fi
  done

  # -- Create env file if not present --
  if [ ! -f ".env.deploy" ]; then
    warn "No .env.deploy found. Creating one with defaults..."
    cat > .env.deploy << 'ENVEOF'
NODE_ENV=production
JWT_SECRET=change-this-to-a-random-64-char-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-now
PORT=3001
DATABASE_URL=file:./prisma/prod.db
ENVEOF
    warn "EDIT .env.deploy NOW to set secure credentials, then re-run deploy."
    warn "At minimum change: JWT_SECRET and ADMIN_PASSWORD"
    echo ""
    read -rp "Press Enter after editing .env.deploy (or Ctrl+C to abort)..."
  fi

  # -- Choose compose file: use deploy (Traefik) only if edge network exists --
  if [ -f "docker-compose.deploy.yml" ] && docker network inspect edge &>/dev/null; then
    COMPOSE_FILE="docker-compose.deploy.yml"
    info "Using deploy compose file (Traefik-managed, edge network found)"
  else
    COMPOSE_FILE="docker-compose.prod.yml"
    if [ -f "docker-compose.deploy.yml" ]; then
      warn "docker-compose.deploy.yml exists but 'edge' network not found."
      warn "Falling back to standalone production compose (localhost:80)."
    else
      info "Using standalone production compose file (localhost:80)"
    fi
  fi

  log "Starting services (no build — images pre-loaded)..."
  docker compose -f "$COMPOSE_FILE" up -d

  echo ""
  log "============================================"
  log "  Deploy complete!"
  log ""
  if [ "$COMPOSE_FILE" = "docker-compose.prod.yml" ]; then
    log "  Client:  http://localhost"
    log "  Server:  http://localhost:3001"
    log "  API:     http://localhost:3001/api"
  else
    log "  Access via https://quiz.deshli.site"
  fi
  log ""
  log "  Admin login:"
  log "    Username: admin"
  log "    Password: (from .env.deploy)"
  log ""
  log "  Next: bash AIRGAP-DEPLOY.sh seed   (optional — sample data)"
  log "  Logs: docker compose -f $COMPOSE_FILE logs -f"
  log "============================================"
}

# =============================================================================
# SEED — Populate database with sample data
# =============================================================================
do_seed() {
  REPO_DIR_LOCAL="${SCRIPT_DIR}/repo"
  if [ ! -d "$REPO_DIR_LOCAL" ]; then
    err "Source directory '$REPO_DIR_LOCAL' not found!"
    exit 1
  fi
  cd "$REPO_DIR_LOCAL"

  COMPOSE_FILE="docker-compose.prod.yml"
  [ -f "docker-compose.deploy.yml" ] && docker network inspect edge &>/dev/null && COMPOSE_FILE="docker-compose.deploy.yml"

  log "Running database migrations..."
  docker compose -f "$COMPOSE_FILE" exec server npx prisma migrate deploy

  log "Seeding database with sample data..."
  docker compose -f "$COMPOSE_FILE" exec server npx prisma db seed

  log "Seed complete! Sample departments, positions, questions loaded."
}

# =============================================================================
# STATUS — Check running state
# =============================================================================
do_status() {
  REPO_DIR_LOCAL="${SCRIPT_DIR}/repo"
  [ ! -d "$REPO_DIR_LOCAL" ] && { err "No repo/ directory found."; exit 1; }
  cd "$REPO_DIR_LOCAL"

  COMPOSE_FILE="docker-compose.prod.yml"
  [ -f "docker-compose.deploy.yml" ] && docker network inspect edge &>/dev/null && COMPOSE_FILE="docker-compose.deploy.yml"

  echo ""
  info "Container status:"
  docker compose -f "$COMPOSE_FILE" ps

  echo ""
  info "Server health:"
  curl -sf http://localhost:3001/api/health 2>/dev/null && echo "" || warn "Server not reachable (may need a moment)"
}

# =============================================================================
# STOP — Bring everything down
# =============================================================================
do_stop() {
  REPO_DIR_LOCAL="${SCRIPT_DIR}/repo"
  [ ! -d "$REPO_DIR_LOCAL" ] && { err "No repo/ directory found."; exit 1; }
  cd "$REPO_DIR_LOCAL"

  COMPOSE_FILE="docker-compose.prod.yml"
  [ -f "docker-compose.deploy.yml" ] && docker network inspect edge &>/dev/null && COMPOSE_FILE="docker-compose.deploy.yml"

  log "Stopping all services..."
  docker compose -f "$COMPOSE_FILE" down
  log "All stopped."
}

# =============================================================================
# INFO — Print what's in the bundle
# =============================================================================
do_info() {
  echo ""
  echo "============================================"
  echo "  Recruitment Quiz System — Air-Gap Bundle"
  echo "============================================"
  echo ""
  echo "DOCKER IMAGES (pre-built in bundle):"
  for img in "${APP_IMAGES[@]}"; do
    echo "  • $img"
  done
  echo ""
  echo "BASE IMAGES (included in layers):"
  echo "  • node:20-alpine"
  echo "  • nginx:alpine"
  echo ""
  echo "ARCHITECTURE:"
  echo "  ┌──────────┐     ┌──────────┐"
  echo "  │  nginx   │────▶│  Node.js │"
  echo "  │  :80     │     │  :3001   │"
  echo "  │ (client) │     │ (server) │"
  echo "  └──────────┘     └────┬─────┘"
  echo "                        │"
  echo "                   SQLite (file)"
  echo "                   /app/prisma/prod.db"
  echo ""
  echo "TECH STACK:"
  echo "  • Frontend: React 18 + Vite + TailwindCSS + Recharts"
  echo "  • Backend:  Express 4 + Prisma ORM + SQLite"
  echo "  • Auth:     JWT + bcryptjs"
  echo "  • Proxy:    nginx (SPA routing + /api reverse proxy)"
  echo ""
  echo "DATA PERSISTENCE:"
  echo "  • Database: Docker volume 'server-data' → /app/prisma/"
  echo "  • Uploads:  Docker volume 'server-uploads' → /app/uploads/"
  echo ""
  echo "REQUIRED ON AIR-GAPPED MACHINE:"
  echo "  • Docker Engine 24+"
  echo "  • Docker Compose v2"
  echo "  • bash, tar, gzip"
  echo "  • ~2 GB free disk space"
  echo ""
  echo "COMMANDS:"
  echo "  export   — (internet machine) pull images + create bundle"
  echo "  import   — (air-gapped) load images from bundle"
  echo "  deploy   — (air-gapped) build + start the system"
  echo "  seed     — (air-gapped) seed sample data"
  echo "  status   — (air-gapped) check running state"
  echo "  stop     — (air-gapped) stop all services"
  echo "  info     — show this info"
  echo ""
}

# =============================================================================
# MAIN
# =============================================================================
case "${1:-info}" in
  export)  do_export ;;
  import)  do_import ;;
  deploy)  do_deploy ;;
  seed)    do_seed ;;
  status)  do_status ;;
  stop)    do_stop ;;
  info|-h|--help|help) do_info ;;
  *)
    err "Unknown command: $1"
    echo "Usage: bash AIRGAP-DEPLOY.sh {export|import|deploy|seed|status|stop|info}"
    exit 1
    ;;
esac
