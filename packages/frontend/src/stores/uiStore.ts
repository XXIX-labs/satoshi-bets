import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

interface UiState {
  walletModalOpen: boolean
  toasts: Toast[]
  openWalletModal: () => void
  closeWalletModal: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  walletModalOpen: false,
  toasts: [],
  openWalletModal: () => set({ walletModalOpen: true }),
  closeWalletModal: () => set({ walletModalOpen: false }),
  addToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: Math.random().toString(36).slice(2) }],
    })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
