import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/Badge.js'
import { formatProbability, formatSbtc, CATEGORY_LABELS, blockToDate } from '../../lib/formatters.js'
import { clsx } from 'clsx'
import type { Market, MarketPool } from '../../lib/types.js'

interface MarketCardProps {
  market: Market
  pool?: MarketPool | null
}

export function MarketCard({ market, pool }: MarketCardProps) {
  const navigate = useNavigate()
  const yesPrice = pool ? pool.noPool / (pool.yesPool + pool.noPool) * 1_000_000 : 500_000
  const yesPct = yesPrice / 10_000

  const statusVariant = {
    active: 'green' as const,
    resolved: 'orange' as const,
    paused: 'yellow' as const,
    cancelled: 'red' as const,
  }[market.status] ?? ('gray' as const)

  return (
    <article
      className="row-item group cursor-pointer rounded-md border border-border bg-s0 transition-all duration-150 hover:border-border-active"
      onClick={() => navigate(`/market/${market.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/market/${market.id}`)}
    >
      <div className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
        {/* Probability — big number */}
        <div className="hidden sm:flex flex-col items-center justify-center w-16 flex-shrink-0">
          <span className={clsx(
            'font-mono text-xl font-bold tabular-nums leading-none',
            yesPct >= 60 ? 'text-yes' : yesPct <= 40 ? 'text-no' : 'text-t1'
          )}>
            {yesPct.toFixed(0)}
          </span>
          <span className="font-mono text-[9px] text-t4 tracking-widest mt-0.5">% YES</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-10 bg-border flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={statusVariant} dot>{market.status}</Badge>
            <Badge variant="gray">{CATEGORY_LABELS[market.category] ?? 'OTHER'}</Badge>
            {market.aiGenerated && <Badge variant="orange">AI</Badge>}
          </div>
          <h3 className="font-display text-sm font-semibold text-t1 leading-snug clamp-2 group-hover:text-orange transition-colors">
            {market.question}
          </h3>
        </div>

        {/* Right: prob bar + meta */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 w-28 sm:w-36">
          {/* Inline probability bar */}
          <div className="w-full">
            <div className="relative h-1.5 w-full rounded-sm bg-s2 overflow-hidden">
              <div
                className={clsx(
                  'absolute inset-y-0 left-0 rounded-sm prob-bar',
                  yesPct >= 60 ? 'bg-yes' : yesPct <= 40 ? 'bg-no' : 'bg-orange'
                )}
                style={{ '--bar-width': `${yesPct}%`, width: `${yesPct}%` } as React.CSSProperties}
              />
            </div>
          </div>
          {/* Meta row */}
          <div className="flex items-center gap-3 font-mono text-[10px] text-t3">
            <span>{pool ? formatSbtc(pool.totalVolume, 4) : '0'} vol</span>
            <span className="text-t4">·</span>
            <span>{blockToDate(market.resolutionBlock)}</span>
          </div>
          {/* Mobile prob */}
          <span className={clsx(
            'sm:hidden font-mono text-lg font-bold',
            yesPct >= 60 ? 'text-yes' : yesPct <= 40 ? 'text-no' : 'text-t1'
          )}>
            {yesPct.toFixed(0)}%
          </span>
        </div>

        {/* Arrow */}
        <svg className="hidden sm:block h-4 w-4 text-t4 flex-shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </article>
  )
}
