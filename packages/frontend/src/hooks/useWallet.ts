import { showConnect, type FinishedAuthData } from '@stacks/connect'
import { useWalletStore } from '../stores/walletStore.js'
import { useUiStore } from '../stores/uiStore.js'
import { APP_DETAILS } from '../config/stacks.js'

export function useWallet() {
  const { address, walletProvider, isConnecting, setWallet, disconnect, setConnecting } = useWalletStore()
  const { addToast, closeWalletModal } = useUiStore()

  const connect = (provider: 'leather' | 'xverse') => {
    setConnecting(true)

    showConnect({
      appDetails: APP_DETAILS,
      onFinish: (payload: FinishedAuthData) => {
        const userData = payload.userSession?.loadUserData()
        const stacksAddress = userData?.profile?.stxAddress?.testnet ?? userData?.profile?.stxAddress?.mainnet ?? ''
        setWallet(stacksAddress, '', provider)
        closeWalletModal()
        addToast({ type: 'success', message: `Connected with ${provider}` })
      },
      onCancel: () => {
        setConnecting(false)
        addToast({ type: 'info', message: 'Wallet connection cancelled' })
      },
    })
  }

  return { address, walletProvider, isConnecting, connect, disconnect }
}
