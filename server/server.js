import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import swaggerUi from 'swagger-ui-express'
import { readFileSync } from 'fs'
import { parseId } from './lib/http.js'
import { registerAuditMiddleware } from './lib/audit.js'

import authRoutes from './routes/auth.js'
import candidateRoutes from './routes/candidates.js'
import departmentRoutes from './routes/departments.js'
import positionRoutes from './routes/positions.js'
import questionRoutes from './routes/questions.js'
import quizRoutes from './routes/quizzes.js'
import sessionRoutes from './routes/sessions.js'
import quizSessionRoutes from './routes/quiz-sessions.js'
import dashboardRoutes from './routes/dashboard.js'
import gradingRoutes from './routes/grading.js'
import auditRoutes from './routes/audit.js'
import adminRoutes from './routes/admins.js'
import { errorHandler } from './middleware/errorHandler.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load Swagger document
const swaggerDocument = JSON.parse(readFileSync(path.join(__dirname, 'swagger.json'), 'utf8'))

dotenv.config()
registerAuditMiddleware()

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is required')
  process.exit(1)
}

export const app = express()
const PORT = process.env.PORT || 3001

const defaultAllowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost',
  'http://127.0.0.1',
])

const configuredOrigins = new Set(
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    if (configuredOrigins.size > 0) {
      return callback(
        configuredOrigins.has(origin) ? null : new Error('Origin not allowed by CORS'),
        configuredOrigins.has(origin)
      )
    }

    return callback(defaultAllowedOrigins.has(origin) ? null : new Error('Origin not allowed by CORS'), defaultAllowedOrigins.has(origin))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter limit for auth endpoints
  message: { error: 'Too many login attempts, please try again later.' },
})

app.use('/api/', limiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/change-password', authLimiter)

// Body parser
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Recruitment Quiz System API'
}))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/candidates', candidateRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/positions', positionRoutes)
app.use('/api/questions', questionRoutes)
app.use('/api/quizzes', quizRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/quiz-sessions', quizSessionRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/grading', gradingRoutes)
app.use('/api/audit', auditRoutes)
app.use('/api/admins', adminRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

app.param(['id', 'candidateId', 'candidateSessionId', 'sessionId', 'questionId', 'answerId', 'quizIndex'], (req, res, next, value, name) => {
  const parsed = parseId(value)

  if (parsed === null && !(name === 'quizIndex' && Number.parseInt(String(value), 10) === 0)) {
    return res.status(400).json({ error: `${name} must be a positive integer` })
  }

  req.params[name] = Number.parseInt(String(value), 10)
  next()
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Global error handler
app.use(errorHandler)

// Serve static files from client build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')))
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'))
  })
}

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}

export default app
