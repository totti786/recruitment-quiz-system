import express from 'express'
import prisma from '../lib/prisma.js'
import { authenticateToken } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const [
      totalCandidates,
      totalQuestions,
      totalSessions,
      totalQuizzes,
      completedSessions,
      activeSessions
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.question.count(),
      prisma.session.count(),
      prisma.quiz.count(),
      prisma.candidateSession.count({ where: { status: 'COMPLETED' } }),
      prisma.candidateSession.count({ where: { status: 'ACTIVE' } })
    ])

    // Get questions by category
    const questionsByCategory = await prisma.question.groupBy({
      by: ['category'],
      _count: { id: true }
    })

    // Get recent candidate sessions (order by startedAt)
    const recentSessions = await prisma.candidateSession.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
      include: {
        candidate: true,
        session: true
      }
    })

    res.json({
      totalCandidates,
      totalQuestions,
      totalSessions,
      totalQuizzes,
      completedSessions,
      activeSessions,
      questionsByCategory: questionsByCategory.map(q => ({
        category: q.category,
        count: q._count.id
      })),
      recentSessions
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get results for all candidates
router.get('/results', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.candidateSession.findMany({
      where: { status: 'COMPLETED' },
      include: {
        candidate: {
          include: {
            department: true,
            position: true
          }
        },
        session: true,
        answers: {
          include: {
            question: true,
            selectedChoice: true
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    })

    const results = sessions.map(session => {
      // Calculate score for multiple choice questions only
      const mcAnswers = session.answers.filter(a => a.question.type === 'MULTIPLE_CHOICE')
      const correctCount = mcAnswers.filter(a => a.isCorrect).length
      const totalMC = mcAnswers.length
      const score = totalMC > 0 ? (correctCount / totalMC) * 100 : 0

      return {
        id: session.id,
        candidateId: session.candidateId,
        name: session.candidate.name,
        email: session.candidate.email,
        department: session.candidate.department?.name || '-',
        position: session.candidate.position?.name || '-',
        sessionName: session.session.name,
        score: score,
        status: session.status,
        completedAt: session.completedAt,
        timeTaken: session.completedAt 
          ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 1000 / 60)
          : null
      }
    })

    res.json(results)
  } catch (error) {
    console.error('Get results error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get detailed result for a specific session
router.get('/results/:sessionId', authenticateToken, async (req, res) => {
  try {
    const candidateSessionId = parseInt(req.params.sessionId)
    
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
            },
            selectedChoice: true
          }
        }
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const timeTaken = session.completedAt 
      ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 1000 / 60)
      : null

    // Calculate score
    const mcAnswers = session.answers.filter(a => a.question.type === 'MULTIPLE_CHOICE')
    const correctCount = mcAnswers.filter(a => a.isCorrect).length
    const totalMC = mcAnswers.length
    const score = totalMC > 0 ? (correctCount / totalMC) * 100 : 0

    // Group answers by question
    const questions = session.answers.map(answer => ({
      id: answer.id,
      question: {
        id: answer.question.id,
        questionText: answer.question.questionText,
        type: answer.question.type,
        category: answer.question.category,
        difficulty: answer.question.difficulty,
        codeSnippet: answer.question.codeSnippet,
        choices: answer.question.choices
      },
      answer: {
        selectedChoiceId: answer.selectedChoiceId,
        selectedChoiceText: answer.selectedChoice?.choiceText,
        textAnswer: answer.textAnswer,
        isCorrect: answer.isCorrect
      }
    }))

    // Return in format expected by frontend
    res.json({
      quiz: {
        id: session.id,
        candidate: {
          name: session.candidate.name,
          email: session.candidate.email,
          position: session.candidate.position?.name || '-',
          department: session.candidate.department?.name || '-'
        },
        session: {
          name: session.session.name,
          description: session.session.description
        },
        score: score,
        status: session.status,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        timeTaken,
        totalQuizzes: session.session.quizzes.length
      },
      questions
    })
  } catch (error) {
    console.error('Get session result error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Export results to CSV
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const sessions = await prisma.candidateSession.findMany({
      where: { status: 'COMPLETED' },
      include: {
        candidate: true,
        session: true,
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    let csv = 'Name,Email,Session,Score,Completed At,Time Taken (minutes)\n'
    
    sessions.forEach(session => {
      const mcAnswers = session.answers.filter(a => a.question.type === 'MULTIPLE_CHOICE')
      const correctCount = mcAnswers.filter(a => a.isCorrect).length
      const totalMC = mcAnswers.length
      const score = totalMC > 0 ? (correctCount / totalMC) * 100 : 0
      
      const timeTaken = session.completedAt 
        ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 1000 / 60)
        : ''
        
      csv += `"${session.candidate.name}","${session.candidate.email || ''}","${session.session.name}",${score.toFixed(2)},"${session.completedAt}",${timeTaken}\n`
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=quiz-results.csv')
    res.send(csv)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router