import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MarketApproval } from '../../components/admin/MarketApproval.js'
import { OracleQueue } from '../../components/admin/OracleQueue.js'
import { AnalyticsDash } from '../../components/admin/AnalyticsDash.js'
import { Button } from '../../components/ui/Button.js'
import { useUiStore } from '../../stores/uiStore.js'
import { api } from '../../lib/api.js'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

type AdminTab = 'approvals' | 'oracle' | 'analytics'

export function Admin() {
  const [tab, setTab] = useState<AdminTab>('approvals')
  const qc = useQueryClient()
  const { addToast } = useUiStore()

  const generateMutation = useMutation({
    mutationFn: () => api.admin.generateMarkets(ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pending-markets'] })
      addToast({ type: 'success', message: 'Market generation triggered — check back in ~30s' })
    },
    onError: (err: Error) => addToast({ type: 'error', message: err.message }),
  })

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'approvals', label: 'Market Approvals' },
    { id: 'oracle', label: 'Oracle Queue' },
    { id: 'analytics', label: 'Analytics' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-white/40">Manage markets, oracle resolutions, and platform analytics</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => generateMutation.mutate()}
          loading={generateMutation.isPending}
        >
          Generate Markets
        </Button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 rounded-xl border border-white/8 bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-orange-500/15 text-orange-400'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'approvals' && <MarketApproval />}
      {tab === 'oracle' && <OracleQueue />}
      {tab === 'analytics' && <AnalyticsDash />}
    </div>
  )
}
