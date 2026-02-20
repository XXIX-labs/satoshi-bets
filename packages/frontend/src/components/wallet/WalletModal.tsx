import { useUiStore } from '../../stores/uiStore.js'
import { useWallet } from '../../hooks/useWallet.js'
import { Modal } from '../ui/Modal.js'
import { Button } from '../ui/Button.js'

export function WalletModal() {
  const { walletModalOpen, closeWalletModal } = useUiStore()
  const { connect, isConnecting } = useWallet()

  return (
    <Modal open={walletModalOpen} onClose={closeWalletModal} title="Connect Wallet" size="sm">
      <p className="mb-6 text-sm text-white/60">
        Connect your Stacks wallet to start trading on Satoshi Bets.
      </p>
      <div className="flex flex-col gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="w-full justify-start gap-3"
          loading={isConnecting}
          onClick={() => connect('leather')}
        >
          <img src="/wallets/leather.svg" alt="" className="h-6 w-6 rounded-md" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span className="flex-1 text-left">Leather Wallet</span>
          <span className="text-xs text-white/40">Recommended</span>
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="w-full justify-start gap-3"
          loading={isConnecting}
          onClick={() => connect('xverse')}
        >
          <img src="/wallets/xverse.svg" alt="" className="h-6 w-6 rounded-md" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <span className="flex-1 text-left">Xverse Wallet</span>
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-white/40">
        New to Stacks?{' '}
        <a href="https://leather.io" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">
          Get Leather →
        </a>
      </p>
    </Modal>
  )
}
