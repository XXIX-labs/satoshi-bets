import { useWalletStore } from '../../stores/walletStore.js'
import { useUiStore } from '../../stores/uiStore.js'
import { Button } from '../ui/Button.js'
import { truncateAddress } from '../../lib/formatters.js'

export function ConnectButton() {
  const { address, disconnect } = useWalletStore()
  const { openWalletModal } = useUiStore()

  if (!address) {
    return (
      <Button size="sm" onClick={openWalletModal}>
        CONNECT
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded border border-border bg-s0 px-3 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-yes animate-pulse-orange" />
        <span className="font-mono text-[11px] text-t2">
          {truncateAddress(address)}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={disconnect}
      >
        ✕
      </Button>
    </div>
  )
}
