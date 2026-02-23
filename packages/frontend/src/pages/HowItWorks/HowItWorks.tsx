export function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl space-y-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white">How It Works</h1>
        <p className="mt-3 text-white/50">
          Satoshi Bets is an AI-native binary prediction market built on Bitcoin via Stacks L2.
          Trade YES/NO on real-world outcomes using sBTC as collateral.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-5 rounded-2xl border border-white/8 bg-surface p-6">
            <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15 text-orange-400 font-bold">
              {i + 1}
            </div>
            <div>
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-1 text-sm text-white/50 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AMM mechanics */}
      <div className="rounded-2xl border border-white/8 bg-surface p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">The AMM Model</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          Satoshi Bets uses a <span className="text-orange-400">Constant Product Market Maker (CPMM)</span>:
          the classic <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-xs">x × y = k</code> formula
          — the same used by Uniswap — applied to prediction shares instead of token pairs.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {fees.map((fee) => (
            <div key={fee.label} className="rounded-xl bg-dark-50 p-4 text-center">
              <p className="text-2xl font-bold font-mono text-orange-400">{fee.rate}</p>
              <p className="mt-1 text-xs text-white/40">{fee.label}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-dark-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Price Formula</p>
          <p className="font-mono text-sm text-white">YES price = NO_pool / (YES_pool + NO_pool)</p>
          <p className="font-mono text-sm text-white">NO price  = YES_pool / (YES_pool + NO_pool)</p>
          <p className="text-xs text-white/30 mt-2">Prices always sum to 1.0 (100%)</p>
        </div>
      </div>

      {/* Oracle system */}
      <div className="rounded-2xl border border-white/8 bg-surface p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Oracle & Resolution</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {oracles.map((o) => (
            <div key={o.name} className="rounded-xl bg-dark-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{o.icon}</span>
                <p className="text-sm font-semibold text-white">{o.name}</p>
              </div>
              <p className="text-xs text-white/40">{o.description}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/30">
          All resolutions have a 24-hour dispute window (~144 Stacks blocks). Anyone can stake sBTC
          to dispute a resolution. If undisputed, the result finalizes automatically on-chain.
        </p>
      </div>

      {/* AI modules */}
      <div className="rounded-2xl border border-white/8 bg-surface p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">AI-Powered Platform</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {aiModules.map((mod) => (
            <div key={mod.name} className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">
              <p className="text-sm font-semibold text-orange-400">{mod.name}</p>
              <p className="mt-1 text-xs text-white/50">{mod.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-white/8 bg-surface p-6">
        <h2 className="mb-3 text-xl font-bold text-white">Security & Settlement</h2>
        <p className="text-sm text-white/50 leading-relaxed">
          All contracts are written in <span className="text-white/70">Clarity</span> — Stacks' decidable smart contract
          language. Trades inherit <span className="text-orange-400">Bitcoin finality</span> through the Stacks Nakamoto
          upgrade. sBTC is a 1:1 Bitcoin-backed asset governed by a decentralized signer set.
          Mainnet deployment will follow a third-party security audit.
        </p>
      </div>
    </div>
  )
}

const steps = [
  {
    title: 'Connect Your Wallet',
    description: 'Use Leather or Xverse wallet to connect. No sign-up or KYC required — just your Stacks address.',
  },
  {
    title: 'Browse AI-Generated Markets',
    description: 'Markets are automatically created by Claude every 4 hours based on trending crypto/macro events. Each market has a clear YES/NO question and resolution criteria.',
  },
  {
    title: 'Trade YES or NO Shares',
    description: 'Deposit sBTC to buy YES or NO shares. The AMM gives you an instant quote showing estimated shares, fee, and price impact before you confirm.',
  },
  {
    title: 'Market Resolves',
    description: 'When the resolution block arrives, the oracle agent checks on-chain data (Pyth price feeds) and off-chain evidence to determine the outcome.',
  },
  {
    title: 'Claim Your Winnings',
    description: 'If your side wins, claim your proportional share of the losing pool plus your original stake. 1% claim fee goes to the protocol.',
  },
]

const fees = [
  { rate: '2%', label: 'Buy fee' },
  { rate: '1%', label: 'Sell fee' },
  { rate: '1%', label: 'Claim fee' },
]

const oracles = [
  { icon: '🔗', name: 'Pyth Network', description: 'Price-based markets auto-resolve using Pyth oracle VAA proofs at >95% confidence' },
  { icon: '🤖', name: 'AI Oracle Agent', description: 'Claude researches off-chain events and submits resolutions with structured evidence' },
  { icon: '👤', name: 'Manual Override', description: 'Admin can override disputed resolutions after the 24h window' },
]

const aiModules = [
  { name: 'Market Generator', description: 'Creates 3 new market proposals every 4h from CoinGecko + NewsAPI signals. Admin approves before deployment.' },
  { name: 'Research Assistant', description: 'On-demand YES/NO analysis brief for any market. Cached 15 minutes. Cites real sources.' },
  { name: 'Oracle Agent', description: 'Reads Pyth price feeds + news, evaluates resolution criteria, auto-submits when ≥95% confident.' },
  { name: 'Market Maker', description: 'Seeds 0.1 sBTC of initial liquidity to every new market pool, split by the initial probability estimate.' },
]
