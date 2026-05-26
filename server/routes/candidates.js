import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { departmentFilter } from '../lib/scope.js'

const router = express.Router()

// Public: Get candidates with available sessions (for quiz portal) - no auth required
router.get('/available', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: {
        sessions: {
          some: {
            status: 'ACTIVE'
          }
        }
      },
      include: {
        department: true,
        position: true,
        sessions: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            session: {
              include: {
                quizzes: {
                  include: {
                    quiz: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    res.json(candidates)
  } catch (error) {
    console.error('Get available candidates error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// All admin routes require authentication and role gating
router.use(authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'))

// Get all candidates with their sessions, department and position
router.get('/', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: {
        ...departmentFilter(req),
      },
      include: {
        department: true,
        position: true,
        sessions: {
          include: {
            session: {
              include: {
                quizzes: {
                  include: {
                    quiz: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(candidates)
  } catch (error) {
    console.error('Get candidates error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get single candidate
router.get('/:id', async (req, res) => {
  try {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: parseInt(req.params.id),
        ...departmentFilter(req)
      },
      include: {
        department: true,
        position: true,
        sessions: {
          include: {
            session: {
              include: {
                quizzes: {
                  include: {
                    quiz: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }
              }
            },
            answers: {
              include: {
                question: true,
                selectedChoice: true
              }
            }
          },
          orderBy: {
            startedAt: 'desc'
          }
        }
      }
    })

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' })
    }

    // Calculate score for each session
    const sessionsWithScore = candidate.sessions.map(session => {
      const mcAnswers = session.answers.filter(a => a.question.type === 'MULTIPLE_CHOICE')
      const correctCount = mcAnswers.filter(a => a.isCorrect).length
      const totalMC = mcAnswers.length
      const score = totalMC > 0 ? (correctCount / totalMC) * 100 : null
      
      // Calculate time taken for completed sessions
      const timeTaken = session.completedAt 
        ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 1000 / 60)
        : null

      return {
        ...session,
        score,
        timeTaken
      }
    })

    res.json({
      ...candidate,
      sessions: sessionsWithScore
    })
  } catch (error) {
    console.error('Get candidate error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create candidate
router.post('/', [
  body('name').notEmpty().trim(),
  body('phoneNumber').notEmpty().trim(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('departmentId').isInt(),
  body('positionId').isInt(),
  body('notes').optional({ checkFalsy: true }).trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, phoneNumber, email, departmentId, positionId, notes } = req.body

  try {
    const candidate = await prisma.candidate.create({
      data: {
        name,
        phoneNumber,
        email,
        departmentId: parseInt(departmentId),
        positionId: parseInt(positionId),
        notes
      },
      include: {
        department: true,
        position: true
      }
    })

    res.status(201).json(candidate)
  } catch (error) {
    console.error('Create candidate error:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A candidate with this name and phone number already exists' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

// Update candidate
router.put('/:id', [
  body('name').optional().trim(),
  body('phoneNumber').optional().trim(),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('departmentId').optional().isInt(),
  body('positionId').optional().isInt(),
  body('notes').optional().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, phoneNumber, email, departmentId, positionId, notes } = req.body

  try {
    const data = {}
    if (name) data.name = name
    if (phoneNumber) data.phoneNumber = phoneNumber
    if (email !== undefined) data.email = email
    if (departmentId) data.departmentId = parseInt(departmentId)
    if (positionId) data.positionId = parseInt(positionId)
    if (notes !== undefined) data.notes = notes

    const candidate = await prisma.candidate.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: {
        department: true,
        position: true
      }
    })

    res.json(candidate)
  } catch (error) {
    console.error('Update candidate error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete candidate
router.delete('/:id', async (req, res) => {
  try {
    await prisma.candidate.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Candidate deleted successfully' })
  } catch (error) {
    console.error('Delete candidate error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Assign session to candidate
router.post('/:id/assign-session', [
  body('sessionId').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { sessionId } = req.body

  try {
    // Get session to get time limit
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Check if candidate already has this session
    const existing = await prisma.candidateSession.findUnique({
      where: {
        candidateId_sessionId: {
          candidateId: parseInt(req.params.id),
          sessionId
        }
      }
    })

    if (existing) {
      return res.status(400).json({ error: 'Candidate already has this session assigned' })
    }

    const candidateSession = await prisma.candidateSession.create({
      data: {
        candidateId: parseInt(req.params.id),
        sessionId,
        timeRemaining: session.timeLimit * 60 // Convert to seconds
      },
      include: {
        candidate: {
          include: {
            department: true,
            position: true
          }
        },
        session: {
          include: {
            quizzes: {
              include: {
                quiz: true
              }
            }
          }
        }
      }
    })

    res.status(201).json(candidateSession)
  } catch (error) {
    console.error('Assign session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router