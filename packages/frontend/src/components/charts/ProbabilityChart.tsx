import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts'

interface PricePoint { timestamp: number; yesPrice: number }

interface ProbabilityChartProps {
  data: PricePoint[]
}

export function ProbabilityChart({ data }: ProbabilityChartProps) {
  const formatted = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    prob: d.yesPrice / 10_000,
  }))

  return (
    <div className="h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(28, 100%, 54%)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(28, 100%, 54%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(222, 18%, 14%)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: 'hsl(210, 10%, 44%)', fontFamily: 'Chivo Mono' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(222, 18%, 14%)' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: 'hsl(210, 10%, 44%)', fontFamily: 'Chivo Mono' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ReferenceLine
            y={50}
            stroke="hsl(210, 10%, 28%)"
            strokeDasharray="4 4"
            label={{
              value: '50%',
              position: 'right',
              fill: 'hsl(210, 10%, 34%)',
              fontSize: 10,
              fontFamily: 'Chivo Mono',
            }}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(222, 14%, 8%)',
              border: '1px solid hsl(222, 18%, 16%)',
              borderRadius: '6px',
              fontFamily: 'Chivo Mono',
              fontSize: '11px',
              color: 'hsl(210, 28%, 93%)',
              padding: '8px 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}
            formatter={(value: number) => [`${value.toFixed(1)}%`, 'YES']}
          />
          <Area
            type="monotone"
            dataKey="prob"
            stroke="hsl(28, 100%, 54%)"
            strokeWidth={2}
            fill="url(#probGrad)"
            dot={false}
            activeDot={{ r: 3, stroke: 'hsl(28, 100%, 54%)', strokeWidth: 2, fill: 'hsl(222, 14%, 8%)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
