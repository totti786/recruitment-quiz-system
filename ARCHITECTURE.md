# Recruitment Quiz System - Architecture & Tech Stack

## Overview

A local-first recruitment quiz and testing system for interviews. The application runs entirely offline with no external API dependencies, making it suitable for internal corporate environments.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                             │
│                     http://localhost:5173                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Server (Node.js)                            │
│                     http://localhost:3001                        │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐  │
│  │   Routes     │ Controllers  │ Middleware   │   Prisma    │  │
│  │  /api/*      │  Business    │  Auth/JWT    │    ORM      │  │
│  └──────────────┴──────────────┴──────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQLite
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Database (SQLite)                             │
│                    prisma/dev.db                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Server Communication

- **Frontend**: React SPA served by Vite dev server (development) or Nginx (production)
- **Backend API**: Express.js REST API
- **Authentication**: JWT tokens with 24h expiry
- **State Management**: React hooks + Zustand for auth state

---

## Tech Stack

### Frontend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | React | 18.x | UI library |
| Build Tool | Vite | 5.x | Fast dev server & bundler |
| Routing | React Router | 6.x | Client-side routing |
| State | Zustand | 4.x | Lightweight auth state |
| HTTP Client | Fetch API | Native | API communication |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Icons | Lucide React | Latest | Icon library |
| Testing | Vitest | Latest | Unit testing |

### Backend

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Node.js | 20.x | JavaScript runtime |
| Framework | Express.js | 4.x | Web framework |
| ORM | Prisma | 5.x | Database ORM |
| Database | SQLite | 3.x | Embedded database |
| Auth | JWT (jsonwebtoken) | 9.x | Token-based auth |
| Validation | express-validator | 6.x | Request validation |
| Password Hashing | bcryptjs | 2.x | Secure passwords |
| Documentation | swagger | - | API docs |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| Containerization | Docker | Consistent environments |
| Orchestration | Docker Compose | Multi-container setup |
| Database Migrations | Prisma Migrate | Schema versioning |

---

## Project Structure

```
recruitment-quiz-system/
├── docker-compose.yml          # Development orchestration
├── docker-compose.prod.yml     # Production orchestration
├── package.json                # Root scripts
│
├── server/                    # Backend application
│   ├── server.js              # Express entry point
│   ├── routes/                # API route handlers
│   │   ├── auth.js            # Login/change-password
│   │   ├── candidates.js      # Candidate CRUD
│   │   ├── departments.js     # Department CRUD
│   │   ├── positions.js       # Position CRUD
│   │   ├── questions.js       # Question bank CRUD
│   │   ├── quizzes.js         # Quiz configuration
│   │   ├── sessions.js        # Session management
│   │   ├── quiz-sessions.js   # Quiz taking flow
│   │   ├── grading.js         # Manual grading
│   │   └── dashboard.js       # Statistics
│   ├── middleware/            # Express middleware
│   │   └── auth.js            # JWT verification
│   ├── lib/                   # Shared libraries
│   │   ├── prisma.js          # Prisma client
│   │   └── http.js            # HTTP utilities
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.js            # Sample data
│   │   └── dev.db             # SQLite database
│   └── uploads/                # File uploads directory
│
└── client/                    # Frontend application
    ├── vite.config.js         # Vite configuration
    ├── tailwind.config.js     # Tailwind configuration
    ├── index.html              # HTML entry
    └── src/
        ├── main.jsx           # React entry
        ├── App.jsx            # Root component
        ├── index.css           # Global styles
        ├── utils/
        │   └── api.js         # API client
        ├── hooks/
        │   └── useAuthStore.js # Auth state
        ├── components/
        │   ├── layouts/       # Layout components
        │   ├── modals/        # Modal dialogs
        │   └── quiz/          # Quiz components
        └── pages/
            ├── admin/         # Admin portal
            └── quiz/          # Quiz interface
```

---

## Data Model

```
Admin
├── id (PK)
├── username (unique)
├── password (hashed)
└── isDefaultPassword

Department
├── id (PK)
├── name (unique)
└── positions (1:N)

Position
├── id (PK)
├── name
├── departmentId (FK)
└── candidates (1:N)

Candidate
├── id (PK)
├── name
├── phoneNumber
├── email
├── departmentId (FK)
├── positionId (FK)
└── sessions (1:N)

Session
├── id (PK)
├── name
├── description
├── timeLimit (minutes)
└── quizzes (N:N via SessionQuiz)

Quiz
├── id (PK)
├── name
├── description
├── category
└── questionCount

Question
├── id (PK)
├── questionText (unique)
├── type (MULTIPLE_CHOICE | SHORT_ANSWER | CODE)
├── category
├── difficulty (EASY | MEDIUM | HARD)
└── choices (1:N)

Choice
├── id (PK)
├── questionId (FK)
├── choiceText
└── isCorrect

CandidateSession
├── id (PK)
├── candidateId (FK)
├── sessionId (FK)
├── currentQuizIndex
├── status (ACTIVE | COMPLETED)
├── timeRemaining
└── answers (1:N)

Answer
├── id (PK)
├── candidateSessionId (FK)
├── questionId (FK)
├── selectedChoiceId (FK, nullable)
├── textAnswer (nullable)
├── isCorrect
└── score (manual grading)
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/change-password` - Change password

### Admin Resources (requires JWT)
- `GET/POST /api/departments` - List/create departments
- `GET/PUT/DELETE /api/departments/:id` - Department CRUD
- `GET/POST /api/positions` - List/create positions
- `GET/PUT/DELETE /api/positions/:id` - Position CRUD
- `GET/POST /api/candidates` - List/create candidates
- `GET/PUT/DELETE /api/candidates/:id` - Candidate CRUD
- `POST /api/candidates/:id/assign-session` - Assign quiz session
- `GET/POST /api/questions` - List/create questions
- `GET/PUT/DELETE /api/questions/:id` - Question CRUD
- `GET/POST /api/sessions` - List/create sessions
- `GET/PUT/DELETE /api/sessions/:id` - Session CRUD
- `GET /api/dashboard/stats` - Dashboard statistics

### Quiz (requires session token)
- `GET /api/quiz-sessions/:id/quiz/:index` - Get quiz questions
- `POST /api/quiz-sessions/:id/answer` - Submit answer
- `POST /api/quiz-sessions/:id/next` - Move to next quiz
- `POST /api/quiz-sessions/:id/submit` - Submit session

### Grading (requires JWT)
- `GET /api/grading/pending` - List pending grading
- `POST /api/grading/:answerId` - Grade answer

---

## Security

### Authentication
- JWT tokens with 24h expiry
- Tokens signed with `JWT_SECRET` environment variable
- Admin credentials hashed with bcrypt (10 salt rounds)

### Authorization
- Protected routes require valid JWT in `Authorization: Bearer <token>` header
- Session tokens issued to candidates for quiz access

### Data Protection
- Passwords never stored in plain text
- Unique constraints prevent duplicate entries
- Input validation on all API endpoints
- CORS configured for local development

---

## Key Features

### Quiz Portal (Candidate Interface)
- Access quiz by selecting name from candidate list
- Session-based quizzes with global timer
- Sequential quiz completion within sessions
- Multiple question types support
- Progress tracking and timer
- Answer auto-save

### Admin Portal
- Secure JWT authentication
- CRUD for departments, positions, candidates
- Question bank with categories and difficulty
- Session and quiz configuration
- Results dashboard with statistics
- Manual grading for written/code questions

### Anti-Cheat Measures
- Tab switch detection (logged for reviewer attention)
- Select text disabled during quiz
- Timer-based submission

---

## Development Workflow

### Running Locally (Docker)
```bash
docker-compose up --build
```

### Running Without Docker
```bash
npm run setup    # Install deps + migrations + seed
npm run dev      # Start server + client
```

### Database Operations
```bash
# Reset database
docker-compose exec server npx prisma migrate reset

# Seed data
docker-compose exec server npx prisma db seed

# View database
docker-compose exec server npx prisma studio
```

---

## Environment Variables

### Server (.env)
```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="your-secret-key"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password"
PORT=3001
```

### Client (.env)
```env
VITE_API_URL=/api
VITE_API_TARGET=http://localhost:3001
```
