import { clsx } from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glow?: 'orange' | 'yes' | 'no' | null
  children: React.ReactNode
}

export function Card({ hover, glow, className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-s0 transition-all duration-200',
        hover && 'cursor-pointer hover:border-border-active hover:bg-s0/80',
        glow === 'orange' && 'shadow-orange-sm',
        glow === 'yes'    && 'shadow-yes-sm',
        glow === 'no'     && 'shadow-no-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
