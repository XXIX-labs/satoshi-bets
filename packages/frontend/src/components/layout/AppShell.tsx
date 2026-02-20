import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar.js'
import { WalletModal } from '../wallet/WalletModal.js'
import { ToastContainer } from '../ui/Toast.js'

export function AppShell() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
      <WalletModal />
      <ToastContainer />
    </div>
  )
}
