import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Badge } from '../ui/Badge.js'
import { Button } from '../ui/Button.js'
import { Spinner } from '../ui/Spinner.js'
import { useUiStore } from '../../stores/uiStore.js'
import { api } from '../../lib/api.js'
import { CATEGORY_LABELS } from '../../lib/formatters.js'
import type { AiMarketProposal } from '../../lib/types.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

export function MarketApproval() {
  const qc = useQueryClient()
  const { addToast } = useUiStore()

  const { data: proposals = [], isLoading } = useQuery<AiMarketProposal[]>({
    queryKey: ['admin', 'pending-markets'],
    queryFn: () => api.admin.pendingMarkets(ADMIN_KEY),
    refetchInterval: 30000,
  })

  const approveMutation = useMutation({
    mutationFn: (proposalId: string) => api.admin.approveMarket(proposalId, ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pending-markets'] })
      addToast({ type: 'success', message: 'Market approved and deployed' })
    },
    onError: (err: Error) => addToast({ type: 'error', message: err.message }),
  })

  const rejectMutation = useMutation({
    mutationFn: (proposalId: string) => api.admin.rejectMarket(proposalId, ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pending-markets'] })
      addToast({ type: 'info', message: 'Proposal rejected' })
    },
    onError: (err: Error) => addToast({ type: 'error', message: err.message }),
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  if (proposals.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-s0 p-8 text-center">
        <p className="font-mono text-xs text-t3">No pending proposals</p>
        <p className="mt-1 font-mono text-[10px] text-t4">AI generates new proposals every 4h</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 stagger">
      {proposals.map((p) => (
        <div key={p.id} className="rounded-lg border border-border bg-s0 overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="orange" dot>AI</Badge>
              <Badge variant="blue">{CATEGORY_LABELS[p.category] || 'OTHER'}</Badge>
            </div>
            <h3 className="font-display text-sm font-semibold text-t1">{p.question}</h3>
            <p className="font-mono text-[11px] text-t3 clamp-2">{p.description}</p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'CONFIDENCE', value: `${(p.confidence * 100).toFixed(0)}%` },
                { label: 'INIT. PROB', value: `${(p.initialProbability * 100).toFixed(0)}%` },
                { label: 'ORACLE', value: p.oracleType.toUpperCase() },
              ].map((s) => (
                <div key={s.label} className="rounded-md border border-border bg-bg p-2.5 text-center">
                  <span className="font-mono text-[9px] text-t4 tracking-widest">{s.label}</span>
                  <p className="mt-0.5 font-mono text-sm font-bold text-orange tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            <p className="font-mono text-[10px] text-t4 border-t border-border pt-3">
              <span className="text-t3">RESOLUTION:</span> {p.resolutionCriteria}
            </p>
          </div>

          <div className="flex border-t border-border">
            <button
              onClick={() => rejectMutation.mutate(p.id)}
              disabled={rejectMutation.isPending}
              className="flex-1 py-2.5 font-mono text-[11px] font-medium text-t3 hover:bg-no/5 hover:text-no transition-colors border-r border-border disabled:opacity-40"
            >
              REJECT
            </button>
            <button
              onClick={() => approveMutation.mutate(p.id)}
              disabled={approveMutation.isPending}
              className="flex-1 py-2.5 font-mono text-[11px] font-medium text-t3 hover:bg-yes/5 hover:text-yes transition-colors disabled:opacity-40"
            >
              APPROVE & DEPLOY
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
