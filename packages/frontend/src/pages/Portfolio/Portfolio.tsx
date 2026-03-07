import { useWalletStore } from '../../stores/walletStore.js'
import { useUiStore } from '../../stores/uiStore.js'
import { usePortfolio } from '../../hooks/usePortfolio.js'
import { PnLSummary } from '../../components/portfolio/PnLSummary.js'
import { PositionRow } from '../../components/portfolio/PositionRow.js'
import { ClaimButton } from '../../components/portfolio/ClaimButton.js'
import { Button } from '../../components/ui/Button.js'
import { Spinner } from '../../components/ui/Spinner.js'

export function Portfolio() {
  const address = useWalletStore((s) => s.address)
  const { openWalletModal } = useUiStore()
  const { data: portfolio, isLoading } = usePortfolio()

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 animate-fade-up">
        <div className="h-16 w-16 rounded-lg border border-border bg-s0 flex items-center justify-center">
          <span className="font-mono text-2xl text-t4">₿</span>
        </div>
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-t1">CONNECT WALLET</h2>
          <p className="mt-1 font-mono text-xs text-t3">View positions and P&L</p>
        </div>
        <Button onClick={openWalletModal}>CONNECT</Button>
      </div>
    )
  }

  if (isLoading) return <div className="flex justify-center py-24"><Spinner /></div>

  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <div className="space-y-5 animate-fade-up">
        <header>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-t1">PORTFOLIO</h1>
          <p className="mt-1 font-mono text-xs text-t3">{address}</p>
        </header>
        <div className="rounded-lg border border-border bg-s0 p-12 text-center">
          <p className="font-mono text-xs text-t3">NO POSITIONS</p>
          <p className="mt-1 font-mono text-[10px] text-t4">Trade on any open market</p>
        </div>
      </div>
    )
  }

  const claimable = portfolio.positions.filter(
    (p) => p.isResolved && !p.claimed && (p.outcome ? p.yesShares > 0 : p.noShares > 0)
  )
  const open = portfolio.positions.filter((p) => !p.isResolved)
  const settled = portfolio.positions.filter((p) => p.isResolved && p.claimed)

  return (
    <div className="space-y-6 animate-fade-up">
      <header>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-t1">PORTFOLIO</h1>
        <p className="mt-1 font-mono text-xs text-t3">{address}</p>
      </header>

      <PnLSummary summary={portfolio.summary} />

      {claimable.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm font-bold text-orange tracking-wider">
            CLAIM WINNINGS ({claimable.length})
          </h2>
          <div className="space-y-1.5 stagger">
            {claimable.map((pos) => (
              <div key={pos.marketId} className="flex items-center gap-3">
                <div className="flex-1"><PositionRow position={pos} /></div>
                <ClaimButton position={pos} address={address} />
              </div>
            ))}
          </div>
        </section>
      )}

      {open.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm font-bold text-t1 tracking-wider">OPEN ({open.length})</h2>
          <div className="space-y-1.5 stagger">
            {open.map((pos) => <PositionRow key={pos.marketId} position={pos} />)}
          </div>
        </section>
      )}

      {settled.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-sm font-bold text-t3 tracking-wider">SETTLED ({settled.length})</h2>
          <div className="space-y-1.5 stagger">
            {settled.map((pos) => <PositionRow key={pos.marketId} position={pos} />)}
          </div>
        </section>
      )}
    </div>
  )
}
