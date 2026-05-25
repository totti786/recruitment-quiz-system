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
      activeSessions,
      pendingGrading
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.question.count(),
      prisma.session.count(),
      prisma.quiz.count(),
      prisma.candidateSession.count({ where: { status: 'COMPLETED' } }),
      prisma.candidateSession.count({ where: { status: 'ACTIVE' } }),
      prisma.candidateSession.count({ 
        where: { 
          status: 'COMPLETED',
          isFullyGraded: false
        } 
      })
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
      pendingGrading,
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
      // Calculate score for multiple choice questions
      const mcAnswers = session.answers.filter(a => a.question.type === 'MULTIPLE_CHOICE')
      const correctCount = mcAnswers.filter(a => a.isCorrect).length
      const totalMC = mcAnswers.length
      const mcScore = totalMC > 0 ? (correctCount / totalMC) * 100 : 0
      
      // Check for written/code questions that need grading
      const writtenAnswers = session.answers.filter(a => ['SHORT_ANSWER', 'CODE'].includes(a.question.type))
      const writtenGraded = writtenAnswers.filter(a => a.isGraded)
      const writtenPending = writtenAnswers.length - writtenGraded.length
      
      // Calculate written score if graded
      let writtenScore = null
      if (writtenGraded.length > 0) {
        writtenScore = writtenGraded.reduce((sum, a) => sum + (a.score || 0), 0) / writtenGraded.length
      }
      
      // Calculate overall score
      let score = null
      let scoreStatus = 'pending'
      
      if (writtenAnswers.length === 0) {
        // No written questions, score is just MC
        score = mcScore
        scoreStatus = 'completed'
      } else if (writtenPending === 0) {
        // All written questions graded
        const totalQuestions = mcAnswers.length + writtenAnswers.length
        if (totalQuestions > 0) {
          const mcPoints = (correctCount / totalMC) * (mcAnswers.length / totalQuestions) * 100
          const writtenPoints = writtenGraded.reduce((sum, a) => sum + (a.score || 0), 0) / writtenGraded.length * (writtenAnswers.length / totalQuestions)
          score = mcPoints + writtenPoints
        }
        scoreStatus = 'completed'
      } else {
        // Still pending grading
        score = mcScore
        scoreStatus = 'pending'
      }

      return {
        id: session.id,
        candidateId: session.candidateId,
        name: session.candidate.name,
        email: session.candidate.email,
        department: session.candidate.department?.name || '-',
        position: session.candidate.position?.name || '-',
        sessionName: session.session.name,
        score: score,
        scoreStatus,
        mcScore: mcScore.toFixed(1),
        writtenPending,
        totalWritten: writtenAnswers.length,
        status: session.status,
        isFullyGraded: session.isFullyGraded,
        completedAt: session.completedAt,
        timeTaken: session.completedAt 
          ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 1000 / 60)
          : null,
        tabSwitchCount: session.tabSwitchCount || 0
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
        },
        events: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 50
        }
      }
    })

    if (!session) {
      return res.status(404).json({ error: 'Session not found' })
    }

    const timeTaken = session.completedAt 
      ? Math.round((new Date(session.completedAt) - new Date(session.startedAt)) / 1000 / 60)
      : null

    // Calculate overall score
    const mcAnswers = session.answers.filter(a => a.question.type === 'MULTIPLE_CHOICE')
    const correctCount = mcAnswers.filter(a => a.isCorrect).length
    const totalMC = mcAnswers.length
    const mcScore = totalMC > 0 ? (correctCount / totalMC) * 100 : 0
    
    // Calculate written score
    const writtenAnswers = session.answers.filter(a => ['SHORT_ANSWER', 'CODE'].includes(a.question.type))
    const gradedWritten = writtenAnswers.filter(a => a.isGraded)
    const writtenScore = gradedWritten.length > 0 
      ? gradedWritten.reduce((sum, a) => sum + (a.score || 0), 0) / gradedWritten.length 
      : null
    
    // Calculate overall score
    let score = mcScore
    if (writtenAnswers.length > 0 && gradedWritten.length === writtenAnswers.length) {
      // All written questions graded - weighted average
      const totalQuestions = mcAnswers.length + writtenAnswers.length
      if (totalQuestions > 0) {
        const mcWeight = mcAnswers.length / totalQuestions
        const writtenWeight = writtenAnswers.length / totalQuestions
        score = (mcScore * mcWeight) + (writtenScore * writtenWeight)
      }
    }

    // Build category to quiz mapping
    const categoryToQuiz = {}
    session.session.quizzes.forEach((sq, idx) => {
      categoryToQuiz[sq.quiz.category] = {
        index: idx,
        quiz: sq.quiz
      }
    })

    // Group answers by quiz based on question category
    const quizzesMap = {}
    session.session.quizzes.forEach((sq, idx) => {
      quizzesMap[idx] = {
        quizIndex: idx,
        quiz: {
          id: sq.quiz.id,
          name: sq.quiz.name,
          description: sq.quiz.description,
          category: sq.quiz.category
        },
        questions: []
      }
    })

    session.answers.forEach(answer => {
      const quizInfo = categoryToQuiz[answer.question.category]
      if (quizInfo) {
        quizzesMap[quizInfo.index].questions.push({
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
            id: answer.id,
            selectedChoiceId: answer.selectedChoiceId,
            selectedChoiceText: answer.selectedChoice?.choiceText,
            textAnswer: answer.textAnswer,
            isCorrect: answer.isCorrect,
            isGraded: answer.isGraded,
            score: answer.score,
            gradingNotes: answer.gradingNotes,
            gradedAt: answer.gradedAt
          }
        })
      }
    })

    // Calculate per-quiz scores
    const quizzes = Object.values(quizzesMap).map(q => {
      const quizMC = q.questions.filter(item => item.question.type === 'MULTIPLE_CHOICE')
      const quizCorrect = quizMC.filter(item => item.answer?.isCorrect).length
      const quizTotal = quizMC.length
      
      // Include written questions in count
      const quizWritten = q.questions.filter(item => ['SHORT_ANSWER', 'CODE'].includes(item.question.type))
      const quizWrittenGraded = quizWritten.filter(item => item.answer?.isGraded)
      const quizWrittenScore = quizWrittenGraded.length > 0
        ? quizWrittenGraded.reduce((sum, item) => sum + (item.answer?.score || 0), 0) / quizWrittenGraded.length
        : null
      
      // Calculate weighted score if written questions exist and are graded
      let quizScore = quizTotal > 0 ? (quizCorrect / quizTotal) * 100 : null
      if (quizWritten.length > 0 && quizWrittenGraded.length === quizWritten.length && quizScore !== null) {
        const totalQuestions = quizMC.length + quizWritten.length
        const mcWeight = quizMC.length / totalQuestions
        const writtenWeight = quizWritten.length / totalQuestions
        quizScore = (quizScore * mcWeight) + (quizWrittenScore * writtenWeight)
      }
      
      return {
        ...q,
        score: quizScore,
        correctCount: quizCorrect,
        totalQuestions: quizTotal + quizWritten.length
      }
    })

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
        totalQuizzes: session.session.quizzes.length,
        tabSwitchCount: session.tabSwitchCount || 0,
        sessionEvents: (session.events || []).map(e => ({
          id: e.id,
          eventType: e.eventType,
          metadata: e.metadata ? JSON.parse(e.metadata) : null,
          createdAt: e.createdAt
        }))
      },
      quizzes
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