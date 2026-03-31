# Air-Gapped Deployment Guide

This project can be deployed to an air-gapped server by building Docker images on a connected machine, transferring the image tarball and deployment files, then running them locally on the isolated host.

## 1. Build Images On A Connected Machine

From the repository root:

```bash
docker compose -f docker-compose.prod.yml build
docker save quiz-server-prod quiz-client-prod -o recruitment-quiz-images.tar
```

This produces:

- `quiz-server-prod`
- `quiz-client-prod`
- `recruitment-quiz-images.tar`

## 2. Prepare Runtime Environment

Create a runtime env file on the target server:

`/opt/recruitment-quiz/server.env`

Example:

```env
JWT_SECRET=replace-with-a-long-random-secret
PORT=3001
DATABASE_URL=file:./prod.db
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me
CORS_ORIGIN=https://quiz.example.internal
```

Notes:

- `CORS_ORIGIN` must be a full origin, not just a bare domain.
- Good example: `https://quiz.example.internal`
- Multiple origins can be comma-separated if needed.

## 3. Transfer Files To The Air-Gapped Server

Copy these to the target host:

- `recruitment-quiz-images.tar`
- `docker-compose.prod.yml`
- `AIRGAP_DEPLOY.md`

The compose file already expects:

```yaml
env_file:
  - /opt/recruitment-quiz/server.env
```

## 4. Load Images On The Target Server

```bash
docker load -i recruitment-quiz-images.tar
```

## 5. Use Image References Instead Of Build

On the target server, update `docker-compose.prod.yml` to use prebuilt images instead of `build:`.

Example:

```yaml
services:
  server:
    image: quiz-server-prod
  client:
    image: quiz-client-prod
```

This avoids any dependency or base-image pulls on the air-gapped server.

## 6. Start The Stack

```bash
docker compose -f docker-compose.prod.yml up -d
```

## 7. Initialize The Database

If the database is new:

```bash
docker compose -f docker-compose.prod.yml exec server npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec server npx prisma db seed
```

## 8. If You Need To Change Runtime Configuration

Do not edit `server.js` inside the running container unless it is an emergency.

Preferred flow:

1. update source locally
2. rebuild images
3. export/import images again
4. restart the stack

For normal runtime changes like CORS or credentials, edit:

`/opt/recruitment-quiz/server.env`

Then restart:

```bash
docker compose -f docker-compose.prod.yml up -d server
```

## 9. Image Size Notes

Current optimizations already applied:

- `npm ci` instead of `npm install`
- multi-stage server build
- production dependency pruning for server runtime
- `.dockerignore` files for client/server

Tests and local DB files are intentionally retained in the server image context.
