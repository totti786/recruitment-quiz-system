import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { getValidationErrorMessage } from '../lib/http.js'

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
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { questionText, type, category, difficulty, codeSnippet, choices } = req.body

  try {
    if (type === 'MULTIPLE_CHOICE') {
      if (!Array.isArray(choices) || choices.length < 2) {
        return res.status(400).json({ error: 'Multiple choice questions require at least two choices' })
      }

      if (!choices.some(choice => Boolean(choice.isCorrect))) {
        return res.status(400).json({ error: 'Multiple choice questions require at least one correct choice' })
      }
    }

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
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A question with this text already exists' })
    }
    res.status(500).json({ error: 'Server error' })
  }
})

// Update question
router.put('/:id', authenticateToken, async (req, res) => {
  const { questionText, type, category, difficulty, codeSnippet, choices } = req.body

  try {
    if (type === 'MULTIPLE_CHOICE') {
      if (!Array.isArray(choices) || choices.length < 2) {
        return res.status(400).json({ error: 'Multiple choice questions require at least two choices' })
      }

      if (!choices.some(choice => Boolean(choice.isCorrect))) {
        return res.status(400).json({ error: 'Multiple choice questions require at least one correct choice' })
      }
    }

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
    const questionId = parseInt(req.params.id)

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    // Use a transaction to delete all related records first, then the question
    await prisma.$transaction(async (tx) => {
      // Delete all answers for this question
      await tx.answer.deleteMany({ where: { questionId } })
      // Delete all choices for this question
      await tx.choice.deleteMany({ where: { questionId } })
      // Delete the question
      await tx.question.delete({ where: { id: questionId } })
    })

    res.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Delete question error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Import questions from CSV
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { questions } = req.body

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'No questions provided' })
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: []
    }

    for (const q of questions) {
      try {
        // Validate required fields
        if (!q.questionText || !q.type || !q.category || !q.difficulty) {
          results.failed++
          results.errors.push(`Missing required fields for question: ${q.questionText?.substring(0, 50)}...`)
          continue
        }

        // Create question with choices if applicable
        const questionData = {
          questionText: q.questionText,
          type: q.type,
          category: q.category,
          difficulty: q.difficulty,
          codeSnippet: q.codeSnippet || null
        }

        if (q.type === 'MULTIPLE_CHOICE' && q.choices && q.choices.length > 0) {
          questionData.choices = {
            create: q.choices.map(choice => ({
              choiceText: choice.choiceText,
              isCorrect: choice.isCorrect || false
            }))
          }
        }

        await prisma.question.create({
          data: questionData
        })

        results.imported++
      } catch (err) {
        results.failed++
        results.errors.push(`Failed to import: ${q.questionText?.substring(0, 50)}... - ${err.message}`)
      }
    }

    res.json({
      message: `Import complete: ${results.imported} imported, ${results.failed} failed`,
      results
    })
  } catch (error) {
    console.error('Import questions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
