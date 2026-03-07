import { useQuery } from '@tanstack/react-query'
import { formatSbtc } from '../../lib/formatters.js'
import { Spinner } from '../ui/Spinner.js'
import { api } from '../../lib/api.js'
import type { Analytics } from '../../lib/types.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

export function AnalyticsDash() {
  const { data: a, isLoading } = useQuery<Analytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api.admin.analytics(ADMIN_KEY),
    refetchInterval: 60000,
  })

  if (isLoading || !a) return <div className="flex justify-center py-12"><Spinner /></div>

  const stats = [
    { label: 'MARKETS', value: a.totalMarkets.toString(), sub: `${a.activeMarkets} active` },
    { label: 'VOLUME', value: formatSbtc(a.totalVolume, 4), sub: 'sBTC traded' },
    { label: 'FEES', value: formatSbtc(a.totalFees, 6), sub: 'sBTC collected' },
    { label: 'TRADERS', value: a.uniqueTraders.toString(), sub: 'unique wallets' },
    { label: 'AI MARKETS', value: a.aiMarketsCreated.toString(), sub: 'Claude-generated' },
    { label: 'RESOLUTIONS', value: a.oracleResolutions.toString(), sub: 'automated' },
  ]

  const resRate = a.totalMarkets > 0 ? (a.resolvedMarkets / a.totalMarkets) * 100 : 0
  const aiShare = a.totalMarkets > 0 ? (a.aiMarketsCreated / a.totalMarkets) * 100 : 0

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-s0 p-4">
            <span className="font-mono text-[9px] text-t4 tracking-widest">{s.label}</span>
            <p className="mt-1.5 font-mono text-2xl font-bold text-t1 tabular-nums">{s.value}</p>
            <p className="mt-0.5 font-mono text-[10px] text-t4">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-s0 p-4 space-y-4">
        <span className="font-display text-sm font-bold text-t1">HEALTH</span>
        <BarMeter label="RESOLUTION RATE" value={resRate} />
        <BarMeter label="AI MARKET SHARE" value={aiShare} />
      </div>
    </div>
  )
}

function BarMeter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-mono text-[10px] text-t3 tracking-wider">{label}</span>
        <span className="font-mono text-[10px] text-t2 tabular-nums">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 rounded-sm bg-s2 overflow-hidden">
        <div
          className="h-full rounded-sm bg-orange prob-bar"
          style={{ '--bar-width': `${Math.min(100, value)}%`, width: `${Math.min(100, value)}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}
