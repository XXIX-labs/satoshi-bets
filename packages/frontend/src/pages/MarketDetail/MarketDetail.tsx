import { useParams, Link } from 'react-router-dom'
import { useMarketDetail } from '../../hooks/useMarketDetail.js'
import { useWalletStore } from '../../stores/walletStore.js'
import { TradingPanel } from '../../components/trading/TradingPanel.js'
import { ProbabilityChart } from '../../components/charts/ProbabilityChart.js'
import { ResearchPanel } from '../../components/research/ResearchPanel.js'
import { Badge } from '../../components/ui/Badge.js'
import { Spinner } from '../../components/ui/Spinner.js'
import { formatSbtc, formatProbability, CATEGORY_LABELS, blockToDate } from '../../lib/formatters.js'

export function MarketDetail() {
  const { id } = useParams<{ id: string }>()
  const marketId = parseInt(id || '0', 10)
  const { market, pool, priceHistory, isLoading } = useMarketDetail(marketId)
  const address = useWalletStore((s) => s.address)

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!market) {
    return (
      <div className="rounded-2xl border border-white/8 bg-surface p-12 text-center">
        <p className="text-white/40">Market not found</p>
        <Link to="/" className="mt-3 inline-block text-sm text-orange-400 hover:underline">
          Back to markets
        </Link>
      </div>
    )
  }

  const statusVariant = {
    active: 'green' as const,
    paused: 'gray' as const,
    resolved: 'orange' as const,
    cancelled: 'red' as const,
  }[market.status] ?? 'gray'

  const yesPrice = pool ? pool.yesPool / (pool.yesPool + pool.noPool) : 0.5

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-white/40 hover:text-white/60">Markets</Link>
        <span className="text-white/20">/</span>
        <span className="text-white/60 truncate max-w-xs">{market.question}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: market info + chart */}
        <div className="space-y-6 lg:col-span-2">
          {/* Market header */}
          <div className="rounded-2xl border border-white/8 bg-surface p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant={statusVariant}>{market.status}</Badge>
              <Badge variant="blue">{CATEGORY_LABELS[market.category] || 'Other'}</Badge>
              {market.aiGenerated && <Badge variant="orange">AI Generated</Badge>}
            </div>
            <h1 className="text-xl font-bold text-white leading-snug">{market.question}</h1>
            <p className="mt-3 text-sm text-white/50 leading-relaxed">{market.description}</p>

            <div className="mt-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/40">YES Price</p>
                <p className="mt-1 font-mono text-2xl font-bold text-green-400">
                  {formatProbability(Math.round(yesPrice * 1e6))}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Volume</p>
                <p className="mt-1 font-mono text-2xl font-bold text-white">
                  {pool ? formatSbtc(pool.totalVolume, 4) : '—'}
                </p>
                <p className="text-xs text-white/30">sBTC</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Resolves</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {blockToDate(market.resolutionBlock)}
                </p>
                <p className="text-xs text-white/30">block {market.resolutionBlock.toLocaleString()}</p>
              </div>
            </div>

            {market.status === 'resolved' && market.outcome !== undefined && (
              <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-3 text-center">
                <p className="text-sm text-white/60">
                  Resolved: <span className="font-bold text-orange-400">{market.outcome ? 'YES' : 'NO'}</span>
                </p>
              </div>
            )}
          </div>

          {/* Probability chart */}
          {priceHistory && priceHistory.length > 1 && (
            <div className="rounded-2xl border border-white/8 bg-surface p-5">
              <h3 className="mb-4 font-semibold text-white">YES Probability Over Time</h3>
              <ProbabilityChart data={priceHistory} />
            </div>
          )}

          {/* Research panel */}
          <ResearchPanel market={market} />
        </div>

        {/* Right: trading panel */}
        <div className="space-y-4">
          <TradingPanel market={market} pool={pool} />

          {pool && (
            <div className="rounded-2xl border border-white/8 bg-surface p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Liquidity Pool</h3>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">YES pool</span>
                <span className="font-mono text-white">{formatSbtc(pool.yesPool, 6)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">NO pool</span>
                <span className="font-mono text-white">{formatSbtc(pool.noPool, 6)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-white/8 pt-3">
                <span className="text-white/40">Total fees</span>
                <span className="font-mono text-orange-400">{formatSbtc(pool.totalFees, 6)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
