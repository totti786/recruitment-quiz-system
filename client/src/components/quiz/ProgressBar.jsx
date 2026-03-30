export default function ProgressBar({ value, label, detail }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-faint">
        <span>{label}</span>
        <span>{detail}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--primary-strong))] transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}
