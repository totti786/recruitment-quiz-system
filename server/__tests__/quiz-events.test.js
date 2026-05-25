import request from 'supertest'
import express from 'express'
import { jest } from '@jest/globals'
import jwt from 'jsonwebtoken'

// Mock prisma before importing the route
const mockPrisma = {
  candidateSession: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  sessionEvent: {
    create: jest.fn()
  }
}

jest.unstable_mockModule('./lib/prisma.js', () => ({
  default: mockPrisma
}))

const { default: quizSessionsRouter } = await import('../routes/quiz-sessions.js')

const app = express()
app.use(express.json())
app.use('/api/quiz-sessions', quizSessionsRouter)

function generateToken(candidateSessionId = 1) {
  return jwt.sign(
    { type: 'quiz-session', candidateSessionId, candidateId: 1, sessionId: 1 },
    process.env.JWT_SECRET || 'test-secret'
  )
}

describe('POST /api/quiz-sessions/:id/events', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs a TAB_SWITCH event and increments tabSwitchCount', async () => {
    const candidateSession = {
      id: 1,
      status: 'ACTIVE',
      tabSwitchCount: 2
    }

    mockPrisma.candidateSession.findUnique.mockResolvedValue(candidateSession)
    mockPrisma.sessionEvent.create.mockResolvedValue({
      id: 1,
      candidateSessionId: 1,
      eventType: 'TAB_SWITCH',
      metadata: null,
      createdAt: new Date()
    })
    mockPrisma.candidateSession.update.mockResolvedValue({
      ...candidateSession,
      tabSwitchCount: 3
    })

    const response = await request(app)
      .post('/api/quiz-sessions/1/events')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({ eventType: 'TAB_SWITCH' })

    expect(response.status).toBe(200)
    expect(mockPrisma.sessionEvent.create).toHaveBeenCalledWith({
      data: {
        candidateSessionId: 1,
        eventType: 'TAB_SWITCH',
        metadata: null
      }
    })
    expect(mockPrisma.candidateSession.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { tabSwitchCount: { increment: 1 } }
    })
    expect(response.body).toEqual({ success: true, tabSwitchCount: 3 })
  })

  it('logs a REFRESH event without incrementing tabSwitchCount', async () => {
    mockPrisma.candidateSession.findUnique.mockResolvedValue({
      id: 1,
      status: 'ACTIVE',
      tabSwitchCount: 0
    })
    mockPrisma.sessionEvent.create.mockResolvedValue({
      id: 2,
      candidateSessionId: 1,
      eventType: 'REFRESH',
      metadata: null,
      createdAt: new Date()
    })

    const response = await request(app)
      .post('/api/quiz-sessions/1/events')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({ eventType: 'REFRESH' })

    expect(response.status).toBe(200)
    expect(mockPrisma.sessionEvent.create).toHaveBeenCalled()
    expect(mockPrisma.candidateSession.update).not.toHaveBeenCalled()
    expect(response.body).toEqual({ success: true, tabSwitchCount: 0 })
  })

  it('returns 404 when candidate session not found', async () => {
    mockPrisma.candidateSession.findUnique.mockResolvedValue(null)

    const response = await request(app)
      .post('/api/quiz-sessions/999/events')
      .set('Authorization', `Bearer ${generateToken(999)}`)
      .send({ eventType: 'TAB_SWITCH' })

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error')
  })

  it('returns 409 when session is COMPLETED', async () => {
    mockPrisma.candidateSession.findUnique.mockResolvedValue({
      id: 1,
      status: 'COMPLETED',
      tabSwitchCount: 5
    })

    const response = await request(app)
      .post('/api/quiz-sessions/1/events')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({ eventType: 'TAB_SWITCH' })

    expect(response.status).toBe(409)
    expect(response.body.error).toBe('Session is no longer active')
  })

  it('returns 400 for invalid eventType', async () => {
    mockPrisma.candidateSession.findUnique.mockResolvedValue({
      id: 1,
      status: 'ACTIVE',
      tabSwitchCount: 0
    })

    const response = await request(app)
      .post('/api/quiz-sessions/1/events')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({ eventType: 'INVALID_EVENT' })

    expect(response.status).toBe(400)
  })

  it('returns 403 when token does not match session', async () => {
    const response = await request(app)
      .post('/api/quiz-sessions/999/events')
      .set('Authorization', `Bearer ${generateToken(1)}`)
      .send({ eventType: 'TAB_SWITCH' })

    expect(response.status).toBe(403)
  })

  it('accepts optional metadata JSON string', async () => {
    mockPrisma.candidateSession.findUnique.mockResolvedValue({
      id: 1,
      status: 'ACTIVE',
      tabSwitchCount: 0
    })
    mockPrisma.sessionEvent.create.mockResolvedValue({
      id: 3,
      candidateSessionId: 1,
      eventType: 'FULLSCREEN_EXIT',
      metadata: '{"reEntryAttempted":true}',
      createdAt: new Date()
    })

    const response = await request(app)
      .post('/api/quiz-sessions/1/events')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({ eventType: 'FULLSCREEN_EXIT', metadata: { reEntryAttempted: true } })

    expect(response.status).toBe(200)
    expect(mockPrisma.sessionEvent.create).toHaveBeenCalledWith({
      data: {
        candidateSessionId: 1,
        eventType: 'FULLSCREEN_EXIT',
        metadata: '{"reEntryAttempted":true}'
      }
    })
  })
})
