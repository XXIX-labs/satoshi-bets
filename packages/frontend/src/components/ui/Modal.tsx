import { useEffect, useCallback, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKey)
        document.body.style.overflow = ''
      }
    }
  }, [open, handleKey])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md animate-fade-up" role="dialog" aria-modal="true" aria-label={title}>
        <div className="rounded-lg border border-border bg-s0 shadow-modal overflow-hidden">
          {/* Header */}
          {title && (
            <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="font-display text-sm font-bold tracking-tight text-t1">{title}</h2>
              <button
                onClick={onClose}
                className="flex h-6 w-6 items-center justify-center rounded text-t3 transition-colors hover:bg-s1 hover:text-t1"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </header>
          )}

          {/* Body */}
          <div className="p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
