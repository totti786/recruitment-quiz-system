import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'

export default function QuizNavigation({
  canGoBack,
  canGoForward,
  onPrevious,
  onNext,
  onSubmit,
  isLastQuestion,
  isLastQuiz,
  isSubmitting,
}) {
  const primaryLabel = isLastQuestion
    ? (isLastQuiz ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next Quiz')
    : 'Next'

  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onPrevious} disabled={!canGoBack} className="btn-secondary btn !rounded-xl !px-3 !py-2.5 min-w-[104px] justify-center">
        <ChevronLeft size={16} />
        Prev
      </button>

      <button
        type="button"
        onClick={isLastQuestion && isLastQuiz ? onSubmit : onNext}
        disabled={isLastQuestion ? isLastQuiz && isSubmitting : !canGoForward}
        className="btn-primary btn !rounded-xl !px-3.5 !py-2.5 min-w-[116px] justify-center"
      >
        {isLastQuestion && isLastQuiz ? <CheckCircle2 size={16} /> : null}
        <span>{primaryLabel}</span>
        {!isLastQuestion || !isLastQuiz ? <ChevronRight size={16} /> : null}
      </button>
    </div>
  )
}
