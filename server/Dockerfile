# Production Dockerfile for Server
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies required by Prisma/SQLite
RUN apk add --no-cache openssl

# Install dependencies deterministically
COPY package*.json ./
RUN npm ci

# Prisma client generation needs the schema present
COPY prisma ./prisma/
RUN npx prisma generate

# Remove devDependencies from the runtime dependency tree
RUN npm prune --omit=dev

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy production dependencies and generated Prisma client
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Keep the full app source, including tests and local DB files, as requested
COPY . .

RUN mkdir -p uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

CMD ["npm", "start"]
