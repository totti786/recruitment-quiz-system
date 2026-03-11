import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, User, Briefcase, Award } from 'lucide-react'
import { dashboardApi } from '../../utils/api.js'

export default function ResultDetail() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadResultDetail()
  }, [quizId])

  const loadResultDetail = async () => {
    try {
      const data = await dashboardApi.getResultDetails(quizId)
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

  const { quiz, questions } = result
  const multipleChoiceQuestions = questions.filter(q => q.question.type === 'MULTIPLE_CHOICE')
  const correctAnswers = multipleChoiceQuestions.filter(q => q.answer?.isCorrect).length
  const totalMultipleChoice = multipleChoiceQuestions.length

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
              {correctAnswers} of {totalMultipleChoice} correct
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
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
          <div>
            <p className="text-sm text-gray-600">Time Taken</p>
            <p className="font-medium text-gray-900">
              {quiz.timeTaken ? `${quiz.timeTaken} minutes` : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Questions and Answers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Quiz Responses</h2>
        
        {questions.map((item, index) => (
          <div key={item.id} className="card">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium text-gray-700">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.question.questionText}</p>
                    
                    {item.question.codeSnippet && (
                      <pre className="mt-3 p-3 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                        {item.question.codeSnippet}
                      </pre>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {item.question.category}
                      </span>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {item.question.difficulty}
                      </span>
                    </div>
                  </div>

                  {item.answer && item.question.type === 'MULTIPLE_CHOICE' && (
                    <div className={`flex-shrink-0 ${
                      item.answer.isCorrect ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.answer.isCorrect ? (
                        <CheckCircle size={24} />
                      ) : (
                        <XCircle size={24} />
                      )}
                    </div>
                  )}
                </div>

                {/* Answer Section */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Candidate's Answer:</p>
                  
                  {item.question.type === 'MULTIPLE_CHOICE' ? (
                    <div>
                      {item.answer ? (
                        <div className={`font-medium ${
                          item.answer.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {item.answer.selectedChoiceText || 'No answer selected'}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">No answer provided</span>
                      )}
                      
                      {/* Show correct answer if wrong */}
                      {item.answer && !item.answer.isCorrect && (
                        <div className="mt-2 pt-2 border-t text-green-700">
                          <span className="font-medium">Correct answer: </span>
                          {item.question.choices.find(c => c.isCorrect)?.choiceText}
                        </div>
                      )}
                    </div>
                  ) : item.question.type === 'SHORT_ANSWER' ? (
                    <div className="text-gray-700">
                      {item.answer?.textAnswer || (
                        <span className="text-gray-500 italic">No answer provided</span>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-700 font-mono text-sm">
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
      </div>
    </div>
  )
}