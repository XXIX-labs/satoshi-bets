import { useEffect } from 'react'
import { useUiStore } from '../../stores/uiStore.js'
import { clsx } from 'clsx'

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: '→',
}

const STYLES: Record<string, string> = {
  success: 'border-l-yes text-yes',
  error:   'border-l-no text-no',
  warning: 'border-l-orange text-orange',
  info:    'border-l-blue-400 text-blue-400',
}

function ToastItem({ id, type, message }: { id: string; type: string; message: string }) {
  const removeToast = useUiStore((s) => s.removeToast)
  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 5000)
    return () => clearTimeout(t)
  }, [id, removeToast])

  return (
    <div
      className={clsx(
        'flex items-center gap-3 rounded-md border border-border bg-s0 px-4 py-3',
        'shadow-surface animate-slide-right',
        'border-l-2',
        STYLES[type]
      )}
    >
      <span className="font-mono text-xs font-bold">{ICONS[type]}</span>
      <span className="font-mono text-xs text-t1 flex-1">{message}</span>
      <button
        onClick={() => removeToast(id)}
        className="text-t3 hover:text-t1 transition-colors text-xs"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => <ToastItem key={t.id} {...t} />)}
    </div>
  )
}
