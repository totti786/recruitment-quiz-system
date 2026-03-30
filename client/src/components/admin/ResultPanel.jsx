export default function ResultPanel({ title, value, detail, tone = 'info' }) {
  const tones = {
    info: 'bg-[var(--info-soft)] text-[var(--info)]',
    success: 'bg-[var(--success-soft)] text-[var(--success)]',
    warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  }

  return (
    <div className="metric-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-faint">{title}</p>
      <div className={`mt-3 inline-flex rounded-2xl px-3 py-2 text-2xl font-bold ${tones[tone] || tones.info}`}>
        {value}
      </div>
      {detail && <p className="mt-3 text-sm text-soft">{detail}</p>}
    </div>
  )
}
