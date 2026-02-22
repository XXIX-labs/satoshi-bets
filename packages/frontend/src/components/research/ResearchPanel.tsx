import { useState } from 'react'
import { useResearch } from '../../hooks/useResearch.js'
import { Button } from '../ui/Button.js'
import { Spinner } from '../ui/Spinner.js'
import type { Market } from '../../lib/types.js'

interface ResearchPanelProps {
  market: Market
}

export function ResearchPanel({ market }: ResearchPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const { research, isLoading, fetchResearch } = useResearch(market.id)

  const handleExpand = () => {
    setExpanded(true)
    if (!research) fetchResearch()
  }

  if (!expanded) {
    return (
      <div className="rounded-2xl border border-white/8 bg-surface p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">AI Research Brief</h3>
            <p className="mt-0.5 text-xs text-white/40">Powered by Claude claude-sonnet-4-6</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExpand}>
            View Analysis
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">AI Research Brief</h3>
          <p className="mt-0.5 text-xs text-white/40">Powered by Claude claude-sonnet-4-6</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
          Collapse
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-3">
          <Spinner size="sm" />
          <span className="text-sm text-white/40">Analyzing market data...</span>
        </div>
      )}

      {research && !isLoading && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-green-400">YES Case</span>
              </div>
              <p className="text-sm leading-relaxed text-white/70">{research.bullishCase}</p>
            </div>
            <div className="flex-1 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs font-semibold uppercase tracking-wide text-red-400">NO Case</span>
              </div>
              <p className="text-sm leading-relaxed text-white/70">{research.bearishCase}</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-dark-50 p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Key Factors</h4>
            <ul className="space-y-1.5">
              {research.keyFactors.map((factor, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-500" />
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <div>
              <p className="text-xs text-white/40">AI Confidence Assessment</p>
              <p className="mt-1 text-sm font-medium text-white">{research.summary}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/40">Est. Probability</p>
              <p className="text-2xl font-bold font-mono text-orange-400">
                {(research.probabilityEstimate * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {research.sources.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">Sources</h4>
              <div className="flex flex-wrap gap-2">
                {research.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50 transition-colors hover:text-orange-400"
                  >
                    Source {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
