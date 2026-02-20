import { NavLink } from 'react-router-dom'
import { ConnectButton } from '../wallet/ConnectButton.js'
import { useBtcPrice } from '../../hooks/usePrice.js'
import { formatUsd } from '../../lib/formatters.js'
import { clsx } from 'clsx'

export function Navbar() {
  const { data: btcPrice } = useBtcPrice()

  return (
    <nav className="sticky top-0 z-40 border-b border-white/8 bg-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-lg font-bold">₿</div>
          <span className="text-lg font-bold text-white">Satoshi Bets</span>
          <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-400">testnet</span>
        </NavLink>

        {/* Nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {[
            { to: '/', label: 'Markets' },
            { to: '/portfolio', label: 'Portfolio' },
            { to: '/how-it-works', label: 'How It Works' },
          ].map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx('rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-white/8 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white')
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right: BTC price + connect */}
        <div className="flex items-center gap-4">
          {btcPrice && (
            <div className="hidden items-center gap-1.5 text-sm md:flex">
              <span className="text-orange-500">₿</span>
              <span className="font-mono text-white">{formatUsd(btcPrice.price)}</span>
            </div>
          )}
          <ConnectButton />
        </div>
      </div>
    </nav>
  )
}
