import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '../ui/Badge.js'
import { Button } from '../ui/Button.js'
import { Spinner } from '../ui/Spinner.js'
import { useUiStore } from '../../stores/uiStore.js'
import { api } from '../../lib/api.js'
import type { Market } from '../../lib/types.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

interface OracleQueueItem {
  market: Market
  status: 'pending' | 'submitted' | 'disputed' | 'finalized'
  confidence?: number
  outcome?: boolean
  reasoning?: string
}

const STATUS_MAP: Record<string, { variant: 'gray' | 'orange' | 'red' | 'green'; label: string }> = {
  pending:   { variant: 'gray', label: 'PENDING' },
  submitted: { variant: 'orange', label: 'SUBMITTED' },
  disputed:  { variant: 'red', label: 'DISPUTED' },
  finalized: { variant: 'green', label: 'FINALIZED' },
}

export function OracleQueue() {
  const qc = useQueryClient()
  const { addToast } = useUiStore()

  const { data: queue = [], isLoading } = useQuery<OracleQueueItem[]>({
    queryKey: ['admin', 'oracle-queue'],
    queryFn: () => api.admin.oracleQueue(ADMIN_KEY),
    refetchInterval: 30000,
  })

  const runMut = useMutation({
    mutationFn: (id: number) => api.admin.runOracle(id, ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'oracle-queue'] })
      addToast({ type: 'success', message: 'Oracle triggered' })
    },
    onError: (e: Error) => addToast({ type: 'error', message: e.message }),
  })

  const finMut = useMutation({
    mutationFn: (id: number) => api.admin.finalizeOracle(id, ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'oracle-queue'] })
      addToast({ type: 'success', message: 'Finalized on-chain' })
    },
    onError: (e: Error) => addToast({ type: 'error', message: e.message }),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (queue.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-s0 p-8 text-center">
        <p className="font-mono text-xs text-t3">No pending resolutions</p>
        <p className="mt-1 font-mono text-[10px] text-t4">Oracle runs automatically every hour</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 stagger">
      {queue.map(({ market, status, confidence, outcome, reasoning }) => {
        const s = STATUS_MAP[status] ?? STATUS_MAP.pending
        return (
          <div key={market.id} className="row-item rounded-lg border border-border bg-s0 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={s.variant} dot>{s.label}</Badge>
                  {confidence !== undefined && (
                    <span className="font-mono text-[10px] text-t3">{(confidence / 100).toFixed(0)}% conf</span>
                  )}
                </div>
                <p className="font-display text-sm font-semibold text-t1 clamp-1">{market.question}</p>
                {reasoning && <p className="mt-1 font-mono text-[10px] text-t4 clamp-2">{reasoning}</p>}
              </div>
              {outcome !== undefined && (
                <Badge variant={outcome ? 'green' : 'red'}>{outcome ? 'YES' : 'NO'}</Badge>
              )}
            </div>
            <div className="mt-3 flex gap-2">
              {status === 'pending' && (
                <Button variant="secondary" size="sm" onClick={() => runMut.mutate(market.id)} loading={runMut.isPending}>
                  RUN ORACLE
                </Button>
              )}
              {status === 'submitted' && (
                <Button size="sm" onClick={() => finMut.mutate(market.id)} loading={finMut.isPending}>
                  FINALIZE
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
