# Air-gapped build & deploy (GitLab-only)

Goal: build and run the Recruitment Quiz System **entirely on an air-gapped
local network** — no internet at any step. The build itself happens on your
internal GitLab runner; nothing is pre-built and shipped as a black box.

## What a build needs from the internet, and how each is made local

| Input | Internet source | Local replacement |
|-------|----------------|-------------------|
| Base images (`node:20-alpine`, `nginx:alpine`) | Docker Hub | Retagged into your GitLab registry as `<REGISTRY>/base/*` (prep.sh) |
| `apk add openssl` (server) | dl-cdn.alpinelinux.org | Pre-baked into `base/node:20-openssl` — the `apk` line is gone from the Dockerfile |
| npm packages (`npm ci`) | registry.npmjs.org | Local Verdaccio proxy at `http://verdaccio.local:4873/` |
| Prisma engine binaries | binaries.prisma.sh (downloaded by a `postinstall` script — **not** via npm) | Baked into `base/node:20-openssl` at `/opt/prisma-engines/` with `PRISMA_*_BINARY` env vars (prep.sh) — nothing heavy in the repo |
| `prisma` CLI at container start | (npx would download it — latent bug) | Fixed: the airgap Dockerfile deliberately skips `npm prune --omit=dev` so the CLI ships in the image |

## Files

| File | Purpose |
|------|---------|
| `airgap/prep.sh` | **Connected machine**: downloads Prisma engines, bakes them + openssl into `base/node:20-openssl`, pushes all base images to the registry, optional npm-cache bundle |
| `airgap/server.Dockerfile` | Offline server image (context = repo root) |
| `airgap/client.Dockerfile` | Offline client image (context = repo root) |
| `airgap/setup-verdaccio.sh` | **Air-gap host**: starts Verdaccio from your registry |
| `.gitlab-ci.yml` | test → build → push → deploy on the internal GitLab |
| `docker-compose.airgap.yml` | Deploys the locally-tagged images (ports 3001 + 80) |
| `.dockerignore` | Keeps `.env.deploy`, node_modules, etc. out of build contexts |

## One-time setup

### 1. Connected machine — `airgap/prep.sh`

```bash
REGISTRY=gitlab.local:5050 TOKEN=<gitlab-pat-with-write_registry> bash airgap/prep.sh
```

Downloads the Prisma engines for the lockfile, builds `base/node:20-openssl`
with them baked in (`/opt/prisma-engines/` + `PRISMA_*_BINARY` env vars), and
pushes `base/node:20-alpine`, `base/node:20-openssl`, `base/nginx:alpine`,
`base/verdaccio:5` to your registry. **Nothing heavy gets committed to the
repo** — the engines live only in the base image.

### 2. Push the repo to your internal GitLab

```bash
git remote add airgap git@gitlab.local:tarek/recruitment-quiz-system.git
git push airgap master
```

### 3. Register the runner (shell executor, no dind, nothing else to mirror)

On the air-gap Docker host:

```bash
sudo gitlab-runner register \
  --url http://gitlab.local \
  --registration-token <token> \
  --executor shell \
  --tag-list airgap-docker
sudo usermod -aG docker gitlab-runner
sudo systemctl restart gitlab-runner
```

### 4. Verdaccio on the air-gap host

```bash
REGISTRY=gitlab.local:5050 bash airgap/setup-verdaccio.sh
```

**Seeding** — the first build must find every package cached. Either:

- **(a) Temporary bridge:** run Verdaccio on the connected side, `npm ci`
  against it once for `server/` and `client/` (it proxies + caches), stop it,
  copy the `verdaccio-data` volume to the air-gap host.
- **(b) npm cache bundle:** `prep.sh --with-npm-cache` produces
  `npm-offline-cache.tar.gz`; on the air-gap host, `tar xzf` it into e.g.
  `/opt/npm-cache` and set CI variable `NPM_OFFLINE_CACHE=/opt/npm-cache`,
  then change the Dockerfile `npm ci` lines to `npm ci --offline --cache "$NPM_OFFLINE_CACHE"`.

### 5. GitLab project CI/CD variables

| Variable | Example | Notes |
|----------|---------|-------|
| `NPM_REGISTRY` | `http://verdaccio.local:4873/` | Default in `.gitlab-ci.yml` already |
| `JWT_SECRET`, `ADMIN_PASSWORD` | (your values) | Only needed if you don't use `.env.deploy` on the host |

`CI_REGISTRY*` are injected automatically by GitLab.

### 6. Run the pipeline

Push to `master`. The pipeline: tests → build both images → push to the
project registry → deploy on the runner host (`docker-compose.airgap.yml`),
then run migrations inside the container. App at `http://<host>/`.

## Updating dependencies later

- **npm deps:** nothing to do — Verdaccio serves the cache; new packages are
  only unavailable if they were never fetched (re-seed for brand-new deps).
- **Prisma version bump:** re-run `prep.sh` on the connected machine — it
  rebuilds `base/node:20-openssl` with the new engines and pushes it. The app
  Dockerfiles need no changes (they inherit the env vars from the base image).
  The base image and the app lockfile must be updated together.

## Gotchas

- `docker-compose.airgap.yml` deploys to the **runner host**. For a separate
  deploy host, add an SSH step or register a second runner there and use tags.
- Port 80/3001 must be free on the air-gap host.
- `.env.deploy` is created from `.env.deploy.example` by the deploy job if
  missing — set real `JWT_SECRET` / `ADMIN_PASSWORD` / `CORS_ORIGIN` before
  first real use.
- Airgap Dockerfiles use the repo root as build context — `.dockerignore` at
  the root keeps secrets and `node_modules` out of the image.
