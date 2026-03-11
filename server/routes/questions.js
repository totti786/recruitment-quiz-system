import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Get all questions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, type } = req.query
    
    let whereClause = {}
    if (category) whereClause.category = category
    if (difficulty) whereClause.difficulty = difficulty
    if (type) whereClause.type = type

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        choices: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(questions)
  } catch (error) {
    console.error('Get questions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.question.groupBy({
      by: ['category']
    })
    res.json(categories.map(c => c.category))
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get single question
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { choices: true }
    })

    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    res.json(question)
  } catch (error) {
    console.error('Get question error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create question
router.post('/', authenticateToken, [
  body('questionText').notEmpty().trim(),
  body('type').isIn(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'CODE']),
  body('category').notEmpty().trim(),
  body('difficulty').isIn(['EASY', 'MEDIUM', 'HARD']),
  body('codeSnippet').optional().trim(),
  body('choices').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { questionText, type, category, difficulty, codeSnippet, choices } = req.body

  try {
    const question = await prisma.question.create({
      data: {
        questionText,
        type,
        category,
        difficulty,
        codeSnippet,
        choices: type === 'MULTIPLE_CHOICE' && choices ? {
          create: choices
        } : undefined
      },
      include: { choices: true }
    })

    res.status(201).json(question)
  } catch (error) {
    console.error('Create question error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update question
router.put('/:id', authenticateToken, async (req, res) => {
  const { questionText, type, category, difficulty, codeSnippet, choices } = req.body

  try {
    // Update question
    const question = await prisma.question.update({
      where: { id: parseInt(req.params.id) },
      data: {
        questionText,
        type,
        category,
        difficulty,
        codeSnippet
      }
    })

    // Update choices if provided
    if (choices && type === 'MULTIPLE_CHOICE') {
      // Delete existing choices
      await prisma.choice.deleteMany({
        where: { questionId: parseInt(req.params.id) }
      })

      // Create new choices
      await prisma.choice.createMany({
        data: choices.map(c => ({
          questionId: parseInt(req.params.id),
          choiceText: c.choiceText,
          isCorrect: c.isCorrect
        }))
      })
    }

    const updatedQuestion = await prisma.question.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { choices: true }
    })

    res.json(updatedQuestion)
  } catch (error) {
    console.error('Update question error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Delete question
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.question.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Delete question error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router