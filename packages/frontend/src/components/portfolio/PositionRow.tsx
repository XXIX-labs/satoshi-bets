import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/Badge.js'
import { formatSbtc, formatProbability, timeAgo } from '../../lib/formatters.js'
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
      className="flex cursor-pointer items-center gap-4 rounded-xl border border-white/8 bg-surface p-4 transition-all hover:border-orange-500/20 hover:bg-surface/80"
      onClick={() => navigate(`/market/${position.marketId}`)}
    >
      {/* Market info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{position.question}</p>
        <div className="mt-1 flex items-center gap-2">
          {position.yesShares > 0 && (
            <Badge variant="green">YES × {position.yesShares.toLocaleString()}</Badge>
          )}
          {position.noShares > 0 && (
            <Badge variant="red">NO × {position.noShares.toLocaleString()}</Badge>
          )}
          {position.claimed && (
            <Badge variant="gray">Claimed</Badge>
          )}
        </div>
      </div>

      {/* Cost basis */}
      <div className="hidden text-right sm:block">
        <p className="text-xs text-white/40">Cost Basis</p>
        <p className="font-mono text-sm text-white">{formatSbtc(position.costBasis, 6)}</p>
      </div>

      {/* Current value */}
      <div className="hidden text-right md:block">
        <p className="text-xs text-white/40">Current Value</p>
        <p className="font-mono text-sm text-white">{formatSbtc(position.currentValue, 6)}</p>
      </div>

      {/* P&L */}
      <div className="text-right">
        <p className="text-xs text-white/40">P&L</p>
        <p className={`font-mono text-sm font-semibold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}{formatSbtc(pnl, 6)}
        </p>
        <p className={`text-xs ${isProfit ? 'text-green-400/60' : 'text-red-400/60'}`}>
          {isProfit ? '+' : ''}{pnlPct.toFixed(1)}%
        </p>
      </div>

      {/* Arrow */}
      <svg className="h-4 w-4 flex-shrink-0 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}
