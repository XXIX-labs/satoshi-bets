import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar.js'
import { WalletModal } from '../wallet/WalletModal.js'
import { ToastContainer } from '../ui/Toast.js'

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-[var(--gutter)] py-6 sm:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border py-4 px-[var(--gutter)]">
        <div className="mx-auto max-w-[1400px] flex items-center justify-between">
          <span className="font-mono text-[10px] text-t4 tracking-wider">
            SATOSHI BETS · STACKS TESTNET
          </span>
          <span className="font-mono text-[10px] text-t4">
            BUILT ON BITCOIN
          </span>
        </div>
      </footer>
      <WalletModal />
      <ToastContainer />
    </div>
  )
}
