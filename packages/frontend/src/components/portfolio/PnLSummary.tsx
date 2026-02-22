import { formatSbtc } from '../../lib/formatters.js'
import type { PortfolioSummary } from '../../lib/types.js'

interface PnLSummaryProps {
  summary: PortfolioSummary
}

export function PnLSummary({ summary }: PnLSummaryProps) {
  const totalPnl = summary.totalCurrentValue - summary.totalCostBasis
  const totalPnlPct = summary.totalCostBasis > 0
    ? (totalPnl / summary.totalCostBasis) * 100
    : 0
  const isProfit = totalPnl >= 0

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className="rounded-2xl border border-white/8 bg-surface p-5">
        <p className="text-xs text-white/40">Total Invested</p>
        <p className="mt-2 font-mono text-2xl font-bold text-white">
          {formatSbtc(summary.totalCostBasis, 6)}
        </p>
        <p className="mt-0.5 text-xs text-white/30">sBTC</p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-surface p-5">
        <p className="text-xs text-white/40">Current Value</p>
        <p className="mt-2 font-mono text-2xl font-bold text-white">
          {formatSbtc(summary.totalCurrentValue, 6)}
        </p>
        <p className="mt-0.5 text-xs text-white/30">sBTC</p>
      </div>

      <div className={`rounded-2xl border p-5 ${isProfit ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
        <p className="text-xs text-white/40">Unrealized P&L</p>
        <p className={`mt-2 font-mono text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
          {isProfit ? '+' : ''}{formatSbtc(totalPnl, 6)}
        </p>
        <p className={`mt-0.5 text-xs ${isProfit ? 'text-green-400/60' : 'text-red-400/60'}`}>
          {isProfit ? '+' : ''}{totalPnlPct.toFixed(2)}%
        </p>
      </div>

      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5">
        <p className="text-xs text-white/40">Claimable Winnings</p>
        <p className="mt-2 font-mono text-2xl font-bold text-orange-400">
          {formatSbtc(summary.claimableAmount, 6)}
        </p>
        <p className="mt-0.5 text-xs text-orange-400/60">
          {summary.openPositions} open · {summary.resolvedPositions} resolved
        </p>
      </div>
    </div>
  )
}
