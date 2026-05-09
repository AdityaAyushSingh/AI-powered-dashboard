'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, PieChart as PieIcon, Map } from 'lucide-react'
import clsx from 'clsx'
import InsightsChart from './InsightsChart'
import { MOCK_GENRE_CHART, MOCK_REVENUE_TREND, MOCK_DEVICE_CHART, MOCK_REGION_CHART } from '@/lib/mockData'

const CHART_VIEWS = [
  { id: 'genre',   label: 'Genre Views',   icon: BarChart3,   data: MOCK_GENRE_CHART },
  { id: 'revenue', label: 'Revenue Trend', icon: TrendingUp,  data: MOCK_REVENUE_TREND },
  { id: 'device',  label: 'By Device',     icon: PieIcon,     data: MOCK_DEVICE_CHART },
  { id: 'region',  label: 'By Region',     icon: Map,         data: MOCK_REGION_CHART },
] as const

export default function ChartsPanel() {
  const [activeChart, setActiveChart] = useState<string>('genre')

  const currentView = CHART_VIEWS.find((v) => v.id === activeChart) ?? CHART_VIEWS[0]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 shrink-0">
        <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100">
          Visual Summaries
        </h2>
        <p className="text-2xs text-surface-400 dark:text-surface-500 mt-0.5">
          Interactive charts from platform analytics
        </p>
      </div>

      {/* Chart type selector */}
      <div className="px-3 py-2 border-b border-surface-100 dark:border-surface-800 shrink-0">
        <div className="flex gap-1">
          {CHART_VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveChart(id)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-2xs font-medium transition-all',
                activeChart === id
                  ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                  : 'text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 border border-transparent',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 p-4 shadow-soft animate-fade-in">
          <InsightsChart data={currentView.data} height={240} />
        </div>

        {/* Summary metrics below chart */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {currentView.data.series[0]?.data.slice(0, 4).map((point, idx) => {
            const name = String(point[currentView.data.x_key] || point.name || '')
            const value = Number(point.value || 0)
            return (
              <div
                key={idx}
                className="rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 px-3 py-2"
              >
                <p className="text-2xs text-surface-400 dark:text-surface-500 truncate">{name}</p>
                <p className="text-sm font-semibold text-surface-800 dark:text-surface-100 tabular-nums">
                  {formatCompactValue(value)}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function formatCompactValue(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  if (n < 100) return `${n}%`
  return n.toString()
}
