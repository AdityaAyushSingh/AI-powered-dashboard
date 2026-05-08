'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, Users, Star, DollarSign, MapPin, Film, RefreshCw } from 'lucide-react'
import { fetchInsights, formatNumber, formatCurrency } from '@/lib/api'
import type { InsightsData } from '@/lib/types'
import InsightsChart from '@/components/Charts/InsightsChart'

function KPICard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-surface-600 bg-surface-700 px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-brand-400">{icon}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="text-base font-semibold text-slate-100 leading-tight">{value}</p>
      {sub && <p className="text-xs text-muted mt-0.5 truncate">{sub}</p>}
    </div>
  )
}

export default function InsightsPanel() {
  const [data, setData] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const d = await fetchInsights()
      setData(d)
    } catch (e) {
      setError('Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const genreChartData = data ? {
    chart_type: 'bar' as const,
    title: 'Views by Genre (2025)',
    x_key: 'genre',
    series: [{
      name: 'Views',
      data: data.genre_breakdown.map(g => ({ genre: g.genre, value: g.total_views })),
    }],
  } : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Platform KPIs — 2025</h2>
        <button onClick={load} disabled={loading}
          className="text-muted hover:text-slate-300 transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 rounded border border-red-900 bg-red-950/30 px-3 py-2">
          {error} — is the backend running?
        </p>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <KPICard icon={<TrendingUp size={13} />} label="Total Views"
              value={formatNumber(data.total_views_2025)} sub="Jan–Apr 2025" />
            <KPICard icon={<Users size={13} />} label="Active Viewers"
              value={formatNumber(data.active_viewers)} />
            <KPICard icon={<Star size={13} />} label="Avg Rating"
              value={`${data.avg_rating.toFixed(1)} / 5.0`} sub="Platform average" />
            <KPICard icon={<DollarSign size={13} />} label="Revenue"
              value={formatCurrency(data.total_revenue_2025)} sub="2025 YTD" />
            <KPICard icon={<Film size={13} />} label="Top Title"
              value={data.top_title} sub={`Genre: ${data.top_genre}`} />
            <KPICard icon={<MapPin size={13} />} label="Top City"
              value={data.top_city} />
          </div>

          {genreChartData && genreChartData.series[0].data.length > 0 && (
            <div className="rounded-lg border border-surface-600 bg-surface-700 p-3">
              <InsightsChart data={genreChartData} height={180} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
