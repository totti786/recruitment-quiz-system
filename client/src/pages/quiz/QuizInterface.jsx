import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen
} from 'lucide-react'
import { quizSessionsApi } from '../../utils/api.js'

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

  // Load session data
  useEffect(() => {
    const storedSession = sessionStorage.getItem('candidateSession')
    
    if (!storedSession) {
      navigate('/quiz')
      return
    }

    const session = JSON.parse(storedSession)
    setSessionData(session)
    setCandidateSessionId(session.candidateSessionId)
    setTimeRemaining(session.timeLimit)
    
    // Load first quiz
    loadQuiz(session.candidateSessionId, 0)
  }, [navigate])

  // Load quiz questions
  const loadQuiz = async (candidateSessionId, quizIndex) => {
    try {
      const data = await quizSessionsApi.getQuizQuestions(candidateSessionId, quizIndex)
      setQuestions(data.questions)
      setAnswers(data.answers || {})
      setCurrentQuizIndex(quizIndex)
      setCurrentQuestion(0)
      setLoading(false)
    } catch (err) {
      setError('Failed to load quiz')
      setLoading(false)
    }
  }

  // Timer - global for entire session
  useEffect(() => {
    if (!sessionData || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1
        
        // Save timer to server every 10 seconds
        if (newTime % 10 === 0 && candidateSessionId) {
          quizSessionsApi.updateTimer(candidateSessionId, newTime).catch(console.error)
        }
        
        if (newTime <= 0) {
          handleSubmitSession()
          return 0
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionData, timeRemaining, candidateSessionId])

  // Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => {
          const newCount = prev + 1
          if (newCount >= 3) {
            alert('You have switched tabs too many times. Your session may be flagged for review.')
          }
          return newCount
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

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
    const questionId = questions[currentQuestion].id
    const question = questions[currentQuestion]
    
    let answerData = {}
    
    if (question.type === 'MULTIPLE_CHOICE') {
      answerData = { selectedChoiceId: parseInt(value) }
    } else {
      answerData = { textAnswer: value }
    }

    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...answerData, questionId }
    }))

    // Submit answer to server
    try {
      await quizSessionsApi.submitAnswer({
        candidateSessionId,
        questionId,
        ...answerData
      })
    } catch (err) {
      console.error('Failed to save answer:', err)
    }
  }

  const handleNextQuiz = async () => {
    try {
      const result = await quizSessionsApi.nextQuiz(candidateSessionId)
      
      if (result.complete) {
        // All quizzes complete
        navigate('/quiz/complete')
      } else {
        // Load next quiz
        loadQuiz(candidateSessionId, result.nextQuizIndex)
      }
    } catch (err) {
      setError('Failed to proceed to next quiz')
    }
  }

  const handleSubmitSession = async () => {
    if (!confirm('Are you sure you want to submit your session? You cannot change your answers after submission.')) {
      return
    }

    setSubmitting(true)
    try {
      await quizSessionsApi.submitSession(candidateSessionId)
      sessionStorage.removeItem('candidateSession')
      navigate('/quiz/complete')
    } catch (err) {
      setError(err.message || 'Failed to submit session')
      setSubmitting(false)
    }
  }

  const getCurrentAnswer = () => {
    if (!questions.length) return ''
    const questionId = questions[currentQuestion].id
    const answer = answers[questionId]
    if (!answer) return ''
    
    if (answer.selectedChoiceId) {
      return answer.selectedChoiceId.toString()
    }
    return answer.textAnswer || ''
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    )
  }

  if (!sessionData || !questions.length) return null

  const question = questions[currentQuestion]
  const totalQuizzes = sessionData.totalQuizzes || 1
  const progress = ((currentQuizIndex * questions.length + currentQuestion + 1) / (totalQuizzes * questions.length)) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-gray-900">{sessionData.sessionName}</h1>
              <p className="text-sm text-gray-600">{sessionData.candidateName}</p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Quiz Progress */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookOpen size={18} />
                <span>Quiz {currentQuizIndex + 1} of {totalQuizzes}</span>
              </div>
              
              {/* Timer */}
              <div className={`flex items-center gap-2 font-mono text-lg font-bold ${
                timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
              }`}>
                <Clock size={20} />
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{answeredCount} answered</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                {question.category}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                {question.difficulty}
              </span>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {question.questionText}
            </h2>

            {question.codeSnippet && (
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm overflow-x-auto mb-6">
                {question.codeSnippet}
              </pre>
            )}
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {question.type === 'MULTIPLE_CHOICE' ? (
              question.choices.map(choice => (
                <label
                  key={choice.id}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    getCurrentAnswer() === choice.id.toString()
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={choice.id}
                    checked={getCurrentAnswer() === choice.id.toString()}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-900">{choice.choiceText}</span>
                </label>
              ))
            ) : question.type === 'SHORT_ANSWER' ? (
              <textarea
                value={getCurrentAnswer()}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="input min-h-[150px]"
                placeholder="Type your answer here..."
              />
            ) : (
              <textarea
                value={getCurrentAnswer()}
                onChange={(e) => handleAnswerChange(e.target.value)}
                className="input font-mono min-h-[200px]"
                placeholder="// Write your code here..."
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            {/* Question Navigator */}
            <div className="flex items-center gap-2">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    idx === currentQuestion
                      ? 'bg-primary-600 text-white'
                      : answers[q.id]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Next
                <ChevronRight size={20} />
              </button>
            ) : currentQuizIndex < totalQuizzes - 1 ? (
              <button
                onClick={handleNextQuiz}
                className="flex items-center gap-2 btn-primary"
              >
                Next Quiz
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmitSession}
                disabled={submitting}
                className="flex items-center gap-2 btn-primary"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Session
                    <CheckCircle size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {tabSwitchCount > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
            <strong>Warning:</strong> You have switched tabs {tabSwitchCount} time(s). 
            Excessive tab switching may flag your session for review.
          </div>
        )}
      </main>
    </div>
  )
}