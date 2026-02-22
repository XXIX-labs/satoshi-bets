import { useState } from 'react'
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
      addToast({ type: 'success', message: 'Market approved and deployed to chain' })
    },
    onError: (err: Error) => addToast({ type: 'error', message: err.message }),
  })

  const rejectMutation = useMutation({
    mutationFn: (proposalId: string) => api.admin.rejectMarket(proposalId, ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pending-markets'] })
      addToast({ type: 'info', message: 'Market proposal rejected' })
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

  if (proposals.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-surface p-8 text-center">
        <p className="text-white/40">No pending market proposals</p>
        <p className="mt-1 text-xs text-white/20">AI generates new proposals every 4 hours</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div key={proposal.id} className="rounded-2xl border border-white/8 bg-surface p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="orange">AI Generated</Badge>
                <Badge variant="blue">{CATEGORY_LABELS[proposal.category] || 'Unknown'}</Badge>
              </div>
              <h3 className="font-semibold text-white">{proposal.question}</h3>
              <p className="mt-1 text-sm text-white/50 line-clamp-2">{proposal.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-dark-50 p-3">
              <p className="text-xs text-white/40">Confidence</p>
              <p className="mt-1 font-mono text-lg font-bold text-orange-400">
                {(proposal.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg bg-dark-50 p-3">
              <p className="text-xs text-white/40">Initial Prob.</p>
              <p className="mt-1 font-mono text-lg font-bold text-white">
                {(proposal.initialProbability * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-lg bg-dark-50 p-3">
              <p className="text-xs text-white/40">Oracle Type</p>
              <p className="mt-1 text-sm font-semibold text-white capitalize">
                {proposal.oracleType}
              </p>
            </div>
          </div>

          <p className="text-xs text-white/30 border-t border-white/8 pt-3">
            <span className="font-medium text-white/40">Resolution criteria:</span> {proposal.resolutionCriteria}
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => rejectMutation.mutate(proposal.id)}
              loading={rejectMutation.isPending}
            >
              Reject
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => approveMutation.mutate(proposal.id)}
              loading={approveMutation.isPending}
            >
              Approve & Deploy
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
