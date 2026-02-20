import { useEffect } from 'react'
import { useUiStore } from '../../stores/uiStore.js'
import { clsx } from 'clsx'

const TYPE_STYLES = {
  success: 'border-green-500/30 bg-green-500/10 text-green-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
}

function ToastItem({ id, type, message }: { id: string; type: keyof typeof TYPE_STYLES; message: string }) {
  const removeToast = useUiStore((s) => s.removeToast)
  useEffect(() => {
    const t = setTimeout(() => removeToast(id), 5000)
    return () => clearTimeout(t)
  }, [id, removeToast])

  return (
    <div className={clsx('flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg animate-slide-up', TYPE_STYLES[type])}>
      <span>{message}</span>
      <button onClick={() => removeToast(id)} className="opacity-60 hover:opacity-100">×</button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => <ToastItem key={t.id} {...t} />)}
    </div>
  )
}
