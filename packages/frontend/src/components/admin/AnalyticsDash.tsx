import { useQuery } from '@tanstack/react-query'
import { formatSbtc } from '../../lib/formatters.js'
import { Spinner } from '../ui/Spinner.js'
import { api } from '../../lib/api.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

interface Analytics {
  totalMarkets: number
  activeMarkets: number
  resolvedMarkets: number
  totalVolume: number
  totalFees: number
  uniqueTraders: number
  aiMarketsCreated: number
  oracleResolutions: number
}

export function AnalyticsDash() {
  const { data: analytics, isLoading } = useQuery<Analytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api.admin.analytics(ADMIN_KEY),
    refetchInterval: 60000,
  })

  if (isLoading || !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  const stats = [
    { label: 'Total Markets', value: analytics.totalMarkets.toString(), sub: `${analytics.activeMarkets} active` },
    { label: 'Total Volume', value: formatSbtc(analytics.totalVolume, 4), sub: 'sBTC traded' },
    { label: 'Protocol Fees', value: formatSbtc(analytics.totalFees, 6), sub: 'sBTC collected' },
    { label: 'Unique Traders', value: analytics.uniqueTraders.toString(), sub: 'wallet addresses' },
    { label: 'AI Markets', value: analytics.aiMarketsCreated.toString(), sub: 'Claude-generated' },
    { label: 'Oracle Resolutions', value: analytics.oracleResolutions.toString(), sub: 'automated' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/8 bg-surface p-5">
            <p className="text-xs text-white/40">{stat.label}</p>
            <p className="mt-2 font-mono text-2xl font-bold text-white">{stat.value}</p>
            <p className="mt-0.5 text-xs text-white/30">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/8 bg-surface p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Market Health</h3>
        <div className="space-y-3">
          <ProgressBar
            label="Resolution Rate"
            value={analytics.totalMarkets > 0 ? (analytics.resolvedMarkets / analytics.totalMarkets) * 100 : 0}
            color="orange"
          />
          <ProgressBar
            label="AI Market Share"
            value={analytics.totalMarkets > 0 ? (analytics.aiMarketsCreated / analytics.totalMarkets) * 100 : 0}
            color="blue"
          />
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClass = color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/40">{label}</span>
        <span className="text-white/60">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/8">
        <div
          className={`h-2 rounded-full transition-all ${colorClass}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  )
}
