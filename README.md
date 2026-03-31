# Recruitment Quiz System

A complete local-first web application for internal recruitment quiz/testing during interviews. The system runs entirely offline with no external API dependencies.

## Production Readiness Notes

- Admin credentials and JWT configuration now come from environment variables. Do not deploy with the sample values from [`server/.env.example`](/home/tarek/Documents/GitHub/recruitment-quiz-system/server/.env.example).
- Candidate quiz flows now issue a signed session token when a session starts. Subsequent quiz actions require that token.
- The repository includes a local [`server/.env`](/home/tarek/Documents/GitHub/recruitment-quiz-system/server/.env) for development only. Replace those values before any shared or production deployment.

## Features

### Quiz Portal (Interviewee Interface)
- Access quiz by selecting name from candidate list (no tokens required)
- Session-based quizzes with global timer
- Sequential quiz completion within sessions
- Multiple question types: Multiple Choice, Short Answer, Code
- Distraction-free, modern interface
- Progress tracking and timer
- Answer auto-save

### Admin Portal
- Secure login with JWT authentication
- **Department Management**: Create, edit, delete departments
- **Position Management**: Create, edit, delete positions (within departments)
- **Candidate Management**: Create, edit, delete candidates with department/position
- **Session Management**: Create quiz sessions (groups of quizzes)
- **Question Bank**: Create, edit, delete questions with categories and difficulty levels
- **Results Dashboard**: View scores, completion times, detailed answers

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js + Express |
| **Database** | SQLite + Prisma ORM |
| **Authentication** | JWT (JSON Web Tokens) |
| **Frontend** | React + Vite |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **Routing** | React Router v6 |
| **State** | React hooks + Zustand (auth) |
| **Deployment** | Docker + Docker Compose |

## Quick Start (Docker - Recommended)

The easiest way to run this application is using Docker.

### Prerequisites
- Docker Engine (v20.10 or higher)
- Docker Compose (v2.0 or higher)

### Option 1: Development Mode (with hot reload)

```bash
# Clone or navigate to the project
cd recruitment-quiz-system

# Start all services in development mode
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

Access the application:
- **Client**: http://localhost:5173
- **Server API**: http://localhost:3001

**First time setup** - Database is automatically initialized on first run via `docker-compose.yml` command.

To reset the database:
```bash
docker-compose exec server npx prisma db seed
```

### Option 2: Production Mode

```bash
# Start in production mode
docker-compose -f docker-compose.prod.yml up -d

# Initialize database and seed data
docker-compose -f docker-compose.prod.yml exec server npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec server npx prisma db seed
```

Access the application:
- **Client**: http://localhost (port 80)
- **Server API**: http://localhost:3001/api

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f client

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# Rebuild after code changes
docker-compose up --build

# Shell into containers
docker-compose exec server sh
docker-compose exec client sh
```

## Quick Start (Without Docker)

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone or extract the project:
```bash
cd recruitment-quiz-system
```

2. Create the backend environment file:
```bash
cp server/.env.example server/.env
```

3. Install all dependencies:
```bash
npm run setup
```

This will:
- Install root dependencies
- Install server dependencies
- Install client dependencies
- Run database migrations
- Seed the database with sample questions

### Development

Run both server and client in development mode:
```bash
npm run dev
```

- Client: http://localhost:5173
- Server API: http://localhost:3001

### Production Build (Without Docker)

Build the client for production:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

The production build serves the static client files from the server on port 3001.

## Environment Variables

Backend values are loaded from `server/.env`.

```bash
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-me-before-deploying"
PORT=3001
```

## Default Credentials

**Admin Login:**
- Username: `admin`
- Password: value from `ADMIN_PASSWORD` in `server/.env`

## Project Structure

```
recruitment-quiz-system/
├── docker-compose.yml          # Development Docker Compose
├── docker-compose.prod.yml     # Production Docker Compose
├── package.json                # Root package.json with scripts
├── README.md                   # This file
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # System architecture details
│   ├── DEPLOYMENT.md           # Deployment guide
│   ├── AIRGAP_DEPLOY.md        # Offline deployment guide
│   └── TESTS.md                # Testing documentation
├── server/
│   ├── Dockerfile              # Production server image
│   ├── Dockerfile.dev          # Development server image
│   ├── package.json
│   ├── server.js              # Express server entry
│   ├── .env                   # Environment variables
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── candidates.js      # Candidate management
│   │   ├── departments.js     # Department management
│   │   ├── positions.js       # Position management
│   │   ├── questions.js       # Question bank
│   │   ├── quizzes.js         # Quiz configuration
│   │   ├── sessions.js        # Session management
│   │   ├── quiz-sessions.js   # Quiz taking flow
│   │   ├── grading.js         # Manual grading
│   │   └── dashboard.js       # Stats and results
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   └── prisma/
│       ├── schema.prisma      # Database schema
│       └── seed.js            # Sample data
└── client/
    ├── Dockerfile             # Production client image
    ├── Dockerfile.dev         # Development client image
    ├── nginx.conf             # Nginx configuration
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── public/
    │   └── fonts/            # Local font files
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── utils/
        │   └── api.js         # API client
        ├── hooks/
        │   └── useAuthStore.js
        ├── components/
        │   ├── layouts/
        │   ├── modals/
        │   └── quiz/          # Quiz-specific components
        └── pages/
            ├── admin/         # Admin portal pages
            └── quiz/          # Quiz interface pages
```

## Database Schema

### Models

**Admin**: System administrators
- id, username (unique), password (hashed), isDefaultPassword

**Department**: Organizational departments
- id, name (unique), createdAt, updatedAt

**Position**: Positions within departments (belongs to Department)
- id, name, departmentId, createdAt, updatedAt
- Unique constraint on (name, departmentId) to prevent duplicates

**Candidate**: Job candidates
- id, name, phoneNumber, email, departmentId, positionId, notes, createdAt, updatedAt
- Unique constraint on (name, phoneNumber) to prevent duplicates

**Session**: Quiz sessions (group of quizzes with time limit)
- id, name, description, timeLimit, createdAt, updatedAt

**Quiz**: Individual quizzes
- id, name, description, category, questionCount, createdAt, updatedAt

**SessionQuiz**: Junction table linking sessions to quizzes
- id, sessionId (FK), quizId (FK), order
- Unique constraint on (sessionId, quizId)

**Question**: Question bank
- id, questionText (unique), type, category, difficulty, codeSnippet, createdAt, updatedAt
- Unique constraint on questionText to prevent duplicates

**Choice**: Answer choices for multiple choice questions
- id, questionId (FK), choiceText, isCorrect

**CandidateSession**: Candidate's assigned sessions with progress
- id, candidateId (FK), sessionId (FK), currentQuizIndex, startedAt, completedAt, status, timeRemaining
- Unique constraint on (candidateId, sessionId)

**Answer**: Candidate answers
- id, candidateSessionId (FK), questionId (FK), selectedChoiceId, textAnswer, isCorrect, score, isGraded

## Sample Questions Included

The system comes pre-loaded with sample questions across various categories:

- **Linux**: File commands, permissions, process management
- **DevOps**: Docker, CI/CD, Kubernetes basics
- **Networking**: HTTP, DNS, TCP/UDP
- **Programming**: JavaScript, algorithms, data structures
- **Database**: SQL basics, joins
- **System Design**: Scaling, CAP theorem

## Testing

The project includes comprehensive testing suites for both frontend and backend:

### Test Coverage

- **Backend**: Jest + Supertest for API endpoint testing
- **Frontend**: Vitest + React Testing Library for component testing
- **CI/CD**: GitHub Actions workflow for automated testing

### Running Tests

```bash
# Run all tests
npm test

# Run server tests only
npm run test:server

# Run client tests only
npm run test:client

# Run tests in watch mode
npm run test:watch
```

### API Documentation

Interactive API documentation is available at:
```
http://localhost:3001/api-docs
```

See [TESTS.md](TESTS.md) for detailed testing documentation.

## Usage Guide

### For Interview Managers

1. **Login** to the admin portal at `/admin/login`
2. **Create a candidate** in the Candidates section
3. **Generate a quiz** for the candidate:
   - Select number of questions
   - Choose categories
   - Set time limit
4. **Share the quiz link** with the candidate
5. **Monitor results** in the Results section

### For Interviewees

1. Receive quiz link from interviewer
2. Access the quiz at `/quiz?token=YOUR_TOKEN`
3. Complete all questions
4. Submit when finished
5. View immediate score feedback

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Quiz tokens expire after 7 days
- Tab switching detection
- Answers auto-saved to prevent data loss
- Correct answers hidden from quiz interface

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-this-in-production"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"
PORT=3001
```

For production Docker deployments, set these in `docker-compose.prod.yml` or use a `.env` file.

## Customization

### Adding More Questions

Edit `server/prisma/seed.js` and add more questions to the `questions` array, then run:
```bash
# With Docker
docker-compose exec server npx prisma db seed

# Without Docker
cd server
npx prisma db seed
```

Or use the admin portal to add questions via the UI.

### Changing Quiz Settings

Default quiz settings can be modified in:
- `GenerateQuizModal.jsx` - Default question count and time limit
- `quizInterface.jsx` - Anti-cheating thresholds

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker-compose logs server
docker-compose logs client

# Rebuild from scratch
docker-compose down -v
docker-compose up --build
```

**Database migration issues:**
```bash
# Reset database (WARNING: deletes all data)
docker-compose exec server npx prisma migrate reset --force

# Or deploy migrations only
docker-compose exec server npx prisma migrate deploy
```

**Port conflicts:**
Edit `docker-compose.yml` or `docker-compose.prod.yml` to change port mappings:
```yaml
ports:
  - "8080:3001"  # Change 8080 to your preferred port
```

### Without Docker

**Database issues:**
```bash
cd server
npx prisma migrate reset
```

**Port conflicts:**
Change the PORT in `server/.env` and update the proxy in `client/vite.config.js`

**Build errors:**
Make sure all dependencies are installed:
```bash
npm run install:all
```

## License

MIT

## Support

For issues or questions, please refer to the project documentation or contact the development team.
