import { useWalletStore } from '../../stores/walletStore.js'
import { useUiStore } from '../../stores/uiStore.js'
import { Button } from '../ui/Button.js'
import { truncateAddress } from '../../lib/formatters.js'

export function ConnectButton() {
  const { address, disconnect } = useWalletStore()
  const openWalletModal = useUiStore((s) => s.openWalletModal)

  if (address) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 font-mono text-sm text-orange-400">
          {truncateAddress(address)}
        </span>
        <Button variant="ghost" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <Button onClick={openWalletModal} size="md">
      Connect Wallet
    </Button>
  )
}
