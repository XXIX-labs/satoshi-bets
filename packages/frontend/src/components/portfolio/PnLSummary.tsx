import { formatSbtc } from '../../lib/formatters.js'
import { clsx } from 'clsx'
import type { PortfolioSummary } from '../../lib/types.js'

interface PnLSummaryProps {
  summary: PortfolioSummary
}

export function PnLSummary({ summary }: PnLSummaryProps) {
  const totalPnl = summary.totalCurrentValue - summary.totalCostBasis
  const totalPnlPct = summary.totalCostBasis > 0 ? (totalPnl / summary.totalCostBasis) * 100 : 0
  const isProfit = totalPnl >= 0

  const stats = [
    { label: 'INVESTED', value: formatSbtc(summary.totalCostBasis, 6), sub: 'sBTC' },
    { label: 'VALUE', value: formatSbtc(summary.totalCurrentValue, 6), sub: 'sBTC' },
    {
      label: 'P&L',
      value: `${isProfit ? '+' : ''}${formatSbtc(totalPnl, 6)}`,
      sub: `${isProfit ? '+' : ''}${totalPnlPct.toFixed(2)}%`,
      color: isProfit ? 'text-yes' : 'text-no',
      border: isProfit ? 'border-yes/20' : 'border-no/20',
      bg: isProfit ? 'bg-yes/5' : 'bg-no/5',
    },
    {
      label: 'CLAIMABLE',
      value: formatSbtc(summary.claimableAmount, 6),
      sub: `${summary.openPositions} open · ${summary.resolvedPositions} resolved`,
      color: 'text-orange',
      border: 'border-orange/20',
      bg: 'bg-orange/5',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={clsx(
            'rounded-lg border p-4',
            stat.border || 'border-border',
            stat.bg || 'bg-s0'
          )}
        >
          <span className="font-mono text-[9px] text-t4 tracking-widest">{stat.label}</span>
          <p className={clsx('mt-1.5 font-mono text-xl font-bold tabular-nums', stat.color || 'text-t1')}>
            {stat.value}
          </p>
          <p className={clsx('mt-0.5 font-mono text-[10px]', stat.color ? `${stat.color}/60` : 'text-t4')}>
            {stat.sub}
          </p>
        </div>
      ))}
    </div>
  )
}
