import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { departmentFilter } from '../lib/scope.js'

const router = express.Router()

// Public endpoint for quiz portal - no auth required
router.get('/public', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      orderBy: { name: 'asc' }
    })
    res.json(quizzes)
  } catch (error) {
    console.error('Get public quizzes error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

router.use(authenticateToken, requireRole('SUPER_ADMIN', 'ADMIN'))

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        ...departmentFilter(req),
      },
      include: {
        sessionQuizzes: {
          include: {
            session: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(quizzes)
  } catch (error) {
    console.error('Get quizzes error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get single quiz
router.get('/:id', async (req, res) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: parseInt(req.params.id),
        ...departmentFilter(req)
      },
      include: {
        sessionQuizzes: {
          include: {
            session: true
          }
        }
      }
    })

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' })
    }

    res.json(quiz)
  } catch (error) {
    console.error('Get quiz error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create quiz
router.post('/', [
  body('name').notEmpty().trim(),
  body('description').optional().trim(),
  body('category').notEmpty().trim(),
  body('questionCount').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, description, category, questionCount = 10 } = req.body

  try {
    const quiz = await prisma.quiz.create({
      data: {
        name,
        description,
        category,
        questionCount
      }
    })

    res.status(201).json(quiz)
  } catch (error) {
    console.error('Create quiz error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update quiz
router.put('/:id', async (req, res) => {
  try {
    const quiz = await prisma.quiz.update({
      where: { id: parseInt(req.params.id) },
      data: req.body
    })

    res.json(quiz)
  } catch (error) {
    console.error('Update quiz error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete quiz
router.delete('/:id', async (req, res) => {
  try {
    await prisma.quiz.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Delete quiz error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router