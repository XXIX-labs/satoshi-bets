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
      <div className="rounded-lg border border-border bg-s0 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-t1">AI RESEARCH BRIEF</h3>
            <p className="mt-0.5 font-mono text-[10px] text-t4 tracking-wider">CLAUDE SONNET 4.6</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExpand}>ANALYZE</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-s0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h3 className="font-display text-sm font-bold text-t1">AI RESEARCH BRIEF</h3>
          <p className="mt-0.5 font-mono text-[10px] text-t4 tracking-wider">CLAUDE SONNET 4.6</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>CLOSE</Button>
      </div>

      <div className="p-4 space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <Spinner size="sm" />
            <span className="font-mono text-xs text-t3">Analyzing market data...</span>
          </div>
        )}

        {research && !isLoading && (
          <>
            {/* Bull vs Bear */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-yes/20 bg-yes/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-yes" />
                  <span className="font-mono text-[9px] font-bold tracking-widest text-yes">YES CASE</span>
                </div>
                <p className="font-mono text-[11px] leading-relaxed text-t2">{research.bullishCase}</p>
              </div>
              <div className="rounded-md border border-no/20 bg-no/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-no" />
                  <span className="font-mono text-[9px] font-bold tracking-widest text-no">NO CASE</span>
                </div>
                <p className="font-mono text-[11px] leading-relaxed text-t2">{research.bearishCase}</p>
              </div>
            </div>

            {/* Key factors */}
            <div className="rounded-md border border-border bg-bg p-4">
              <span className="font-mono text-[9px] text-t4 tracking-widest">KEY FACTORS</span>
              <ul className="mt-2 space-y-1.5">
                {research.keyFactors.map((factor, i) => (
                  <li key={i} className="flex items-start gap-2 font-mono text-[11px] text-t2">
                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-orange" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>

            {/* Probability estimate */}
            <div className="flex items-center justify-between rounded-md border border-orange/20 bg-orange/5 p-4">
              <div>
                <span className="font-mono text-[9px] text-t4 tracking-widest">AI ASSESSMENT</span>
                <p className="mt-1 font-mono text-[11px] text-t1">{research.summary}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-[9px] text-t4 tracking-widest">EST. PROB</span>
                <p className="font-mono text-2xl font-bold text-orange tabular-nums">
                  {(research.probabilityEstimate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
