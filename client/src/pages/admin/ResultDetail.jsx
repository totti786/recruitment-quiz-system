import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, User, Briefcase, Award, FileQuestion, Info, AlertTriangle, Save, Loader2 } from 'lucide-react'
import { dashboardApi, gradingApi } from '../../utils/api.js'
import ResultPanel from '../../components/admin/ResultPanel.jsx'

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
    <div className="h-full overflow-y-auto pr-1">
      <div className="space-y-6">
      <button 
        onClick={() => navigate('/admin/results')}
        className="btn-ghost !px-0 !py-0 text-[var(--primary)]"
      >
        <ArrowLeft size={20} />
        Back to Results
      </button>

      {/* Pending Grading Alert */}
      {scoreStatus === 'pending' && (
        <div className="rounded-[24px] border border-[var(--warning-soft)] bg-[var(--warning-soft)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-[var(--warning)] flex-shrink-0 mt-0.5" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--warning)]">Grading Required</h3>
              <p className="mt-1 text-[var(--warning)]">
                This session has {ungradedCount} written/code {ungradedCount === 1 ? 'question' : 'questions'} that need manual grading. 
                The final score will be calculated after all questions are graded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Info */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[var(--primary-soft)] rounded-full flex items-center justify-center">
              <User size={32} className="text-[var(--primary)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-app">{quiz?.candidate?.name || 'Unknown'}</h1>
              <div className="flex items-center gap-4 mt-1 text-soft">
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
                  <span className="text-3xl font-bold text-[var(--warning)]">--</span>
                </div>
                <p className="mt-1 font-medium text-[var(--warning)]">
                  Pending Grading
                </p>
                <p className="text-sm text-gray-500">
                  {ungradedCount} question{ungradedCount !== 1 ? 's' : ''} remaining
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 justify-end">
                  <Award size={24} className="text-[var(--primary)]" />
                  <span className="text-4xl font-bold text-app">
                    {overallScore.toFixed(1)}%
                  </span>
                </div>
                <p className="mt-1 text-soft">
                  Overall Score
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-app pt-6 md:grid-cols-3">
          <ResultPanel title="Session" value={quiz?.session?.name || '-'} detail={quiz?.startedAt ? `Started ${new Date(quiz.startedAt).toLocaleString()}` : 'No start time'} />
          <ResultPanel title="Multiple choice" value={`${mcScore.toFixed(1)}%`} detail={`${correctMCQuestions} of ${totalMCQuestions} correct`} tone="info" />
          {totalWrittenQuestions > 0 && (
            <ResultPanel
              title="Written and code"
              value={gradedWrittenQuestions === totalWrittenQuestions ? `${writtenAvgScore.toFixed(1)}%` : `${gradedWrittenQuestions}/${totalWrittenQuestions}`}
              detail={gradedWrittenQuestions === totalWrittenQuestions ? 'All manual grades completed' : `${totalWrittenQuestions - gradedWrittenQuestions} answers pending`}
              tone={gradedWrittenQuestions === totalWrittenQuestions ? 'success' : 'warning'}
            />
          )}
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`rounded-[24px] p-4 ${
          saveMessage.includes('success') 
            ? 'border border-[var(--success-soft)] bg-[var(--success-soft)] text-[var(--success)]' 
            : 'border border-[var(--danger-soft)] bg-[var(--danger-soft)] text-[var(--danger)]'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Anti-Cheat Section */}
      {quiz.tabSwitchCount > 0 || (quiz.sessionEvents && quiz.sessionEvents.length > 0) ? (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className={quiz.tabSwitchCount >= 3 ? 'text-[var(--danger)]' : quiz.tabSwitchCount > 0 ? 'text-[var(--warning)]' : 'text-soft'} />
            <h2 className="section-title mb-0">Security & Events</h2>
          </div>

          {/* Tab Switch Count */}
          <div className="flex items-center justify-between border-b border-app pb-3 mb-3">
            <span className="text-sm font-medium text-app">Tab switches</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              quiz.tabSwitchCount === 0
                ? 'bg-[var(--success-soft)] text-[var(--success)]'
                : quiz.tabSwitchCount < 3
                ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                : 'bg-[var(--danger-soft)] text-[var(--danger)]'
            }`}>
              {quiz.tabSwitchCount === 0 ? 'None' : `${quiz.tabSwitchCount} switch${quiz.tabSwitchCount !== 1 ? 'es' : ''}`}
            </span>
          </div>

          {/* Events Timeline */}
          {quiz.sessionEvents && quiz.sessionEvents.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint mb-2">Event Timeline</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {quiz.sessionEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        event.eventType === 'TAB_SWITCH' ? 'bg-[var(--warning)]' :
                        event.eventType === 'FULLSCREEN_EXIT' ? 'bg-[var(--danger)]' :
                        'bg-[var(--primary)]'
                      }`} />
                      <span className="font-medium text-app">{event.eventType.replace(/_/g, ' ')}</span>
                      {event.metadata?.returnedAfterMs && (
                        <span className="text-xs text-soft">({Math.round(event.metadata.returnedAfterMs / 1000)}s away)</span>
                      )}
                      {event.metadata?.reEntryAttempted && (
                        <span className="text-xs text-soft">(re-entry attempted)</span>
                      )}
                    </div>
                    <span className="text-xs text-soft">
                      {new Date(event.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Quizzes Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Quiz Results</h2>
          {scoreStatus === 'pending' && ungradedCount > 0 && (
            <button
              onClick={handleSaveAllGrades}
              disabled={savingGrades}
              className="btn-primary btn"
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
            <div className="flex items-center justify-between border-b border-app pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--primary-soft)] rounded-xl flex items-center justify-center">
                  <FileQuestion size={20} className="text-[var(--primary)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-app">{quizResult.quiz.name}</h3>
                  <p className="text-sm text-soft">{quizResult.quiz.category}</p>
                </div>
              </div>
              <div className="text-right">
                {quizResult.score !== null ? (
                  <>
                    <span className={`text-2xl font-bold ${
                      quizResult.score >= 70 ? 'text-[var(--success)]' : 
                      quizResult.score >= 50 ? 'text-[var(--warning)]' : 'text-[var(--danger)]'
                    }`}>
                      {quizResult.score.toFixed(1)}%
                    </span>
                    <p className="text-sm text-soft">
                      {quizResult.correctCount} of {quizResult.totalQuestions} correct
                    </p>
                  </>
                ) : (
                  <span className="text-faint">No multiple choice questions</span>
                )}
              </div>
            </div>

            {/* Questions and Answers */}
            <div className="mt-4 space-y-4">
              {quizResult.questions.map((item, qIndex) => (
                <div key={item.id} className="pl-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-xs font-medium text-soft">
                      {qIndex + 1}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium text-app text-sm">{item.question.questionText}</p>
                      
                      {item.question.codeSnippet && (
                        <pre className="mono mt-2 overflow-x-auto rounded-lg bg-[#0f172a] p-3 text-xs text-gray-100">
                          {item.question.codeSnippet}
                        </pre>
                      )}

                      {/* Answer Section */}
                      <div className="mt-3 rounded-[20px] bg-muted p-3">
                        <p className="mb-1 text-xs font-medium text-faint">Answer</p>
                        
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
                              <div className="mt-2 border-t border-app pt-2 text-[var(--success)] text-sm">
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
                              <div className="mt-3 border-t border-app pt-3">
                                {item.answer.isGraded ? (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--success-soft)] px-2 py-1 text-xs text-[var(--success)]">
                                        <CheckCircle size={12} />
                                        Graded
                                      </span>
                                      <span className="ml-2 font-semibold text-app">
                                        Score: {item.answer.score}%
                                      </span>
                                    </div>
                                    {item.answer.gradingNotes && (
                                      <p className="mt-1 text-sm text-soft">
                                        <span className="font-medium">Notes:</span> {item.answer.gradingNotes}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1">
                                        <label className="mb-1 block text-xs font-medium text-soft">
                                          Score (0-100)
                                        </label>
                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={gradingAnswers[item.answer.id]?.score || 0}
                                          onChange={(e) => handleGradeChange(item.answer.id, 'score', e.target.value)}
                                          className="input w-24 px-3 py-2"
                                        />
                                      </div>
                                      <button
                                        onClick={() => handleSaveGrade(item.answer.id)}
                                        disabled={savingGrades}
                                        className="btn-primary btn !px-3 !py-2"
                                      >
                                        <Save size={14} />
                                        Save
                                      </button>
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs font-medium text-soft">
                                        Grading Notes
                                      </label>
                                      <textarea
                                        value={gradingAnswers[item.answer.id]?.gradingNotes || ''}
                                        onChange={(e) => handleGradeChange(item.answer.id, 'gradingNotes', e.target.value)}
                                        className="input"
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
                <p className="pl-8 text-sm italic text-soft">No questions answered in this quiz</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  )
}
