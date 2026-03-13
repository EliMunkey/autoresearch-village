'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ProgressChart({
  history,
  metricName,
  direction,
}: {
  history: { timestamp: string; value: number }[]
  metricName: string
  direction: 'lower' | 'higher'
}) {
  return (
    <div className="rounded-xl border border-sand-dark bg-white p-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={history}>
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            tick={{ fill: 'var(--color-charcoal-light)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: 'var(--color-charcoal-light)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            reversed={direction === 'lower'}
          />
          <Tooltip
            labelFormatter={(label) => formatDate(String(label))}
            formatter={(value) => [
              `${value} ${metricName}`,
              'Value',
            ]}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e0dcd4',
              fontSize: '13px',
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#E07A5F"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
