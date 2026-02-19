import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  address: string | null
  publicKey: string | null
  walletProvider: 'leather' | 'xverse' | null
  isConnecting: boolean
  setWallet: (address: string, publicKey: string, provider: 'leather' | 'xverse') => void
  disconnect: () => void
  setConnecting: (v: boolean) => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      publicKey: null,
      walletProvider: null,
      isConnecting: false,
      setWallet: (address, publicKey, provider) =>
        set({ address, publicKey, walletProvider: provider, isConnecting: false }),
      disconnect: () => set({ address: null, publicKey: null, walletProvider: null }),
      setConnecting: (v) => set({ isConnecting: v }),
    }),
    {
      name: 'satoshi-bets-wallet',
      partialize: (s) => ({ address: s.address, publicKey: s.publicKey, walletProvider: s.walletProvider }),
    }
  )
)
