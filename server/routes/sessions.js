import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { departmentFilter } from '../lib/scope.js'

const router = express.Router()

router.use(authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'))

// Get all sessions
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        ...departmentFilter(req),
      },
      include: {
        quizzes: {
          include: {
            quiz: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            candidateSessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(sessions)
  } catch (error) {
    console.error('Get sessions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get single session
router.get('/:id', async (req, res) => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        id: parseInt(req.params.id),
        ...departmentFilter(req)
      },
      include: {
        quizzes: {
          include: {
            quiz: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        candidateSessions: {
          include: {
            candidate: true
          }
        }
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    res.json(session)
  } catch (error) {
    console.error('Get session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create session
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('timeLimit').isInt({ min: 5, max: 300 }),
  body('quizIds').isArray({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, description, timeLimit, quizIds } = req.body

  try {
    // Verify all quizzes exist
    const quizzes = await prisma.quiz.findMany({
      where: {
        id: { in: quizIds }
      }
    })

    if (quizzes.length !== quizIds.length) {
      return res.status(400).json({ error: 'Some quizzes not found' })
    }

    // Create session with quizzes
    const session = await prisma.session.create({
      data: {
        name,
        description,
        timeLimit,
        quizzes: {
          create: quizIds.map((quizId, index) => ({
            quizId,
            order: index
          }))
        }
      },
      include: {
        quizzes: {
          include: {
            quiz: true
          }
        }
      }
    })

    res.status(201).json(session)
  } catch (error) {
    console.error('Create session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update session
router.put('/:id', async (req, res) => {
  const { name, description, timeLimit, quizIds } = req.body

  try {
    // Update session basic info
    const session = await prisma.session.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        description,
        timeLimit
      }
    })

    // Update quizzes if provided
    if (quizIds && Array.isArray(quizIds)) {
      // Delete existing session quizzes
      await prisma.sessionQuiz.deleteMany({
        where: { sessionId: parseInt(req.params.id) }
      })

      // Create new session quizzes
      await prisma.sessionQuiz.createMany({
        data: quizIds.map((quizId, index) => ({
          sessionId: parseInt(req.params.id),
          quizId,
          order: index
        }))
      })
    }

    const updatedSession = await prisma.session.findUnique({
      where: { id: parseInt(req.params.id) },
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
    })

    res.json(updatedSession)
  } catch (error) {
    console.error('Update session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete session
router.delete('/:id', async (req, res) => {
  try {
    await prisma.session.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Delete session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router