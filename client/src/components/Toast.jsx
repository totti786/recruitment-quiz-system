import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import useToastStore from '../hooks/useToast'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
}

const colors = {
  success: 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-soft)]',
  error: 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-soft)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-soft)]',
  info: 'bg-[var(--info-soft)] text-[var(--info)] border-[var(--info-soft)]'
}

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500'
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = icons[toast.type]
        return (
          <div
            key={toast.id}
            className={`animate-slide-down rounded-2xl border p-4 shadow-app backdrop-blur-sm flex items-start gap-3 ${colors[toast.type]}`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[toast.type]}`} />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
