import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Clock3,
  Loader2,
} from 'lucide-react'
import { quizSessionsApi } from '../../utils/api.js'
import Dialog from '../../components/Dialog.jsx'
import ProgressBar from '../../components/quiz/ProgressBar.jsx'
import QuestionCard from '../../components/quiz/QuestionCard.jsx'
import AnswerOption from '../../components/quiz/AnswerOption.jsx'
import QuizNavigation from '../../components/quiz/QuizNavigation.jsx'

function normalizeAnswers(answerList) {
  return (answerList || []).reduce((accumulator, answer) => {
    accumulator[answer.questionId] = answer
    return accumulator
  }, {})
}

export default function QuizInterface() {
  const navigate = useNavigate()
  const [sessionData, setSessionData] = useState(null)
  const [candidateSessionId, setCandidateSessionId] = useState(null)
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [dialog, setDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  })
  const latestTimerRef = useRef(0)
  const latestSessionIdRef = useRef(null)
  const latestSubmittingRef = useRef(false)
  const deadlineAtRef = useRef(null)
  const didExpireRef = useRef(false)

  const getRemainingFromDeadline = (deadlineAt) => {
    if (!deadlineAt) return 0
    return Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000))
  }

  useEffect(() => {
    const storedSession = sessionStorage.getItem('candidateSession')

    if (!storedSession || !sessionStorage.getItem('quizAccessToken')) {
      navigate('/quiz')
      return
    }

    const session = JSON.parse(storedSession)
    const deadlineAt = session.deadlineAt || (Date.now() + ((session.timeRemaining || 0) * 1000))
    deadlineAtRef.current = deadlineAt
    setSessionData(session)
    setCandidateSessionId(session.candidateSessionId)
    setTimeRemaining(getRemainingFromDeadline(deadlineAt))
    loadQuiz(session.candidateSessionId, session.currentQuizIndex || 0)
  }, [navigate])

  const loadQuiz = async (resolvedCandidateSessionId, quizIndex) => {
    setLoading(true)

    try {
      const data = await quizSessionsApi.getQuizQuestions(resolvedCandidateSessionId, quizIndex)
      setQuestions(data.questions)
      setAnswers(normalizeAnswers(data.answers))
      setCurrentQuizIndex(data.currentQuizIndex)
      setCurrentQuestion(0)

      const storedSession = JSON.parse(sessionStorage.getItem('candidateSession') || '{}')
      const deadlineAt = storedSession.deadlineAt || (Date.now() + (data.timeRemaining * 1000))
      deadlineAtRef.current = deadlineAt
      setTimeRemaining(getRemainingFromDeadline(deadlineAt))

      storedSession.currentQuizIndex = data.currentQuizIndex
      storedSession.totalQuizzes = data.totalQuizzes
      storedSession.deadlineAt = deadlineAt
      storedSession.timeRemaining = getRemainingFromDeadline(deadlineAt)
      sessionStorage.setItem('candidateSession', JSON.stringify(storedSession))
      setSessionData(storedSession)
    } catch (err) {
      setError(err.message || 'Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sessionData || timeRemaining <= 0 || submitting) return

    const timer = setInterval(() => {
      const nextTime = getRemainingFromDeadline(deadlineAtRef.current)
      setTimeRemaining(nextTime)

      if (nextTime % 10 === 0 && candidateSessionId) {
        quizSessionsApi.updateTimer(candidateSessionId, nextTime).catch(() => {})
      }

      if (nextTime <= 0 && !didExpireRef.current) {
        didExpireRef.current = true
        handleTimeExpired()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionData, timeRemaining, candidateSessionId, submitting])

  useEffect(() => {
    if (timeRemaining > 0) {
      didExpireRef.current = false
    }
  }, [timeRemaining])

  useEffect(() => {
    if (!sessionData) return

    const remaining = getRemainingFromDeadline(deadlineAtRef.current)
    const storedSession = JSON.parse(sessionStorage.getItem('candidateSession') || '{}')
    const nextSession = {
      ...storedSession,
      ...sessionData,
      candidateSessionId,
      currentQuizIndex,
      deadlineAt: deadlineAtRef.current,
      timeRemaining: remaining,
    }

    sessionStorage.setItem('candidateSession', JSON.stringify(nextSession))
  }, [sessionData, candidateSessionId, currentQuizIndex, timeRemaining])

  useEffect(() => {
    latestTimerRef.current = timeRemaining
    latestSessionIdRef.current = candidateSessionId
    latestSubmittingRef.current = submitting
  }, [timeRemaining, candidateSessionId, submitting])

  useEffect(() => () => {
    if (
      latestSessionIdRef.current &&
      latestTimerRef.current > 0 &&
      !latestSubmittingRef.current
    ) {
      quizSessionsApi.updateTimer(latestSessionIdRef.current, latestTimerRef.current).catch(() => {})
    }
  }, [])

  useEffect(() => {
    let hiddenTime = null

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        hiddenTime = Date.now()
      } else if (candidateSessionId && hiddenTime) {
        const awayMs = Date.now() - hiddenTime
        hiddenTime = null

        try {
          const result = await quizSessionsApi.logEvent(
            candidateSessionId,
            'TAB_SWITCH',
            { returnedAfterMs: awayMs }
          )
          setTabSwitchCount(result.tabSwitchCount)
        } catch (err) {
          // Silently retry — don't disrupt the quiz
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [candidateSessionId])

  useEffect(() => {
    if (!sessionData || submitting) return

    const handleBeforeUnload = (event) => {
      if (candidateSessionId) {
        quizSessionsApi.logEvent(candidateSessionId, 'REFRESH', { url: window.location.href }).catch(() => {})
      }
      event.preventDefault()
      event.returnValue = ''
    }

    const handleKeyDown = (event) => {
      const isRefreshShortcut =
        event.key === 'F5' ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r')

      if (isRefreshShortcut) {
        event.preventDefault()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [sessionData, submitting, candidateSessionId])

  useEffect(() => {
    if (tabSwitchCount >= 3) {
      setDialog({
        isOpen: true,
        title: 'Stay in the assessment tab',
        message: 'You have switched tabs several times. This session may be flagged for reviewer attention.',
        type: 'warning',
        onConfirm: () => setDialog(prev => ({ ...prev, isOpen: false })),
        showCancel: false
      })
    }
  }, [tabSwitchCount])

  useEffect(() => {
    if (!sessionData || !candidateSessionId) return

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        quizSessionsApi.logEvent(candidateSessionId, 'FULLSCREEN_EXIT', { reEntryAttempted: true }).catch(() => {})
        document.documentElement.requestFullscreen().catch(() => {
          // Browser may block fullscreen re-request
        })
      }
    }

    const requestFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen()
      } catch (err) {
        // Fullscreen may be blocked by browser policy
      }
    }

    requestFullscreen()
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [sessionData, candidateSessionId])

  const question = questions[currentQuestion]
  const totalQuizzes = sessionData?.totalQuizzes || 1
  const currentAnswer = question ? answers[question.id] : null

  const totalQuestionSlots = totalQuizzes * Math.max(questions.length || 1, 1)
  const overallProgress = totalQuestionSlots
    ? ((currentQuizIndex * Math.max(questions.length, 1) + currentQuestion + 1) / totalQuestionSlots) * 100
    : 0

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = async (value) => {
    if (!question) return

    const answerData = question.type === 'MULTIPLE_CHOICE'
      ? { selectedChoiceId: parseInt(value, 10) }
      : { textAnswer: value }

    setAnswers(prev => ({
      ...prev,
      [question.id]: { ...answerData, questionId: question.id }
    }))

    try {
      await quizSessionsApi.submitAnswer({
        candidateSessionId,
        questionId: question.id,
        quizIndex: currentQuizIndex,
        ...answerData
      })
      setError('')
    } catch (err) {
      setError(err.message || 'Failed to save answer')
    }
  }

  const handleNextStep = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      return
    }

    try {
      const result = await quizSessionsApi.nextQuiz(candidateSessionId)

      if (result.complete) {
        sessionStorage.removeItem('quizAccessToken')
        navigate('/quiz/complete')
      } else {
        const storedSession = JSON.parse(sessionStorage.getItem('candidateSession') || '{}')
        storedSession.currentQuizIndex = result.nextQuizIndex
        sessionStorage.setItem('candidateSession', JSON.stringify(storedSession))
        setSessionData(storedSession)
        loadQuiz(candidateSessionId, result.nextQuizIndex)
      }
    } catch (err) {
      setError(err.message || 'Failed to proceed to the next quiz')
    }
  }

  const handleSubmitSession = () => {
    setDialog({
      isOpen: true,
      title: 'Submit assessment?',
      message: 'Once submitted, your answers will be locked for review.',
      type: 'warning',
      onConfirm: async () => {
        setSubmitting(true)

        try {
          await quizSessionsApi.submitSession(candidateSessionId)
          sessionStorage.removeItem('candidateSession')
          sessionStorage.removeItem('quizAccessToken')
          navigate('/quiz/complete')
        } catch (err) {
          setError(err.message || 'Failed to submit session')
          setSubmitting(false)
        }
      },
      showCancel: true,
      confirmText: 'Submit now',
      cancelText: 'Continue working'
    })
  }

  const handleTimeExpired = async () => {
    setSubmitting(true)

    try {
      await quizSessionsApi.submitSession(candidateSessionId)
      sessionStorage.removeItem('candidateSession')
      sessionStorage.removeItem('quizAccessToken')
      navigate('/quiz/complete')
    } catch (err) {
      setError('Time expired, but auto-submit failed. Please submit manually.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="animate-spin text-[var(--primary)]" size={34} />
      </div>
    )
  }

  if (!sessionData || !question) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card py-10 text-center">
          <AlertCircle className="mx-auto text-[var(--danger)]" size={30} />
          <h1 className="mt-4 text-xl font-bold text-app">This quiz could not be loaded</h1>
          <p className="mt-2 text-soft">{error || 'The session is unavailable right now.'}</p>
          <button onClick={() => navigate('/quiz')} className="btn-primary btn mt-5">
            Return to portal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="mx-auto max-w-3xl select-none"
      onCopy={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <section className="card mb-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">Active assessment</p>
            <h1 className="mt-1.5 text-xl font-extrabold text-app sm:text-2xl">{sessionData.sessionName}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="status-pill status-pill-info !px-2.5 !py-1">
                Quiz {currentQuizIndex + 1} of {totalQuizzes}
              </span>
              <span className="text-soft">{sessionData.candidateName}</span>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 self-start rounded-xl px-3 py-2.5 ${timeRemaining < 300 ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : 'bg-muted text-app'}`}>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Time remaining</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold">
                <Clock3 size={16} />
                {formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={overallProgress}
            label="Assessment progress"
            detail={`${Math.round(overallProgress)}% complete`}
          />
        </div>
      </section>

      <div className="space-y-4">
        <QuestionCard
          question={question}
        >
          {question.type === 'MULTIPLE_CHOICE' ? (
            question.choices.map((choice, index) => (
              <AnswerOption
                key={choice.id}
                choice={choice}
                index={index}
                selected={currentAnswer?.selectedChoiceId === choice.id}
                onSelect={() => handleAnswerChange(choice.id)}
              />
            ))
          ) : (
            <textarea
              value={currentAnswer?.textAnswer || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className={`input min-h-[160px] ${question.type === 'CODE' ? 'mono' : ''}`}
              placeholder={question.type === 'CODE' ? '// Write your solution here...' : 'Type your answer here...'}
            />
          )}
        </QuestionCard>

        <div className="card p-4">
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">Current question</p>
              <p className="text-sm font-semibold text-app">
                {currentQuestion + 1} / {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {questions.map((item, index) => (
                <div
                  key={item.id}
                  className={`h-2.5 flex-1 rounded-full transition-all duration-200 ${
                    index < currentQuestion
                      ? 'bg-[var(--primary)]'
                      : index === currentQuestion
                      ? 'bg-[var(--primary)] shadow-[0_0_0_4px_var(--primary-soft)]'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
          <QuizNavigation
            canGoBack={currentQuestion > 0}
            canGoForward={currentQuestion < questions.length - 1}
            onPrevious={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            onNext={handleNextStep}
            onSubmit={handleSubmitSession}
            isLastQuestion={currentQuestion === questions.length - 1}
            isLastQuiz={currentQuizIndex === totalQuizzes - 1}
            isSubmitting={submitting}
          />
        </div>

        {error && (
          <div className="rounded-[24px] border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-5 py-4 text-[var(--danger)]">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}
      </div>

      <Dialog
        isOpen={dialog.isOpen}
        onClose={() => setDialog(prev => ({ ...prev, isOpen: false }))}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onConfirm={dialog.onConfirm}
        showCancel={dialog.showCancel}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
      />
    </div>
  )
}
