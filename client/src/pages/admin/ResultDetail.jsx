import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, User, Briefcase, Award, FileQuestion } from 'lucide-react'
import { dashboardApi } from '../../utils/api.js'

export default function ResultDetail() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResultDetail()
  }, [sessionId])

  const loadResultDetail = async () => {
    try {
      const data = await dashboardApi.getResultDetails(sessionId)
      setResult(data)
    } catch (err) {
      console.error('Failed to load result details:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Result not found</p>
        <button onClick={() => navigate('/admin/results')} className="mt-4 btn-primary">
          Back to Results
        </button>
      </div>
    )
  }

  const { quiz, quizzes } = result

  return (
    <div>
      <button 
        onClick={() => navigate('/admin/results')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Results
      </button>

      {/* Candidate Info */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.candidate.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-gray-600">
                <span className="flex items-center gap-1">
                  <Briefcase size={16} />
                  {quiz.candidate.position}
                </span>
                {quiz.candidate.email && (
                  <span>{quiz.candidate.email}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Award size={24} className="text-primary-600" />
              <span className="text-4xl font-bold text-gray-900">
                {quiz.score?.toFixed(1)}%
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Overall Score
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Session</p>
            <p className="font-medium text-gray-900">{quiz.session.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Started</p>
            <p className="font-medium text-gray-900">
              {new Date(quiz.startedAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="font-medium text-gray-900">
              {quiz.completedAt ? new Date(quiz.completedAt).toLocaleString() : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Quizzes Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Quiz Results</h2>
        
        {quizzes.map((quizResult, quizIndex) => (
          <div key={quizIndex} className="card">
            {/* Quiz Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FileQuestion size={20} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{quizResult.quiz.name}</h3>
                  <p className="text-sm text-gray-500">{quizResult.quiz.category}</p>
                </div>
              </div>
              <div className="text-right">
                {quizResult.score !== null ? (
                  <>
                    <span className={`text-2xl font-bold ${
                      quizResult.score >= 70 ? 'text-green-600' : 
                      quizResult.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {quizResult.score.toFixed(1)}%
                    </span>
                    <p className="text-sm text-gray-500">
                      {quizResult.correctCount} of {quizResult.totalQuestions} correct
                    </p>
                  </>
                ) : (
                  <span className="text-gray-400">No multiple choice questions</span>
                )}
              </div>
            </div>

            {/* Questions and Answers */}
            <div className="mt-4 space-y-4">
              {quizResult.questions.map((item, qIndex) => (
                <div key={item.id} className="pl-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {qIndex + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{item.question.questionText}</p>
                      
                      {item.question.codeSnippet && (
                        <pre className="mt-2 p-3 bg-gray-900 text-gray-100 rounded-lg text-xs font-mono overflow-x-auto">
                          {item.question.codeSnippet}
                        </pre>
                      )}

                      {/* Answer Section */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-500 mb-1">Answer:</p>
                        
                        {item.question.type === 'MULTIPLE_CHOICE' ? (
                          <div>
                            {item.answer ? (
                              <div className={`text-sm font-medium ${
                                item.answer.isCorrect ? 'text-green-700' : 'text-red-700'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {item.answer.isCorrect ? (
                                    <CheckCircle size={16} />
                                  ) : (
                                    <XCircle size={16} />
                                  )}
                                  {item.answer.selectedChoiceText || 'No answer selected'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 italic text-sm">No answer provided</span>
                            )}
                            
                            {/* Show correct answer if wrong */}
                            {item.answer && !item.answer.isCorrect && (
                              <div className="mt-2 pt-2 border-t text-green-700 text-sm">
                                <span className="font-medium">Correct: </span>
                                {item.question.choices.find(c => c.isCorrect)?.choiceText}
                              </div>
                            )}
                          </div>
                        ) : item.question.type === 'SHORT_ANSWER' ? (
                          <div className="text-gray-700 text-sm">
                            {item.answer?.textAnswer || (
                              <span className="text-gray-500 italic">No answer provided</span>
                            )}
                          </div>
                        ) : (
                          <div className="text-gray-700 font-mono text-xs">
                            {item.answer?.textAnswer || (
                              <span className="text-gray-500 italic">No code submitted</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {quizResult.questions.length === 0 && (
                <p className="text-gray-500 text-sm italic pl-8">No questions answered in this quiz</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
