import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Get candidate's available sessions
router.get('/candidate/:candidateId/sessions', async (req, res) => {
  try {
    const candidateId = parseInt(req.params.candidateId)
    
    const sessions = await prisma.candidateSession.findMany({
      where: {
        candidateId,
        status: 'ACTIVE'
      },
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
      }
    })

    res.json(sessions)
  } catch (error) {
    console.error('Get candidate sessions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Start a session
router.post('/start', [
  body('candidateId').isInt(),
  body('sessionId').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { candidateId, sessionId } = req.body

  try {
    // Find the candidate session
    let candidateSession = await prisma.candidateSession.findUnique({
      where: {
        candidateId_sessionId: {
          candidateId,
          sessionId
        }
      },
      include: {
        candidate: true,
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
      }
    })

    if (!candidateSession) {
      return res.status(404).json({ error: 'Session not found for this candidate' })
    }

    if (candidateSession.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Session already completed' })
    }

    // If just starting, generate questions for first quiz
    if (candidateSession.currentQuizIndex === 0 && candidateSession.status === 'ACTIVE') {
      const firstQuiz = candidateSession.session.quizzes[0]
      if (firstQuiz) {
        // Get random questions for this quiz
        const questions = await prisma.question.findMany({
          where: {
            category: firstQuiz.quiz.category
          },
          include: {
            choices: {
              select: {
                id: true,
                choiceText: true
              }
            }
          }
        })

        // Shuffle and select questions
        const shuffled = questions.sort(() => 0.5 - Math.random())
        const selectedQuestions = shuffled.slice(0, firstQuiz.quiz.questionCount)

        candidateSession.currentQuestions = selectedQuestions
      }
    }

    res.json(candidateSession)
  } catch (error) {
    console.error('Start session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get current quiz questions
router.get('/session/:candidateSessionId/quiz/:quizIndex', async (req, res) => {
  try {
    const candidateSessionId = parseInt(req.params.candidateSessionId)
    const quizIndex = parseInt(req.params.quizIndex)

    const candidateSession = await prisma.candidateSession.findUnique({
      where: { id: candidateSessionId },
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
      }
    })

    if (!candidateSession) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const sessionQuiz = candidateSession.session.quizzes[quizIndex]
    if (!sessionQuiz) {
      return res.status(404).json({ error: 'Quiz not found in session' })
    }

    // Get questions for this quiz
    const questions = await prisma.question.findMany({
      where: {
        category: sessionQuiz.quiz.category
      },
      include: {
        choices: {
          select: {
            id: true,
            choiceText: true
          }
        }
      }
    })

    // Shuffle and select questions
    const shuffled = questions.sort(() => 0.5 - Math.random())
    const selectedQuestions = shuffled.slice(0, sessionQuiz.quiz.questionCount)

    // Get existing answers for this candidate session
    const answers = await prisma.answer.findMany({
      where: {
        candidateSessionId
      }
    })

    res.json({
      quiz: sessionQuiz.quiz,
      questions: selectedQuestions,
      answers: answers,
      totalQuizzes: candidateSession.session.quizzes.length,
      currentQuizIndex: quizIndex
    })
  } catch (error) {
    console.error('Get quiz questions error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Submit answer
router.post('/answer', [
  body('candidateSessionId').isInt(),
  body('questionId').isInt(),
  body('selectedChoiceId').optional().isInt(),
  body('textAnswer').optional().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { candidateSessionId, questionId, selectedChoiceId, textAnswer } = req.body

  try {
    // Get question to check if correct
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { choices: true }
    })

    // Calculate if answer is correct for multiple choice
    let isCorrect = null
    if (question.type === 'MULTIPLE_CHOICE' && selectedChoiceId) {
      const selectedChoice = question.choices.find(c => c.id === selectedChoiceId)
      isCorrect = selectedChoice?.isCorrect || false
    }

    // Check if answer already exists
    const existingAnswer = await prisma.answer.findFirst({
      where: {
        candidateSessionId,
        questionId
      }
    })

    let answer
    if (existingAnswer) {
      answer = await prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedChoiceId: selectedChoiceId || null,
          textAnswer: textAnswer || null,
          isCorrect
        }
      })
    } else {
      answer = await prisma.answer.create({
        data: {
          candidateSessionId,
          questionId,
          selectedChoiceId: selectedChoiceId || null,
          textAnswer: textAnswer || null,
          isCorrect
        }
      })
    }

    res.json(answer)
  } catch (error) {
    console.error('Submit answer error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update timer
router.post('/timer', [
  body('candidateSessionId').isInt(),
  body('timeRemaining').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { candidateSessionId, timeRemaining } = req.body

  try {
    await prisma.candidateSession.update({
      where: { id: candidateSessionId },
      data: { timeRemaining }
    })

    res.json({ message: 'Timer updated' })
  } catch (error) {
    console.error('Update timer error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Move to next quiz
router.post('/next-quiz', [
  body('candidateSessionId').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { candidateSessionId } = req.body

  try {
    const candidateSession = await prisma.candidateSession.findUnique({
      where: { id: candidateSessionId },
      include: {
        session: {
          include: {
            quizzes: true
          }
        }
      }
    })

    if (!candidateSession) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const nextQuizIndex = candidateSession.currentQuizIndex + 1
    const totalQuizzes = candidateSession.session.quizzes.length

    if (nextQuizIndex >= totalQuizzes) {
      // Session complete
      await prisma.candidateSession.update({
        where: { id: candidateSessionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      })

      return res.json({
        complete: true,
        message: 'Session completed'
      })
    }

    // Move to next quiz
    await prisma.candidateSession.update({
      where: { id: candidateSessionId },
      data: {
        currentQuizIndex: nextQuizIndex
      }
    })

    res.json({
      complete: false,
      nextQuizIndex
    })
  } catch (error) {
    console.error('Next quiz error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Submit session
router.post('/submit', [
  body('candidateSessionId').isInt()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { candidateSessionId } = req.body

  try {
    await prisma.candidateSession.update({
      where: { id: candidateSessionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    })

    res.json({
      message: 'Session submitted successfully',
      completedAt: new Date()
    })
  } catch (error) {
    console.error('Submit session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router