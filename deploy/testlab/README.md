# Recruitment Quiz — testlab deployment

## Choose a target

| Pattern | Where | DB | When |
|---|---|---|---|
| **D (recommended)** | `control.testlab.local` Docker host (`/opt/quiz`) | `./data/quiz.db` on host volume | Single SQLite file — simplest, easy to backup |
| **K** | `k3s` pool (`quiz` namespace, PVC `local-path`) | `PersistentVolumeClaim` 5Gi | You need k8s scheduling; keep `replicas:1` |

## One-time setup

```bash
# secrets (on control or your workstation, never commit)
openssl rand -base64 32   # → JWT_SECRET
openssl rand -base64 18   # → ADMIN_PASSWORD
cp deploy/testlab/.env.production.example deploy/testlab/.env.production
# edit: JWT_SECRET, ADMIN_PASSWORD, CORS_ORIGIN

# push to control
scp deploy/testlab/.env.production root@control:/opt/quiz/.env.production
```

## Build + push (airgap)

```bash
# base image already in registry (library/node:20-alpine) — verified

# from repo root (internet machine or control with Docker)
docker build -t registry.testlab.local/recruitment-quiz:$(git rev-parse --short HEAD) .
docker push registry.testlab.local/recruitment-quiz:$(git rev-parse --short HEAD)
docker tag registry.testlab.local/recruitment-quiz:$(git rev-parse --short HEAD) registry.testlab.local/recruitment-quiz:latest
docker push registry.testlab.local/recruitment-quiz:latest
```

## Deploy Pattern D

```bash
scp deploy/testlab/docker-compose.yml root@control:/opt/quiz/
ssh root@control 'cd /opt/quiz && TAG=$(git rev-parse --short HEAD) docker compose up -d && curl -sf http://localhost:3001/api/health'
# expose: add traefik-route.yml snippet to proxy:/opt/traefik/config/dynamic/routes.yml → docker restart traefik
curl -k https://quiz.testlab.local/api/health
```

## Deploy Pattern K

```bash
kubectl apply -f deploy/testlab/k8s-deployment.yml
# edit secret with real JWT/ADMIN values first, or: kubectl -n quiz create secret generic quiz-env --from-env-file=deploy/testlab/.env.production
kubectl -n quiz rollout status deploy/quiz
curl -k https://quiz.testlab.local/api/health
```

## Backup

```bash
# Pattern D — add to ensure-backups.yml or a cron on control:
30 3 * * * tar czf /tmp/quiz-data-$(date +\%Y\%m\%d).tar.gz /opt/quiz/data && rsync -az /tmp/quiz-data-*.tar.gz -e "ssh -i /root/.ssh/backup_key" root@backup.testlab.local:/backups/quiz/
```

## Verify

```bash
curl -k https://quiz.testlab.local/api/health
curl -k https://quiz.testlab.local/api-docs
# blackbox: add https://quiz.testlab.local to prometheus.yml blackbox-http targets → alerts
```
