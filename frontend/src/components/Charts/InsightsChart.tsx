'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ChartData } from '@/lib/types'

const COLORS = ['#4f6ef7', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface Props {
  data: ChartData
  height?: number
}

function formatValue(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`
  return v.toString()
}

function normaliseData(series: ChartData['series'], xKey: string): Record<string, unknown>[] {
  // Flatten single-series data keyed by x_key
  const primary = series[0]?.data || []
  return primary.map((pt) => {
    const row: Record<string, unknown> = {}
    row[xKey] = pt[xKey] || pt['name'] || pt['genre'] || pt['city'] || pt['channel'] || pt['age_group'] || pt['month'] || String(Object.values(pt)[0])
    series.forEach((s) => {
      const matching = s.data.find((d) =>
        (d[xKey] || d['name'] || d['genre'] || d['city']) === row[xKey]
      )
      row[s.name] = matching?.['value'] ?? 0
    })
    return row
  })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-surface-500 bg-surface-800 px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-medium text-slate-200">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill || p.stroke }}>
          {p.name}: {formatValue(p.value)}
        </p>
      ))}
    </div>
  )
}

export default function InsightsChart({ data, height = 260 }: Props) {
  const flatData = normaliseData(data.series, data.x_key)
  const seriesKeys = data.series.map((s) => s.name)

  const axisProps = {
    tick: { fill: '#6b7a99', fontSize: 11 },
    axisLine: { stroke: '#243050' },
    tickLine: false,
  }

  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke="#1e2a42" vertical={false} />

  if (data.chart_type === 'pie') {
    const pieData = data.series[0]?.data.map((pt) => ({
      name: String(pt['name'] || pt[data.x_key] || ''),
      value: Number(pt['value'] || 0),
    })) || []
    return (
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-200">{data.title}</p>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#6b7a99' }}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (data.chart_type === 'line' || data.chart_type === 'area') {
    const Chart = data.chart_type === 'area' ? AreaChart : LineChart
    return (
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-200">{data.title}</p>
        <ResponsiveContainer width="100%" height={height}>
          <Chart data={flatData}>
            {commonGrid}
            <XAxis dataKey={data.x_key} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={formatValue} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#6b7a99' }} />
            {seriesKeys.map((key, i) =>
              data.chart_type === 'area' ? (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[i % COLORS.length]}
                  fill={`${COLORS[i % COLORS.length]}33`}
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                />
              )
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Default: bar chart
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-slate-200">{data.title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={flatData} barCategoryGap="30%">
          {commonGrid}
          <XAxis
            dataKey={data.x_key}
            {...axisProps}
            tickFormatter={(v) => String(v).length > 10 ? String(v).slice(0, 10) + '…' : v}
          />
          <YAxis {...axisProps} tickFormatter={formatValue} width={50} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#6b7a99' }} />
          {seriesKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
