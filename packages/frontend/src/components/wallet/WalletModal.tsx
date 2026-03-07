import { Modal } from '../ui/Modal.js'
import { useUiStore } from '../../stores/uiStore.js'
import { useWallet } from '../../hooks/useWallet.js'

const WALLETS = [
  {
    id: 'leather',
    name: 'LEATHER',
    description: 'Browser extension',
    icon: '🟠',
  },
  {
    id: 'xverse',
    name: 'XVERSE',
    description: 'Mobile & extension',
    icon: '🔵',
  },
]

export function WalletModal() {
  const { walletModalOpen, closeWalletModal } = useUiStore()
  const { connect, isConnecting } = useWallet()

  return (
    <Modal open={walletModalOpen} onClose={closeWalletModal} title="CONNECT WALLET">
      <div className="space-y-2">
        {WALLETS.map((wallet) => (
          <button
            key={wallet.id}
            onClick={() => connect()}
            disabled={isConnecting}
            className="row-item w-full flex items-center gap-4 rounded-md border border-border bg-s0 p-4 text-left transition-all hover:border-border-active hover:bg-s1 disabled:opacity-40"
          >
            <span className="text-2xl">{wallet.icon}</span>
            <div className="flex-1">
              <p className="font-mono text-[12px] font-medium text-t1 tracking-wider">{wallet.name}</p>
              <p className="font-mono text-[10px] text-t3">{wallet.description}</p>
            </div>
            <svg className="h-4 w-4 text-t4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
      <p className="mt-4 text-center font-mono text-[10px] text-t4 tracking-wider">
        STACKS L2 · BITCOIN SETTLEMENT
      </p>
    </Modal>
  )
}
