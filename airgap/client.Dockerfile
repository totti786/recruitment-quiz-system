# =============================================================================
# Recruitment Quiz System — client image, built FULLY OFFLINE.
#   • base image  → <BASE_REGISTRY>/base/node:20-alpine   (pre-pushed by prep.sh)
#   • npm deps    → <NPM_REGISTRY>                        (Verdaccio proxy)
#
# Build from the REPO ROOT (context = .):
#   docker build -f airgap/client.Dockerfile \
#     --build-arg BASE_REGISTRY=<gitlab-registry> \
#     --build-arg NPM_REGISTRY=http://verdaccio.local:4873/ \
#     -t <gitlab-registry>/<project>/client:latest .
# =============================================================================
ARG BASE_REGISTRY=registry.gitlab.local
ARG NPM_REGISTRY=http://verdaccio.local:4873/

FROM ${BASE_REGISTRY}/base/node:20-alpine AS builder
ARG NPM_REGISTRY
WORKDIR /app

ENV npm_config_registry=${NPM_REGISTRY}
COPY client/package*.json ./
RUN npm ci --ignore-scripts

COPY client/ ./
RUN npm run build

FROM ${BASE_REGISTRY}/base/nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
