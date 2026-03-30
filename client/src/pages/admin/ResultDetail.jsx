import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, User, Briefcase, Award, FileQuestion, Info, AlertTriangle, Save, Loader2 } from 'lucide-react'
import { dashboardApi, gradingApi } from '../../utils/api.js'

export default function ResultDetail() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gradingAnswers, setGradingAnswers] = useState({})
  const [savingGrades, setSavingGrades] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    loadResultDetail()
  }, [sessionId])

  const loadResultDetail = async () => {
    try {
      const data = await dashboardApi.getResultDetails(sessionId)
      console.log('Result data:', data)
      setResult(data)
      
      // Initialize grading state with existing grades
      const initialGrades = {}
      data.quizzes.forEach(quiz => {
        quiz.questions.forEach(q => {
          if (q.answer && ['SHORT_ANSWER', 'CODE'].includes(q.question.type)) {
            initialGrades[q.answer.id || q.id] = {
              score: q.answer.score || 0,
              gradingNotes: q.answer.gradingNotes || '',
              isGraded: q.answer.isGraded || false
            }
          }
        })
      })
      setGradingAnswers(initialGrades)
    } catch (err) {
      console.error('Failed to load result details:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (answerId, field, value) => {
    setGradingAnswers(prev => ({
      ...prev,
      [answerId]: {
        ...prev[answerId],
        [field]: field === 'score' ? parseFloat(value) || 0 : value
      }
    }))
  }

  const handleSaveGrade = async (answerId) => {
    setSavingGrades(true)
    setSaveMessage('')
    
    try {
      const gradeData = gradingAnswers[answerId]
      await gradingApi.gradeAnswer(answerId, {
        score: gradeData.score,
        gradingNotes: gradeData.gradingNotes
      })
      
      setGradingAnswers(prev => ({
        ...prev,
        [answerId]: {
          ...prev[answerId],
          isGraded: true
        }
      }))
      
      setSaveMessage('Grade saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
      
      // Reload to get updated scores
      await loadResultDetail()
    } catch (err) {
      setSaveMessage('Failed to save grade')
    } finally {
      setSavingGrades(false)
    }
  }

  const handleSaveAllGrades = async () => {
    setSavingGrades(true)
    setSaveMessage('')
    
    try {
      const grades = Object.entries(gradingAnswers)
        .filter(([_, data]) => !data.isGraded || data.score !== undefined)
        .map(([answerId, data]) => ({
          answerId: parseInt(answerId),
          score: data.score,
          gradingNotes: data.gradingNotes
        }))
      
      if (grades.length > 0) {
        await gradingApi.batchGrade(sessionId, grades)
        setSaveMessage('All grades saved successfully!')
        setTimeout(() => setSaveMessage(''), 3000)
        await loadResultDetail()
      }
    } catch (err) {
      setSaveMessage('Failed to save grades')
    } finally {
      setSavingGrades(false)
    }
  }

  // Calculate if grading is needed
  const hasWrittenQuestions = result?.quizzes.some(quiz => 
    quiz.questions.some(q => ['SHORT_ANSWER', 'CODE'].includes(q.question.type))
  )
  
  const ungradedCount = result?.quizzes.reduce((count, quiz) => 
    count + quiz.questions.filter(q => 
      ['SHORT_ANSWER', 'CODE'].includes(q.question.type) && 
      q.answer && 
      !q.answer.isGraded
    ).length, 0
  ) || 0

  const isFullyGraded = hasWrittenQuestions && ungradedCount === 0

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
  
  // Safety check for quiz data
  if (!quiz || !quizzes) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Invalid result data</p>
        <button onClick={() => navigate('/admin/results')} className="mt-4 btn-primary">
          Back to Results
        </button>
      </div>
    )
  }

  // Calculate score breakdown
  let totalMCQuestions = 0
  let correctMCQuestions = 0
  let totalWrittenQuestions = 0
  let gradedWrittenQuestions = 0
  let writtenScoreSum = 0

  quizzes.forEach(quiz => {
    quiz.questions.forEach(q => {
      if (q.question.type === 'MULTIPLE_CHOICE' && q.answer) {
        totalMCQuestions++
        if (q.answer.isCorrect) correctMCQuestions++
      } else if (['SHORT_ANSWER', 'CODE'].includes(q.question.type) && q.answer) {
        totalWrittenQuestions++
        if (q.answer.isGraded) {
          gradedWrittenQuestions++
          writtenScoreSum += q.answer.score || 0
        }
      }
    })
  })

  const mcScore = totalMCQuestions > 0 ? (correctMCQuestions / totalMCQuestions) * 100 : 0
  const writtenAvgScore = gradedWrittenQuestions > 0 ? writtenScoreSum / gradedWrittenQuestions : 0
  
  // Calculate overall score
  let overallScore = mcScore
  let scoreStatus = 'auto'
  
  if (totalWrittenQuestions > 0) {
    if (gradedWrittenQuestions === totalWrittenQuestions) {
      // All graded - weighted average
      const totalQuestions = totalMCQuestions + totalWrittenQuestions
      if (totalQuestions > 0) {
        const mcWeight = totalMCQuestions / totalQuestions
        const writtenWeight = totalWrittenQuestions / totalQuestions
        overallScore = (mcScore * mcWeight) + (writtenAvgScore * writtenWeight)
      }
      scoreStatus = 'complete'
    } else {
      // Pending grading
      scoreStatus = 'pending'
    }
  }

  return (
    <div>
      <button 
        onClick={() => navigate('/admin/results')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Results
      </button>

      {/* Pending Grading Alert */}
      {scoreStatus === 'pending' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">Grading Required</h3>
              <p className="text-amber-700 mt-1">
                This session has {ungradedCount} written/code {ungradedCount === 1 ? 'question' : 'questions'} that need manual grading. 
                The final score will be calculated after all questions are graded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Info */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz?.candidate?.name || 'Unknown'}</h1>
              <div className="flex items-center gap-4 mt-1 text-gray-600">
                <span className="flex items-center gap-1">
                  <Briefcase size={16} />
                  {quiz?.candidate?.position || '-'}
                </span>
                {quiz?.candidate?.email && (
                  <span>{quiz.candidate.email}</span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            {scoreStatus === 'pending' ? (
              <div>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-3xl font-bold text-amber-600">--</span>
                </div>
                <p className="text-amber-600 mt-1 font-medium">
                  Pending Grading
                </p>
                <p className="text-sm text-gray-500">
                  {ungradedCount} question{ungradedCount !== 1 ? 's' : ''} remaining
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 justify-end">
                  <Award size={24} className="text-primary-600" />
                  <span className="text-4xl font-bold text-gray-900">
                    {overallScore.toFixed(1)}%
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Overall Score
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-600">Session</p>
            <p className="font-medium text-gray-900">{quiz?.session?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Started</p>
            <p className="font-medium text-gray-900">
              {quiz?.startedAt ? new Date(quiz.startedAt).toLocaleString() : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="font-medium text-gray-900">
              {quiz?.completedAt ? new Date(quiz.completedAt).toLocaleString() : '-'}
            </p>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Score Breakdown</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Multiple Choice</span>
                <span className="font-semibold text-gray-900">{mcScore.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {correctMCQuestions} of {totalMCQuestions} correct
              </p>
            </div>
            {totalWrittenQuestions > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Written/Code</span>
                  <span className={`font-semibold ${
                    gradedWrittenQuestions === totalWrittenQuestions 
                      ? 'text-gray-900' 
                      : 'text-amber-600'
                  }`}>
                    {gradedWrittenQuestions === totalWrittenQuestions 
                      ? `${writtenAvgScore.toFixed(1)}%` 
                      : `${gradedWrittenQuestions}/${totalWrittenQuestions} graded`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {gradedWrittenQuestions === totalWrittenQuestions 
                    ? 'All questions graded' 
                    : `${totalWrittenQuestions - gradedWrittenQuestions} pending`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-xl ${
          saveMessage.includes('success') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Quizzes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Quiz Results</h2>
          {scoreStatus === 'pending' && ungradedCount > 0 && (
            <button
              onClick={handleSaveAllGrades}
              disabled={savingGrades}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {savingGrades ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save All Grades
            </button>
          )}
        </div>
        
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
                            
                            {item.answer && !item.answer.isCorrect && (
                              <div className="mt-2 pt-2 border-t text-green-700 text-sm">
                                <span className="font-medium">Correct: </span>
                                {item.question.choices.find(c => c.isCorrect)?.choiceText}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className={`text-sm ${
                              item.question.type === 'CODE' ? 'font-mono text-xs' : 'text-gray-700'
                            }`}>
                              {item.answer?.textAnswer || (
                                <span className="text-gray-500 italic">No answer provided</span>
                              )}
                            </div>
                            
                            {/* Grading Interface */}
                            {item.answer && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                {item.answer.isGraded ? (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                        <CheckCircle size={12} />
                                        Graded
                                      </span>
                                      <span className="ml-2 font-semibold text-gray-900">
                                        Score: {item.answer.score}%
                                      </span>
                                    </div>
                                    {item.answer.gradingNotes && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        <span className="font-medium">Notes:</span> {item.answer.gradingNotes}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1">
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                          Score (0-100)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={gradingAnswers[item.answer.id]?.score || 0}
                                          onChange={(e) => handleGradeChange(item.answer.id, 'score', e.target.value)}
                                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleSaveGrade(item.answer.id)}
                                        disabled={savingGrades}
                                        className="flex items-center gap-1 px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                      >
                                        <Save size={14} />
                                        Save
                                      </button>
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Grading Notes
                                      </label>
                                      <textarea
                                        value={gradingAnswers[item.answer.id]?.gradingNotes || ''}
                                        onChange={(e) => handleGradeChange(item.answer.id, 'gradingNotes', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        rows={2}
                                        placeholder="Enter feedback..."
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
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
