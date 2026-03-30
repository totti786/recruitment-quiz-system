export default function AnswerOption({ choice, index, selected, onSelect }) {
  const letter = String.fromCharCode(65 + index)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`interactive-surface flex w-full items-start gap-3 rounded-[18px] border px-3 py-3.5 text-left ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-app shadow-soft-app'
          : 'border-app bg-elevated text-soft hover:bg-muted'
      }`}
      aria-pressed={selected}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
          selected
            ? 'bg-[var(--primary)] text-white'
            : 'bg-muted text-soft'
        }`}
      >
        {letter}
      </span>
      <span className="pt-1 text-sm font-semibold leading-6">{choice.choiceText}</span>
    </button>
  )
}
