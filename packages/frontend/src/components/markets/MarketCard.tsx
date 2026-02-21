import { useNavigate } from 'react-router-dom'
import { Card } from '../ui/Card.js'
import { Badge } from '../ui/Badge.js'
import { formatProbability, formatSbtc, CATEGORY_LABELS, blockToDate } from '../../lib/formatters.js'
import type { Market, MarketPool } from '../../lib/types.js'

interface MarketCardProps {
  market: Market
  pool?: MarketPool | null
}

function ProbabilityBar({ yesPrice }: { yesPrice: number }) {
  const pct = yesPrice / 10_000  // 0–100
  return (
    <div className="relative h-2 rounded-full bg-white/8">
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function MarketCard({ market, pool }: MarketCardProps) {
  const navigate = useNavigate()
  const yesPrice = pool ? pool.noPool / (pool.yesPool + pool.noPool) * 1_000_000 : 500_000

  const statusBadge = market.status === 'active' ? 'green'
    : market.status === 'resolved' ? 'gray'
    : market.status === 'paused' ? 'orange'
    : 'red'

  return (
    <Card hover onClick={() => navigate(`/markets/${market.id}`)} className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="gray">{CATEGORY_LABELS[market.category] ?? market.category}</Badge>
          <Badge variant={statusBadge}>{market.status}</Badge>
          {market.aiGenerated && <Badge variant="blue">🤖 AI</Badge>}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-xl font-bold text-white">{formatProbability(yesPrice)}</div>
          <div className="text-xs text-white/40">YES</div>
        </div>
      </div>

      <h3 className="mt-3 text-sm font-medium leading-snug text-white line-clamp-2">
        {market.question}
      </h3>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-white/50">
          <span>YES {formatProbability(yesPrice)}</span>
          <span>NO {formatProbability(1_000_000 - yesPrice)}</span>
        </div>
        <ProbabilityBar yesPrice={yesPrice} />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/40">
        <span>Vol: {pool ? formatSbtc(pool.totalVolume) : '—'}</span>
        <span>Expires block #{market.resolutionBlock.toLocaleString()}</span>
      </div>
    </Card>
  )
}
