import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '../ui/Badge.js'
import { Button } from '../ui/Button.js'
import { Spinner } from '../ui/Spinner.js'
import { useUiStore } from '../../stores/uiStore.js'
import { api } from '../../lib/api.js'
import { formatSbtc } from '../../lib/formatters.js'
import type { Market } from '../../lib/types.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

interface OracleQueueItem {
  market: Market
  status: 'pending' | 'submitted' | 'disputed' | 'finalized'
  confidence?: number
  outcome?: boolean
  reasoning?: string
}

export function OracleQueue() {
  const qc = useQueryClient()
  const { addToast } = useUiStore()

  const { data: queue = [], isLoading } = useQuery<OracleQueueItem[]>({
    queryKey: ['admin', 'oracle-queue'],
    queryFn: () => api.admin.oracleQueue(ADMIN_KEY),
    refetchInterval: 30000,
  })

  const runOracleMutation = useMutation({
    mutationFn: (marketId: number) => api.admin.runOracle(marketId, ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'oracle-queue'] })
      addToast({ type: 'success', message: 'Oracle agent triggered — check back in ~30s' })
    },
    onError: (err: Error) => addToast({ type: 'error', message: err.message }),
  })

  const finalizeMutation = useMutation({
    mutationFn: (marketId: number) => api.admin.finalizeOracle(marketId, ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'oracle-queue'] })
      addToast({ type: 'success', message: 'Resolution finalized on-chain' })
    },
    onError: (err: Error) => addToast({ type: 'error', message: err.message }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    )
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-surface p-8 text-center">
        <p className="text-white/40">No markets pending oracle resolution</p>
        <p className="mt-1 text-xs text-white/20">Oracle runs every hour automatically</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {queue.map(({ market, status, confidence, outcome, reasoning }) => (
        <div key={market.id} className="rounded-2xl border border-white/8 bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={status} />
                {confidence !== undefined && (
                  <span className="text-xs text-white/40">
                    {(confidence / 100).toFixed(0)}% confidence
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-white truncate">{market.question}</p>
              {reasoning && (
                <p className="mt-1 text-xs text-white/40 line-clamp-2">{reasoning}</p>
              )}
            </div>
            {outcome !== undefined && (
              <Badge variant={outcome ? 'green' : 'red'}>
                {outcome ? 'YES' : 'NO'}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            {status === 'pending' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => runOracleMutation.mutate(market.id)}
                loading={runOracleMutation.isPending}
              >
                Run Oracle Agent
              </Button>
            )}
            {status === 'submitted' && (
              <Button
                size="sm"
                onClick={() => finalizeMutation.mutate(market.id)}
                loading={finalizeMutation.isPending}
              >
                Finalize On-Chain
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'gray' | 'orange' | 'red' | 'green' | 'blue'; label: string }> = {
    pending: { variant: 'gray', label: 'Pending' },
    submitted: { variant: 'orange', label: 'Resolution Submitted' },
    disputed: { variant: 'red', label: 'Disputed' },
    finalized: { variant: 'green', label: 'Finalized' },
  }
  const { variant, label } = map[status] ?? { variant: 'gray', label: status }
  return <Badge variant={variant}>{label}</Badge>
}
