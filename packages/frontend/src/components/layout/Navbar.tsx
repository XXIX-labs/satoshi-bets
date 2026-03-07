import { NavLink } from 'react-router-dom'
import { ConnectButton } from '../wallet/ConnectButton.js'
import { useBtcPrice } from '../../hooks/usePrice.js'
import { formatUsd } from '../../lib/formatters.js'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { to: '/', label: 'MARKETS', end: true },
  { to: '/portfolio', label: 'PORTFOLIO' },
  { to: '/how-it-works', label: 'LEARN' },
]

function LiveTicker() {
  const { data: btcPrice } = useBtcPrice()
  const price = btcPrice?.price ?? 0

  const items = [
    { label: 'BTC/USD', value: price ? formatUsd(price) : '---', accent: true },
    { label: 'NETWORK', value: 'STACKS L2' },
    { label: 'SETTLEMENT', value: 'BITCOIN' },
    { label: 'COLLATERAL', value: 'sBTC' },
  ]

  // Duplicate items for seamless loop
  const doubled = [...items, ...items]

  return (
    <div className="overflow-hidden border-b border-border bg-bg/90">
      <div className="animate-ticker flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <div key={i} className="inline-flex items-center gap-4 px-6 py-1.5">
            <span className="text-[10px] font-mono tracking-wider text-t4">{item.label}</span>
            <span className={clsx(
              'text-[11px] font-mono font-medium',
              item.accent ? 'text-orange' : 'text-t2'
            )}>
              {item.value}
            </span>
            <span className="text-t4/30 text-[10px]">|</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40">
      <LiveTicker />
      <nav className="border-b border-border bg-s0/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-[var(--gutter)] h-12">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-orange text-bg font-display font-extrabold text-sm transition-shadow group-hover:shadow-orange-sm">
              S
            </div>
            <span className="font-display text-[15px] font-bold tracking-tight text-t1 hidden sm:inline">
              SATOSHI BETS
            </span>
          </NavLink>

          {/* Nav links — center */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => clsx(
                  'px-3 py-1.5 rounded font-mono text-[11px] font-medium tracking-wider transition-all duration-150',
                  isActive
                    ? 'bg-orange/10 text-orange border border-orange/20'
                    : 'text-t3 hover:text-t1 hover:bg-s1 border border-transparent'
                )}
              >
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ConnectButton />
          </div>
        </div>
      </nav>
    </header>
  )
}
