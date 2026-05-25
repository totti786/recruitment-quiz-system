import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateQuizToken } from '../middleware/auth.js'
import { getValidationErrorMessage } from '../lib/http.js'
import { buildQuizSessionTokenPayload, selectDeterministicQuestions } from '../lib/quizSession.js'

const router = express.Router()

function sameIdentifier(left, right) {
  return Number(left) === Number(right)
}

async function loadCandidateSession(candidateSessionId) {
  return prisma.candidateSession.findUnique({
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
}

async function getQuizQuestionsForSession(candidateSession, quizIndex) {
  const sessionQuiz = candidateSession.session.quizzes[quizIndex]

  if (!sessionQuiz) {
    return null
  }

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
    },
    orderBy: {
      id: 'asc'
    }
  })

  const selectedQuestions = selectDeterministicQuestions(
    questions,
    sessionQuiz.quiz.questionCount,
    `${candidateSession.id}:${candidateSession.sessionId}:${quizIndex}:${sessionQuiz.quiz.id}`
  )

  return {
    quiz: sessionQuiz.quiz,
    questions: selectedQuestions
  }
}

// Get candidate's available sessions
router.get('/candidate/:candidateId/sessions', async (req, res) => {
  try {
    const candidateId = Number.parseInt(String(req.params.candidateId), 10)
    
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
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
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

    const accessToken = jwt.sign(
      buildQuizSessionTokenPayload(candidateSession),
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      ...candidateSession,
      accessToken
    })
  } catch (error) {
    console.error('Start session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get current quiz questions
router.get('/session/:candidateSessionId/quiz/:quizIndex', authenticateQuizToken, async (req, res) => {
  try {
    const candidateSessionId = Number.parseInt(String(req.params.candidateSessionId), 10)
    const quizIndex = Number.parseInt(String(req.params.quizIndex), 10)

    if (!sameIdentifier(req.candidateSessionId, candidateSessionId)) {
      return res.status(403).json({ error: 'Session token does not match request' })
    }

    const candidateSession = await loadCandidateSession(candidateSessionId)

    if (!candidateSession) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (candidateSession.status !== 'ACTIVE') {
      return res.status(409).json({ error: 'Session is no longer active' })
    }

    if (quizIndex !== candidateSession.currentQuizIndex) {
      return res.status(409).json({ error: 'Requested quiz is not the current active quiz' })
    }

    const quizData = await getQuizQuestionsForSession(candidateSession, quizIndex)

    if (!quizData) {
      return res.status(404).json({ error: 'Quiz not found in session' })
    }

    // Get existing answers for this candidate session (without isCorrect)
    const answers = await prisma.answer.findMany({
      where: {
        candidateSessionId
      },
      select: {
        id: true,
        candidateSessionId: true,
        questionId: true,
        quizIndex: true,
        selectedChoiceId: true,
        textAnswer: true,
        answeredAt: true
      }
    })

    res.json({
      quiz: quizData.quiz,
      questions: quizData.questions,
      answers: answers,
      timeRemaining: candidateSession.timeRemaining,
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
  body('quizIndex').optional().isInt(),
  body('selectedChoiceId').optional().isInt(),
  body('textAnswer').optional().trim()
], authenticateQuizToken, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { candidateSessionId, questionId, quizIndex, selectedChoiceId, textAnswer } = req.body

  try {
    if (!sameIdentifier(req.candidateSessionId, candidateSessionId)) {
      return res.status(403).json({ error: 'Session token does not match request' })
    }

    const candidateSession = await loadCandidateSession(candidateSessionId)

    if (!candidateSession) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (candidateSession.status !== 'ACTIVE') {
      return res.status(409).json({ error: 'Session is no longer active' })
    }

    const resolvedQuizIndex = quizIndex ?? candidateSession.currentQuizIndex

    if (resolvedQuizIndex !== candidateSession.currentQuizIndex) {
      return res.status(409).json({ error: 'Answers can only be submitted for the current quiz' })
    }

    const quizData = await getQuizQuestionsForSession(candidateSession, resolvedQuizIndex)
    const questionIds = new Set((quizData?.questions || []).map(question => question.id))

    if (!questionIds.has(questionId)) {
      return res.status(400).json({ error: 'Question does not belong to the current quiz' })
    }

    // Get question to check if correct
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { choices: true }
    })

    if (!question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    if (question.type === 'MULTIPLE_CHOICE' && !selectedChoiceId) {
      return res.status(400).json({ error: 'selectedChoiceId is required for multiple choice questions' })
    }

    if (question.type !== 'MULTIPLE_CHOICE' && (!textAnswer || !textAnswer.trim())) {
      return res.status(400).json({ error: 'textAnswer is required for written questions' })
    }

    // Calculate if answer is correct for multiple choice
    let isCorrect = null
    if (question.type === 'MULTIPLE_CHOICE' && selectedChoiceId) {
      const selectedChoice = question.choices.find(c => c.id === selectedChoiceId)
      if (!selectedChoice) {
        return res.status(400).json({ error: 'Selected choice does not belong to this question' })
      }
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
          textAnswer: textAnswer?.trim() || null,
          isCorrect,
          quizIndex: resolvedQuizIndex
        }
      })
    } else {
      answer = await prisma.answer.create({
        data: {
          candidateSessionId,
          questionId,
          quizIndex: resolvedQuizIndex,
          selectedChoiceId: selectedChoiceId || null,
          textAnswer: textAnswer?.trim() || null,
          isCorrect
        }
      })
    }

    // Return answer without isCorrect to prevent quiz taker from seeing correct answers
    const { isCorrect: _, ...answerWithoutCorrectness } = answer
    res.json(answerWithoutCorrectness)
  } catch (error) {
    console.error('Submit answer error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update timer
router.post('/timer', [
  body('candidateSessionId').isInt(),
  body('timeRemaining').isInt({ min: 0 })
], authenticateQuizToken, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { candidateSessionId, timeRemaining } = req.body

  try {
    if (!sameIdentifier(req.candidateSessionId, candidateSessionId)) {
      return res.status(403).json({ error: 'Session token does not match request' })
    }

    await prisma.candidateSession.update({
      where: { id: candidateSessionId },
      data: { timeRemaining: Math.max(0, timeRemaining) }
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
], authenticateQuizToken, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { candidateSessionId } = req.body

  try {
    if (!sameIdentifier(req.candidateSessionId, candidateSessionId)) {
      return res.status(403).json({ error: 'Session token does not match request' })
    }

    const candidateSession = await loadCandidateSession(candidateSessionId)

    if (!candidateSession) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (candidateSession.status !== 'ACTIVE') {
      return res.status(409).json({ error: 'Session is no longer active' })
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
], authenticateQuizToken, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const { candidateSessionId } = req.body

  try {
    if (!sameIdentifier(req.candidateSessionId, candidateSessionId)) {
      return res.status(403).json({ error: 'Session token does not match request' })
    }

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

// Log anti-cheat event
router.post('/:candidateSessionId/events', [
  body('eventType').isString().trim().isIn(['TAB_SWITCH', 'REFRESH', 'FULLSCREEN_EXIT']),
  body('metadata').optional().isObject()
], authenticateQuizToken, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: getValidationErrorMessage(errors.array()),
      errors: errors.array()
    })
  }

  const candidateSessionId = Number.parseInt(String(req.params.candidateSessionId), 10)
  const { eventType, metadata } = req.body

  try {
    if (!sameIdentifier(req.candidateSessionId, candidateSessionId)) {
      return res.status(403).json({ error: 'Session token does not match request' })
    }

    const candidateSession = await prisma.candidateSession.findUnique({
      where: { id: candidateSessionId }
    })

    if (!candidateSession) {
      return res.status(404).json({ error: 'Session not found' })
    }

    if (candidateSession.status !== 'ACTIVE') {
      return res.status(409).json({ error: 'Session is no longer active' })
    }

    // Create the event log entry
    await prisma.sessionEvent.create({
      data: {
        candidateSessionId,
        eventType,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    // Increment tab switch count if applicable
    let updatedCount = candidateSession.tabSwitchCount || 0
    if (eventType === 'TAB_SWITCH') {
      const updated = await prisma.candidateSession.update({
        where: { id: candidateSessionId },
        data: { tabSwitchCount: { increment: 1 } }
      })
      updatedCount = updated.tabSwitchCount
    }

    res.json({ success: true, tabSwitchCount: updatedCount })
  } catch (error) {
    console.error('Log event error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
