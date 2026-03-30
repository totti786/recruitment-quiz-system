import { useEffect } from 'react'
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react'

export default function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  showCancel = false
}) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const icons = {
    info: <Info className="w-12 h-12 text-blue-600" />,
    warning: <AlertTriangle className="w-12 h-12 text-amber-600" />,
    success: <CheckCircle className="w-12 h-12 text-green-600" />,
    error: <AlertTriangle className="w-12 h-12 text-red-600" />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="card max-w-md w-full animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-app">
              {title}
            </h3>
            <p className="text-soft">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          {showCancel && (
            <button
              onClick={onClose}
              className="btn-secondary btn"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.()
              onClose()
            }}
            className={`btn ${
              type === 'warning' || type === 'error'
                ? 'btn-danger'
                : 'btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
