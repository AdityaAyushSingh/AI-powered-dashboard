'use client'

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ChartData } from '@/lib/types'

const COLORS = ['#6366f1', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

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
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 px-3.5 py-2.5 text-xs shadow-popup animate-tooltip">
      <p className="mb-1.5 font-semibold text-surface-800 dark:text-surface-100">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.stroke }} />
          <span className="text-surface-500 dark:text-surface-400">{p.name}:</span>
          <span className="font-medium text-surface-800 dark:text-surface-100">{formatValue(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export default function InsightsChart({ data, height = 260 }: Props) {
  const flatData = normaliseData(data.series, data.x_key)
  const seriesKeys = data.series.map((s) => s.name)

  const axisProps = {
    tick: { fill: 'var(--axis-text, #64748b)', fontSize: 11 },
    axisLine: { stroke: 'var(--axis-line, #e2e8f0)' },
    tickLine: false,
  }

  const gridStroke = 'var(--grid-stroke, #f1f5f9)'

  const commonGrid = <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} vertical={false} />

  if (data.chart_type === 'pie') {
    const pieData = data.series[0]?.data.map((pt) => ({
      name: String(pt['name'] || pt[data.x_key] || ''),
      value: Number(pt['value'] || 0),
    })) || []
    return (
      <div style={{ '--axis-text': '#64748b', '--axis-line': '#e2e8f0', '--grid-stroke': '#f1f5f9' } as React.CSSProperties}>
        <p className="mb-3 text-sm font-semibold text-surface-800 dark:text-surface-100">{data.title}</p>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              dataKey="value"
              strokeWidth={2}
              stroke="var(--pie-stroke, #ffffff)"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#94a3b8' }}
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
        <p className="mb-3 text-sm font-semibold text-surface-800 dark:text-surface-100">{data.title}</p>
        <ResponsiveContainer width="100%" height={height}>
          <Chart data={flatData}>
            {commonGrid}
            <XAxis dataKey={data.x_key} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={formatValue} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {seriesKeys.map((key, i) =>
              data.chart_type === 'area' ? (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLORS[i % COLORS.length]}
                  fill={`${COLORS[i % COLORS.length]}20`}
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
                  dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: COLORS[i % COLORS.length], stroke: '#fff', strokeWidth: 2 }}
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
      <p className="mb-3 text-sm font-semibold text-surface-800 dark:text-surface-100">{data.title}</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={flatData} barCategoryGap="30%">
          {commonGrid}
          <XAxis
            dataKey={data.x_key}
            {...axisProps}
            tickFormatter={(v) => String(v).length > 10 ? String(v).slice(0, 10) + '…' : v}
          />
          <YAxis {...axisProps} tickFormatter={formatValue} width={50} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {seriesKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
