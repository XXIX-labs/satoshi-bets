import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts'
import { formatProbability } from '../../lib/formatters.js'

interface PricePoint {
  timestamp: number
  yesPrice: number
}

interface ProbabilityChartProps {
  data: PricePoint[]
  height?: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-white/10 bg-dark-50 px-3 py-2 text-sm shadow-xl">
      <div className="font-mono text-orange-400">{formatProbability(payload[0].value)}</div>
      <div className="text-xs text-white/40">YES probability</div>
    </div>
  )
}

export function ProbabilityChart({ data, height = 200 }: ProbabilityChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <XAxis dataKey="timestamp" hide />
        <YAxis domain={[0, 1_000_000]} tickFormatter={(v) => `${(v / 10_000).toFixed(0)}%`} width={40} tick={{ fill: '#ffffff40', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={500_000} stroke="#ffffff15" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="yesPrice"
          stroke="#F7931A"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#F7931A' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
