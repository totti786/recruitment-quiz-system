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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {icons[type]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600">
              {message}
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.()
              onClose()
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              type === 'warning' || type === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
