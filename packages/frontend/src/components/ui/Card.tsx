import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border border-white/8 bg-surface',
        hover && 'cursor-pointer transition-all hover:border-orange-500/30 hover:bg-surface-raised',
        className
      )}
    >
      {children}
    </div>
  )
}
