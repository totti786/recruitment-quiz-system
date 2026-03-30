# Deployment Guide

This guide covers two deployment methods for the Recruitment Quiz System:
1. **Docker Deployment** (Recommended) - Easier setup with containerization
2. **Manual Deployment** - Traditional deployment without Docker

## Prerequisites

### Common Requirements
- Node.js 20.x or higher
- Git

### Docker Deployment Only
- Docker 24.x or higher
- Docker Compose v2.x or higher

### Manual Deployment Only
- SQLite 3.x
- PM2 or similar process manager (for production)

---

## Method 1: Docker Deployment (Recommended)

Docker deployment is the easiest and most reliable method. It ensures consistent environments across development and production.

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd recruitment-quiz-system
   ```

2. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=file:./prisma/dev.db
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Start the application**
   ```bash
   # Production mode
   docker-compose -f docker-compose.prod.yml up -d
   
   # Or for development
   docker-compose up -d
   ```

4. **Initialize the database (first run only)**
   ```bash
   docker-compose exec server npx prisma migrate deploy
   docker-compose exec server npx prisma db seed
   ```

5. **Access the application**
   - Admin Panel: http://localhost:5173
   - API: http://localhost:3001
   - Default credentials: `admin` / `admin123` (change on first login)

### Production Deployment

For production environments, use the production Docker Compose file:

```bash
# Production build with optimized images
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Update to latest version
docker-compose pull
docker-compose up -d
```

### Docker Commands Reference

```bash
# View running containers
docker-compose ps

# Restart services
docker-compose restart

# Update database schema
docker-compose exec server npx prisma migrate deploy

# Access server shell
docker-compose exec server sh

# Backup database
docker-compose exec server sqlite3 /app/prisma/dev.db ".backup /app/prisma/dev.db.backup"

# View logs
docker-compose logs -f
```

---

## Method 2: Manual Deployment (Without Docker)

Manual deployment gives you more control but requires more setup steps.

### Prerequisites

1. **Install Node.js 20.x**
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   nvm use 20
   ```

2. **Install SQLite**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install sqlite3

   # macOS
   brew install sqlite
   ```

### Server Setup

1. **Clone and setup**
   ```bash
   git clone <your-repo-url>
   cd recruitment-quiz-system/server
   npm install
   npx prisma generate
   ```

2. **Environment configuration**
   
   Create `.env` file in the server directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=file:./prisma/dev.db
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Database setup**
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode with PM2
   npm install -g pm2
   pm2 start server.js --name recruitment-quiz-server
   pm2 save
   pm2 startup
   ```

### Client Setup

1. **Navigate to client directory**
   ```bash
   cd ../client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build for production**
   ```bash
   npm run build
   ```

4. **Serve the built files**
   ```bash
   npm install -g serve
   serve -s dist -l 5173
   ```

---

## Database Management

### Backing Up Data

**Docker:**
```bash
docker-compose exec server sqlite3 /app/prisma/dev.db ".backup /app/prisma/dev.db.backup"
docker cp quiz-server-dev:/app/prisma/dev.db.backup ./backup.db
```

**Manual:**
```bash
cd server
sqlite3 prisma/dev.db ".backup prisma/dev.db.backup"
```

### Restoring Data

**Docker:**
```bash
docker cp ./backup.db quiz-server-dev:/app/prisma/dev.db
docker-compose restart server
```

**Manual:**
```bash
cd server
cp prisma/dev.db.backup prisma/dev.db
```

---

## Environment Variables

### Server
- `JWT_SECRET` - Secret key for JWT tokens (required)
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - Database connection string
- `CORS_ORIGIN` - Allowed CORS origin

### Client
- `VITE_API_URL` - API base URL (default: /api)
- `VITE_API_TARGET` - API server URL for proxy

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001
# Kill the process
kill -9 <PID>
```

### Database Permission Issues (Docker)
```bash
docker-compose down -v
docker-compose up -d
```

### Schema Out of Sync
```bash
# Docker
docker-compose exec server npx prisma db push --accept-data-loss

# Manual
cd server
npx prisma db push --accept-data-loss
```
