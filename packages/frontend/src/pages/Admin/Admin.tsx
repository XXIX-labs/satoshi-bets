import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MarketApproval } from '../../components/admin/MarketApproval.js'
import { OracleQueue } from '../../components/admin/OracleQueue.js'
import { AnalyticsDash } from '../../components/admin/AnalyticsDash.js'
import { Button } from '../../components/ui/Button.js'
import { useUiStore } from '../../stores/uiStore.js'
import { api } from '../../lib/api.js'
import { clsx } from 'clsx'

const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || ''

type AdminTab = 'approvals' | 'oracle' | 'analytics'

export function Admin() {
  const [tab, setTab] = useState<AdminTab>('approvals')
  const qc = useQueryClient()
  const { addToast } = useUiStore()

  const genMut = useMutation({
    mutationFn: () => api.admin.generateMarkets(ADMIN_KEY),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pending-markets'] })
      addToast({ type: 'success', message: 'Market generation triggered' })
    },
    onError: (e: Error) => addToast({ type: 'error', message: e.message }),
  })

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'approvals', label: 'APPROVALS' },
    { id: 'oracle', label: 'ORACLE' },
    { id: 'analytics', label: 'ANALYTICS' },
  ]

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-t1">ADMIN</h1>
          <p className="mt-1 font-mono text-xs text-t3">Markets · Oracle · Analytics</p>
        </header>
        <Button variant="secondary" size="sm" onClick={() => genMut.mutate()} loading={genMut.isPending}>
          GENERATE MARKETS
        </Button>
      </div>

      {/* Tab nav */}
      <div className="flex gap-px rounded-md border border-border bg-border overflow-hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'flex-1 py-2.5 font-mono text-[11px] font-medium tracking-wider transition-all',
              tab === t.id
                ? 'bg-orange/10 text-orange'
                : 'bg-s0 text-t3 hover:text-t1 hover:bg-s1'
            )}
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
