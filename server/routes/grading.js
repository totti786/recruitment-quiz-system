import express from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Get all sessions that need grading
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.candidateSession.findMany({
      where: {
        status: 'COMPLETED',
        isFullyGraded: false
      },
      include: {
        candidate: {
          include: {
            department: true,
            position: true
          }
        },
        session: true,
        answers: {
          where: {
            question: {
              type: {
                in: ['SHORT_ANSWER', 'CODE']
              }
            },
            isGraded: false
          },
          include: {
            question: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      }
    })

    // Filter sessions that actually have ungraded written/code answers
    const sessionsNeedingGrading = sessions.filter(s => s.answers.length > 0)

    res.json(sessionsNeedingGrading.map(session => ({
      id: session.id,
      candidate: session.candidate,
      session: session.session,
      completedAt: session.completedAt,
      ungradedCount: session.answers.length
    })))
  } catch (error) {
    console.error('Get pending grading error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get detailed answers for grading a specific session
router.get('/session/:candidateSessionId', authenticateToken, async (req, res) => {
  try {
    const candidateSessionId = parseInt(req.params.candidateSessionId)
    
    const session = await prisma.candidateSession.findUnique({
      where: { id: candidateSessionId },
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
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        answers: {
          include: {
            question: {
              include: {
                choices: true
              }
            }
          }
        }
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    // Calculate current scores
    const mcAnswers = session.answers.filter(a => a.question.type === 'MULTIPLE_CHOICE')
    const writtenAnswers = session.answers.filter(a => ['SHORT_ANSWER', 'CODE'].includes(a.question.type))
    
    const mcCorrect = mcAnswers.filter(a => a.isCorrect).length
    const mcScore = mcAnswers.length > 0 ? (mcCorrect / mcAnswers.length) * 100 : 0
    
    const gradedWritten = writtenAnswers.filter(a => a.isGraded)
    const writtenScore = gradedWritten.length > 0 
      ? gradedWritten.reduce((sum, a) => sum + (a.score || 0), 0) / gradedWritten.length 
      : 0
    
    const totalQuestions = session.answers.length
    const gradedQuestions = mcAnswers.length + gradedWritten.length
    const isFullyGraded = writtenAnswers.every(a => a.isGraded)
    
    // Build quiz structure
    const quizzesMap = {}
    session.session.quizzes.forEach((sq, idx) => {
      quizzesMap[idx] = {
        quizIndex: idx,
        quiz: sq.quiz,
        questions: []
      }
    })

    session.answers.forEach(answer => {
      const quizIndex = answer.quizIndex || 0
      if (quizzesMap[quizIndex]) {
        quizzesMap[quizIndex].questions.push({
          id: answer.id,
          question: answer.question,
          answer: {
            selectedChoiceId: answer.selectedChoiceId,
            textAnswer: answer.textAnswer,
            isCorrect: answer.isCorrect,
            score: answer.score,
            maxScore: answer.maxScore,
            isGraded: answer.isGraded,
            gradingNotes: answer.gradingNotes
          }
        })
      }
    })

    res.json({
      session: {
        id: session.id,
        candidate: session.candidate,
        session: session.session,
        status: session.status,
        completedAt: session.completedAt,
        isFullyGraded: session.isFullyGraded
      },
      scoreSummary: {
        mcScore: mcScore.toFixed(1),
        mcCorrect,
        mcTotal: mcAnswers.length,
        writtenQuestions: writtenAnswers.length,
        writtenGraded: gradedWritten.length,
        writtenPending: writtenAnswers.length - gradedWritten.length,
        writtenAvgScore: writtenScore.toFixed(1),
        totalQuestions,
        gradedQuestions,
        isFullyGraded,
        overallScore: isFullyGraded 
          ? ((mcScore + writtenScore) / 2).toFixed(1)
          : null
      },
      quizzes: Object.values(quizzesMap)
    })
  } catch (error) {
    console.error('Get grading session error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Grade a specific answer
router.post('/answer/:answerId', authenticateToken, [
  body('score').isFloat({ min: 0, max: 100 }),
  body('maxScore').optional().isInt({ min: 1 }),
  body('gradingNotes').optional().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const answerId = parseInt(req.params.answerId)
  const { score, maxScore = 100, gradingNotes } = req.body

  try {
    // Update the answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        score,
        maxScore,
        isGraded: true,
        gradingNotes,
        gradedAt: new Date(),
        gradedBy: req.userId.toString()
      },
      include: {
        question: true,
        candidateSession: {
          include: {
            answers: {
              include: {
                question: true
              }
            }
          }
        }
      }
    })

    // Check if all written answers are now graded
    const candidateSession = updatedAnswer.candidateSession
    const writtenAnswers = candidateSession.answers.filter(
      a => ['SHORT_ANSWER', 'CODE'].includes(a.question.type)
    )
    const allGraded = writtenAnswers.every(a => a.isGraded)

    // Update session grading status
    if (allGraded && !candidateSession.isFullyGraded) {
      await prisma.candidateSession.update({
        where: { id: candidateSession.id },
        data: {
          isFullyGraded: true,
          gradedAt: new Date(),
          gradedBy: req.userId.toString()
        }
      })
    }

    res.json({
      message: 'Answer graded successfully',
      answer: updatedAnswer,
      allGraded
    })
  } catch (error) {
    console.error('Grade answer error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Batch grade multiple answers
router.post('/session/:candidateSessionId/batch', authenticateToken, [
  body('grades').isArray({ min: 1 }),
  body('grades.*.answerId').isInt(),
  body('grades.*.score').isFloat({ min: 0, max: 100 }),
  body('grades.*.gradingNotes').optional().trim()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const candidateSessionId = parseInt(req.params.candidateSessionId)
  const { grades } = req.body

  try {
    // Update all answers
    for (const grade of grades) {
      await prisma.answer.update({
        where: { id: grade.answerId },
        data: {
          score: grade.score,
          isGraded: true,
          gradingNotes: grade.gradingNotes,
          gradedAt: new Date(),
          gradedBy: req.userId.toString()
        }
      })
    }

    // Mark session as fully graded
    await prisma.candidateSession.update({
      where: { id: candidateSessionId },
      data: {
        isFullyGraded: true,
        gradedAt: new Date(),
        gradedBy: req.userId.toString()
      }
    })

    res.json({
      message: `${grades.length} answers graded successfully`,
      gradedCount: grades.length
    })
  } catch (error) {
    console.error('Batch grade error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
