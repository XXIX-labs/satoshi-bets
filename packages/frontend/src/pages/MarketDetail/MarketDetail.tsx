import { useParams, Link } from 'react-router-dom'
import { useMarketDetail } from '../../hooks/useMarketDetail.js'
import { TradingPanel } from '../../components/trading/TradingPanel.js'
import { ProbabilityChart } from '../../components/charts/ProbabilityChart.js'
import { ResearchPanel } from '../../components/research/ResearchPanel.js'
import { Badge } from '../../components/ui/Badge.js'
import { Spinner } from '../../components/ui/Spinner.js'
import { formatSbtc, formatProbability, CATEGORY_LABELS, blockToDate } from '../../lib/formatters.js'
import { clsx } from 'clsx'

export function MarketDetail() {
  const { id } = useParams<{ id: string }>()
  const marketId = parseInt(id || '0', 10)
  const { market, pool, priceHistory, isLoading } = useMarketDetail(marketId)

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>

  if (!market) {
    return (
      <div className="rounded-lg border border-border bg-s0 p-12 text-center">
        <p className="font-mono text-xs text-t3">MARKET NOT FOUND</p>
        <Link to="/" className="mt-3 inline-block font-mono text-xs text-orange hover:underline">
          BACK TO MARKETS
        </Link>
      </div>
    )
  }

  const statusVariant = {
    active: 'green' as const,
    paused: 'yellow' as const,
    resolved: 'orange' as const,
    cancelled: 'red' as const,
  }[market.status] ?? ('gray' as const)

  const yesPrice = pool ? pool.noPool / (pool.yesPool + pool.noPool) : 0.5
  const yesPct = yesPrice * 100

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 font-mono text-[11px]">
        <Link to="/" className="text-t3 hover:text-t1 transition-colors">MARKETS</Link>
        <span className="text-t4">/</span>
        <span className="text-t2 clamp-1 max-w-xs">#{market.id}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        {/* Left */}
        <div className="space-y-4">
          {/* Market header */}
          <div className="rounded-lg border border-border bg-s0 overflow-hidden">
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant={statusVariant} dot>{market.status}</Badge>
                <Badge variant="blue">{CATEGORY_LABELS[market.category] || 'OTHER'}</Badge>
                {market.aiGenerated && <Badge variant="orange">AI GENERATED</Badge>}
              </div>
              <h1 className="font-display text-lg font-bold text-t1 leading-snug sm:text-xl">{market.question}</h1>
              <p className="mt-3 font-mono text-[11px] text-t3 leading-relaxed">{market.description}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
              <div className="p-4 text-center">
                <span className="font-mono text-[9px] text-t4 tracking-widest">YES PRICE</span>
                <p className={clsx(
                  'mt-1 font-mono text-2xl font-bold tabular-nums',
                  yesPct >= 60 ? 'text-yes' : yesPct <= 40 ? 'text-no' : 'text-orange'
                )}>
                  {yesPct.toFixed(1)}%
                </p>
              </div>
              <div className="p-4 text-center">
                <span className="font-mono text-[9px] text-t4 tracking-widest">VOLUME</span>
                <p className="mt-1 font-mono text-2xl font-bold text-t1 tabular-nums">
                  {pool ? formatSbtc(pool.totalVolume, 4) : '0'}
                </p>
                <span className="font-mono text-[9px] text-t4">sBTC</span>
              </div>
              <div className="p-4 text-center">
                <span className="font-mono text-[9px] text-t4 tracking-widest">RESOLVES</span>
                <p className="mt-1 font-mono text-sm font-bold text-t1">
                  {blockToDate(market.resolutionBlock)}
                </p>
                <span className="font-mono text-[9px] text-t4">
                  block {market.resolutionBlock.toLocaleString()}
                </span>
              </div>
            </div>

            {market.status === 'resolved' && market.outcome !== undefined && (
              <div className="border-t border-orange/20 bg-orange/5 px-5 py-3 text-center">
                <span className="font-mono text-xs text-t2">RESOLVED → </span>
                <span className="font-mono text-xs font-bold text-orange">
                  {market.outcome ? 'YES' : 'NO'}
                </span>
              </div>
            )}
          </div>

          {/* Chart */}
          {priceHistory && priceHistory.length > 1 && (
            <div className="rounded-lg border border-border bg-s0 p-4">
              <span className="font-display text-sm font-bold text-t1">PROBABILITY</span>
              <div className="mt-3">
                <ProbabilityChart data={priceHistory} />
              </div>
            </div>
          )}

          <ResearchPanel market={market} />
        </div>

        {/* Right — trading panel + pool info */}
        <div className="space-y-4">
          <TradingPanel market={market} pool={pool} />

          {pool && (
            <div className="rounded-lg border border-border bg-s0 overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <span className="font-display text-sm font-bold text-t1">POOL</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: 'YES POOL', value: formatSbtc(pool.yesPool, 6) },
                  { label: 'NO POOL', value: formatSbtc(pool.noPool, 6) },
                  { label: 'TOTAL FEES', value: formatSbtc(pool.totalFees, 6), accent: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between px-4 py-2.5">
                    <span className="font-mono text-[10px] text-t3 tracking-wider">{row.label}</span>
                    <span className={clsx('font-mono text-[12px] tabular-nums', row.accent ? 'text-orange' : 'text-t1')}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
