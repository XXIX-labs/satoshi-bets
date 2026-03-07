import { clsx } from 'clsx'

export function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 animate-fade-up">
      {/* Hero */}
      <header className="text-center py-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-t1 sm:text-4xl">
          HOW IT WORKS
        </h1>
        <p className="mt-3 font-mono text-xs text-t3 max-w-lg mx-auto leading-relaxed">
          Binary prediction markets on Bitcoin via Stacks L2.
          Trade YES/NO with sBTC. AI-generated. Oracle-resolved.
        </p>
      </header>

      {/* Steps */}
      <div className="space-y-2 stagger">
        {STEPS.map((step, i) => (
          <div key={i} className="row-item flex gap-4 rounded-lg border border-border bg-s0 p-5">
            <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded bg-orange/15 font-mono text-sm font-bold text-orange">
              {i + 1}
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-t1">{step.title}</h3>
              <p className="mt-1 font-mono text-[11px] text-t3 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* AMM */}
      <section className="rounded-lg border border-border bg-s0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-t1">THE AMM MODEL</h2>
        </div>
        <div className="p-5 space-y-4">
          <p className="font-mono text-[11px] text-t3 leading-relaxed">
            Constant Product Market Maker (CPMM):
            <code className="ml-1 px-1.5 py-0.5 rounded bg-s2 border border-border text-orange text-[10px]">x × y = k</code>
            — the same formula used by Uniswap, applied to prediction shares.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { rate: '2%', label: 'BUY FEE' },
              { rate: '1%', label: 'SELL FEE' },
              { rate: '1%', label: 'CLAIM FEE' },
            ].map((f) => (
              <div key={f.label} className="rounded-md border border-border bg-bg p-3 text-center">
                <p className="font-mono text-xl font-bold text-orange tabular-nums">{f.rate}</p>
                <p className="mt-0.5 font-mono text-[9px] text-t4 tracking-widest">{f.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border bg-bg p-4 space-y-1.5">
            <span className="font-mono text-[9px] text-t4 tracking-widest">PRICE FORMULA</span>
            <p className="font-mono text-[11px] text-t1">YES = NO_pool / (YES_pool + NO_pool)</p>
            <p className="font-mono text-[11px] text-t1">NO  = YES_pool / (YES_pool + NO_pool)</p>
            <p className="font-mono text-[10px] text-t4 mt-2">Prices always sum to 1.0 (100%)</p>
          </div>
        </div>
      </section>

      {/* Oracle */}
      <section className="rounded-lg border border-border bg-s0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-t1">ORACLE & RESOLUTION</h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {ORACLES.map((o) => (
              <div key={o.name} className="rounded-md border border-border bg-bg p-4">
                <p className="font-display text-sm font-bold text-t1">{o.name}</p>
                <p className="mt-1 font-mono text-[10px] text-t3 leading-relaxed">{o.desc}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-t4">
            All resolutions have a 24h dispute window (~144 Stacks blocks).
            Stake sBTC to dispute. Undisputed results finalize automatically.
          </p>
        </div>
      </section>

      {/* AI Modules */}
      <section className="rounded-lg border border-border bg-s0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-t1">AI MODULES</h2>
          <p className="mt-0.5 font-mono text-[10px] text-t4 tracking-wider">CLAUDE SONNET 4.6</p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          {AI_MODULES.map((m) => (
            <div key={m.name} className="bg-s0 p-4">
              <p className="font-display text-sm font-bold text-orange">{m.name}</p>
              <p className="mt-1 font-mono text-[10px] text-t3 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security */}
      <section className="rounded-lg border border-border bg-s0 p-5">
        <h2 className="font-display text-lg font-bold text-t1 mb-3">SECURITY</h2>
        <p className="font-mono text-[11px] text-t3 leading-relaxed">
          Contracts written in <span className="text-t1">Clarity</span> — decidable, non-Turing complete.
          Trades inherit <span className="text-orange">Bitcoin finality</span> via Stacks Nakamoto.
          sBTC is 1:1 BTC-backed. Mainnet deployment follows third-party audit.
        </p>
      </section>
    </div>
  )
}

const STEPS = [
  { title: 'CONNECT WALLET', description: 'Leather or Xverse. No signup. No KYC. Just your Stacks address.' },
  { title: 'BROWSE MARKETS', description: 'AI-generated every 4h from crypto/macro signals. Clear YES/NO questions with resolution criteria.' },
  { title: 'TRADE SHARES', description: 'Deposit sBTC to buy YES or NO. Instant quote with shares, fee, and price impact before you sign.' },
  { title: 'MARKET RESOLVES', description: 'Oracle agent checks Pyth price feeds + off-chain evidence when the resolution block arrives.' },
  { title: 'CLAIM WINNINGS', description: 'Winners claim their proportional share of the losing pool + original stake. 1% claim fee.' },
]

const ORACLES = [
  { name: 'PYTH NETWORK', desc: 'Price markets auto-resolve from Pyth VAA proofs at >95% confidence' },
  { name: 'AI ORACLE', desc: 'Claude researches off-chain events and submits structured evidence' },
  { name: 'MANUAL OVERRIDE', desc: 'Admin override for disputed resolutions after the 24h window' },
]

const AI_MODULES = [
  { name: 'MARKET GENERATOR', desc: 'Creates 3 proposals every 4h from CoinGecko + NewsAPI. Admin approves before deploy.' },
  { name: 'RESEARCH ASSISTANT', desc: 'On-demand YES/NO brief for any market. 15min cache. Real sources.' },
  { name: 'ORACLE AGENT', desc: 'Evaluates expired markets. Auto-submits when confidence ≥95%.' },
  { name: 'MARKET MAKER', desc: 'Seeds 0.1 sBTC initial liquidity, split by probability estimate.' },
]
