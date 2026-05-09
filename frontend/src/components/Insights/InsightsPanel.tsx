'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, TrendingDown, Users, Star, DollarSign, MapPin, Film,
  RefreshCw, AlertTriangle, Lightbulb, ChevronDown, ChevronUp,
  ArrowUpRight,
} from 'lucide-react'
import { fetchInsights, formatNumber, formatCurrency } from '@/lib/api'
import type { InsightsData } from '@/lib/types'
import { MOCK_INSIGHTS, MOCK_GENRE_CHART } from '@/lib/mockData'
import { useAppStore } from '@/lib/store'
import InsightsChart from '@/components/Charts/InsightsChart'

/* ─── KPI Card ──────────────────────────────────────────────────── */
function KPICard({
  icon, label, value, sub, trend, trendValue,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}) {
  return (
    <div className="group rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 px-3.5 py-3 hover:shadow-popup hover:border-brand-200 dark:hover:border-brand-800 transition-all">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-brand-500 dark:text-brand-400">{icon}</span>
          <span className="text-2xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">{label}</span>
        </div>
        {trend && trendValue && (
          <span className={`flex items-center gap-0.5 text-2xs font-semibold ${
            trend === 'up' ? 'text-success-600 dark:text-success-500' :
            trend === 'down' ? 'text-danger-600 dark:text-danger-500' :
            'text-surface-400'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-lg font-bold text-surface-900 dark:text-surface-50 leading-tight tabular-nums">{value}</p>
      {sub && <p className="text-2xs text-surface-400 dark:text-surface-500 mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

/* ─── Insight Card ──────────────────────────────────────────────── */
function InsightCard({
  icon, title, description, priority, details,
}: {
  icon: React.ReactNode
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  details?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const priorityColors = {
    high:   'bg-danger-50 dark:bg-danger-950/20 text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-800',
    medium: 'bg-warning-50 dark:bg-warning-950/20 text-warning-600 dark:text-warning-400 border-warning-200 dark:border-warning-800',
    low:    'bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800',
  }

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 overflow-hidden hover:shadow-soft transition-all">
      <div className="px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 text-surface-400 dark:text-surface-500">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-xs font-semibold text-surface-800 dark:text-surface-100 truncate">{title}</p>
              <span className={`text-2xs font-semibold px-1.5 py-0.5 rounded-full border ${priorityColors[priority]}`}>
                {priority}
              </span>
            </div>
            <p className="text-2xs text-surface-500 dark:text-surface-400 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>
      {details && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1 px-3.5 py-1.5 text-2xs font-medium text-surface-400 dark:text-surface-500 hover:text-brand-500 dark:hover:text-brand-400 border-t border-surface-100 dark:border-surface-700 transition-colors"
          >
            {expanded ? 'Show less' : 'Show more'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <div className="px-3.5 pb-3 text-2xs text-surface-500 dark:text-surface-400 leading-relaxed animate-slide-up">
              {details}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ─── Main Panel ────────────────────────────────────────────────── */
export default function InsightsPanel() {
  const { useMockData } = useAppStore()
  const [data, setData] = useState<InsightsData | null>(useMockData ? MOCK_INSIGHTS : null)
  const [loading, setLoading] = useState(!useMockData)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (useMockData) {
      setData(MOCK_INSIGHTS)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const d = await fetchInsights()
      setData(d)
    } catch {
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [useMockData]) // eslint-disable-line react-hooks/exhaustive-deps

  const genreChartData = data ? {
    chart_type: 'bar' as const,
    title: 'Views by Genre — 2025',
    x_key: 'genre',
    series: [{
      name: 'Views',
      data: data.genre_breakdown.map(g => ({ genre: g.genre, value: g.total_views })),
    }],
  } : null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-800 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100">Platform Insights</h2>
          <p className="text-2xs text-surface-400 dark:text-surface-500 mt-0.5">2025 YTD Performance</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors disabled:opacity-40"
          title="Refresh insights"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {error && (
          <p className="text-xs text-danger-600 dark:text-danger-400 rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/20 px-3 py-2">
            {error} — is the backend running?
          </p>
        )}

        {loading && !data && (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-[76px] rounded-xl" />
            ))}
          </div>
        )}

        {data && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-2">
              <KPICard
                icon={<TrendingUp size={14} />}
                label="Total Views"
                value={formatNumber(data.total_views_2025)}
                sub="Jan–Apr 2025"
                trend="up"
                trendValue="+18%"
              />
              <KPICard
                icon={<Users size={14} />}
                label="Active Viewers"
                value={formatNumber(data.active_viewers)}
                trend="up"
                trendValue="+12%"
              />
              <KPICard
                icon={<Star size={14} />}
                label="Avg Rating"
                value={`${data.avg_rating.toFixed(1)} / 5.0`}
                sub="Platform average"
                trend="up"
                trendValue="+0.3"
              />
              <KPICard
                icon={<DollarSign size={14} />}
                label="Revenue"
                value={formatCurrency(data.total_revenue_2025)}
                sub="2025 YTD"
                trend="up"
                trendValue="+22%"
              />
              <KPICard
                icon={<Film size={14} />}
                label="Top Title"
                value={data.top_title}
                sub={`Genre: ${data.top_genre}`}
              />
              <KPICard
                icon={<MapPin size={14} />}
                label="Top City"
                value={data.top_city}
                sub="Highest engagement"
              />
            </div>

            {/* Genre chart */}
            {genreChartData && (
              <div className="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 p-3 shadow-soft">
                <InsightsChart data={genreChartData} height={160} />
              </div>
            )}

            {/* AI Insights */}
            <div>
              <p className="flex items-center gap-1.5 text-2xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider mb-2 px-1">
                <Lightbulb className="w-3 h-3 text-brand-400" />
                AI-Generated Insights
              </p>
              <div className="space-y-2">
                <InsightCard
                  icon={<ArrowUpRight className="w-3.5 h-3.5" />}
                  title="Stellar Run Breakout"
                  description="Stellar Run views increased 34% month-over-month, becoming the top performer."
                  priority="high"
                  details="Social media mentions up 280%. Completion rate at 92%, highest for Action genre. Consider greenlighting Season 2 and expanding marketing in East/Central regions."
                />
                <InsightCard
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  title="Comedy Genre Underperformance"
                  description="Comedy has the lowest completion rate (65%) and rating (3.6). Needs quality investment."
                  priority="medium"
                  details="Recommend commissioning a flagship comedy original to lift the genre's perception. Current comedy titles lack strong leads and production value compared to top-performing genres."
                />
                <InsightCard
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                  title="Documentary Engagement Leader"
                  description="Highest completion rate (88%) and rating (4.5) despite lower total views."
                  priority="low"
                  details="Documentary viewers have the highest satisfaction metrics. Consider increasing documentary content budget by 20% for Q3 to capitalize on this loyal audience segment."
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
