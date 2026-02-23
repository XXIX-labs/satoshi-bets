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
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="rounded-full border border-white/10 bg-white/5 p-6">
          <svg className="h-10 w-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Connect Your Wallet</h2>
          <p className="mt-1 text-sm text-white/40">Connect to view your positions and P&L</p>
        </div>
        <Button onClick={openWalletModal}>Connect Wallet</Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    )
  }

  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          <p className="mt-1 text-sm text-white/40 font-mono">{address.slice(0, 8)}...{address.slice(-4)}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-surface p-12 text-center">
          <p className="text-white/40">No positions yet</p>
          <p className="mt-1 text-sm text-white/20">Trade on any open market to get started</p>
        </div>
      </div>
    )
  }

  const claimablePositions = portfolio.positions.filter(
    (p) => p.isResolved && !p.claimed && (p.outcome ? p.yesShares > 0 : p.noShares > 0)
  )
  const openPositions = portfolio.positions.filter((p) => !p.isResolved)
  const settledPositions = portfolio.positions.filter((p) => p.isResolved && p.claimed)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Portfolio</h1>
        <p className="mt-1 text-sm text-white/40 font-mono">{address}</p>
      </div>

      <PnLSummary summary={portfolio.summary} />

      {claimablePositions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-orange-400">
            Claim Winnings ({claimablePositions.length})
          </h2>
          <div className="space-y-3">
            {claimablePositions.map((pos) => (
              <div key={pos.marketId} className="flex items-center gap-4">
                <div className="flex-1">
                  <PositionRow position={pos} />
                </div>
                <ClaimButton position={pos} address={address} />
              </div>
            ))}
          </div>
        </section>
      )}

      {openPositions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Open Positions ({openPositions.length})</h2>
          <div className="space-y-3">
            {openPositions.map((pos) => (
              <PositionRow key={pos.marketId} position={pos} />
            ))}
          </div>
        </section>
      )}

      {settledPositions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white/40">Settled ({settledPositions.length})</h2>
          <div className="space-y-3">
            {settledPositions.map((pos) => (
              <PositionRow key={pos.marketId} position={pos} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
