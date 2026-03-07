import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/Badge.js'
import { formatSbtc } from '../../lib/formatters.js'
import { clsx } from 'clsx'
import type { MarketPosition } from '../../lib/types.js'

interface PositionRowProps {
  position: MarketPosition
}

export function PositionRow({ position }: PositionRowProps) {
  const navigate = useNavigate()
  const pnl = position.currentValue - position.costBasis
  const pnlPct = position.costBasis > 0 ? (pnl / position.costBasis) * 100 : 0
  const isProfit = pnl >= 0

  return (
    <div
      className="row-item cursor-pointer rounded-md border border-border bg-s0 transition-all hover:border-border-active"
      onClick={() => navigate(`/market/${position.marketId}`)}
    >
      <div className="flex items-center gap-4 px-4 py-3 sm:px-5">
        {/* Market info */}
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-t1 clamp-1">{position.question}</p>
          <div className="mt-1.5 flex items-center gap-2">
            {position.yesShares > 0 && <Badge variant="green" dot>YES × {position.yesShares.toLocaleString()}</Badge>}
            {position.noShares > 0 && <Badge variant="red" dot>NO × {position.noShares.toLocaleString()}</Badge>}
            {position.claimed && <Badge variant="gray">CLAIMED</Badge>}
          </div>
        </div>

        {/* Cost basis */}
        <div className="hidden sm:block text-right">
          <span className="font-mono text-[9px] text-t4 tracking-widest">COST</span>
          <p className="font-mono text-sm text-t1 tabular-nums">{formatSbtc(position.costBasis, 6)}</p>
        </div>

        {/* Current value */}
        <div className="hidden md:block text-right">
          <span className="font-mono text-[9px] text-t4 tracking-widest">VALUE</span>
          <p className="font-mono text-sm text-t1 tabular-nums">{formatSbtc(position.currentValue, 6)}</p>
        </div>

        {/* P&L */}
        <div className="text-right">
          <span className="font-mono text-[9px] text-t4 tracking-widest">P&L</span>
          <p className={clsx('font-mono text-sm font-bold tabular-nums', isProfit ? 'text-yes' : 'text-no')}>
            {isProfit ? '+' : ''}{formatSbtc(pnl, 6)}
          </p>
          <p className={clsx('font-mono text-[10px]', isProfit ? 'text-yes/60' : 'text-no/60')}>
            {isProfit ? '+' : ''}{pnlPct.toFixed(1)}%
          </p>
        </div>

        <svg className="h-4 w-4 text-t4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}
