export default function QuestionCard({ question, children }) {
  return (
    <section className="card animate-fade-in p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold leading-tight text-app sm:text-2xl">
            {question.questionText}
          </h2>
        </div>
        <span className="status-pill status-pill-info shrink-0 !px-2.5 !py-1 text-[11px]">
          {question.type.replace('_', ' ')}
        </span>
      </div>

      {question.codeSnippet && (
        <pre className="mono mb-5 overflow-x-auto rounded-[18px] border border-app bg-[#0f172a] p-3 text-xs text-slate-100 shadow-soft-app">
          {question.codeSnippet}
        </pre>
      )}

      <div className="space-y-2.5">{children}</div>
    </section>
  )
}
