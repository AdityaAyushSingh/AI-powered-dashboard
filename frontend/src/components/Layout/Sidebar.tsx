'use client'

import { useState } from 'react'
import {
  ChevronLeft, ChevronRight, SlidersHorizontal, RotateCcw,
  CalendarDays, Tag, MapPin, Building2, Search, Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '@/lib/store'

const GENRES  = ['Action', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller', 'Documentary', 'Romance', 'Sports']
const REGIONS = ['North', 'South', 'East', 'West', 'Central']
const CITIES  = ['Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Bhopal', 'Nagpur']

const EXAMPLE_QUERIES = [
  { label: 'Top performers',     q: 'Which titles performed best in 2025?' },
  { label: 'Stellar Run trend',  q: 'Why is Stellar Run trending recently?' },
  { label: 'Title comparison',   q: 'Compare Dark Orbit vs Last Kingdom.' },
  { label: 'City engagement',    q: 'Which city had the strongest engagement?' },
  { label: 'Comedy weakness',    q: 'What explains weak comedy performance?' },
  { label: 'Content roadmap',    q: 'What does the content roadmap say about priorities?' },
]

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, filters, setFilters, resetFilters, setPendingQuestion } = useAppStore()
  const [searchFilter, setSearchFilter] = useState('')
  const activeCount = [filters.genre, filters.region, filters.city].filter(Boolean).length

  const filteredQueries = searchFilter
    ? EXAMPLE_QUERIES.filter((eq) => eq.label.toLowerCase().includes(searchFilter.toLowerCase()) || eq.q.toLowerCase().includes(searchFilter.toLowerCase()))
    : EXAMPLE_QUERIES

  return (
    <aside
      className={clsx(
        'flex-none flex flex-col bg-surface-0 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 panel-transition overflow-hidden',
        sidebarOpen ? 'w-[252px]' : 'w-12',
      )}
    >
      {/* Toggle header */}
      <div className={clsx(
        'flex items-center h-11 px-3 border-b border-surface-100 dark:border-surface-800 shrink-0',
        sidebarOpen ? 'justify-between' : 'justify-center',
      )}>
        {sidebarOpen && (
          <div className="flex items-center gap-2 text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-surface-400 dark:text-surface-500" />
            Filters
            {activeCount > 0 && (
              <span className="bg-brand-600 text-white text-2xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-scale-in">
                {activeCount}
              </span>
            )}
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen
            ? <ChevronLeft  className="w-4 h-4" />
            : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto animate-fade-in">
          {/* Filter controls */}
          <div className="p-3 space-y-3">
            {/* Year */}
            <FilterField icon={<CalendarDays className="w-3.5 h-3.5" />} label="Year">
              <input
                type="number"
                min={2020}
                max={2030}
                value={filters.year ?? 2025}
                onChange={(e) => setFilters({ year: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
              />
            </FilterField>

            {/* Genre */}
            <FilterField icon={<Tag className="w-3.5 h-3.5" />} label="Genre">
              <SelectField
                value={filters.genre ?? ''}
                options={GENRES}
                placeholder="All genres"
                onChange={(v) => setFilters({ genre: v || undefined })}
              />
            </FilterField>

            {/* Region */}
            <FilterField icon={<MapPin className="w-3.5 h-3.5" />} label="Region">
              <SelectField
                value={filters.region ?? ''}
                options={REGIONS}
                placeholder="All regions"
                onChange={(v) => setFilters({ region: v || undefined })}
              />
            </FilterField>

            {/* City */}
            <FilterField icon={<Building2 className="w-3.5 h-3.5" />} label="City">
              <SelectField
                value={filters.city ?? ''}
                options={CITIES}
                placeholder="All cities"
                onChange={(v) => setFilters({ city: v || undefined })}
              />
            </FilterField>

            {/* Reset */}
            {activeCount > 0 && (
              <button
                onClick={resetFilters}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-danger-200 dark:hover:border-danger-800 transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                Reset filters
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="mx-3 border-t border-surface-100 dark:border-surface-800" />

          {/* Example queries */}
          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <p className="text-2xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                Try asking
              </p>
            </div>

            {/* Search filter */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-surface-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search queries…"
                className="w-full pl-7 pr-2 py-1.5 text-xs bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-700 dark:text-surface-300 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
              />
            </div>

            <div className="space-y-0.5">
              {filteredQueries.map(({ label, q }) => (
                <button
                  key={q}
                  onClick={() => setPendingQuestion(q)}
                  className="group w-full text-left px-2.5 py-2 text-xs text-surface-600 dark:text-surface-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 hover:text-brand-700 dark:hover:text-brand-300 transition-all leading-snug border border-transparent hover:border-brand-200 dark:hover:border-brand-900"
                >
                  <span className="font-medium">{label}</span>
                  <span className="block text-2xs text-surface-400 dark:text-surface-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 mt-0.5 truncate transition-colors">
                    {q}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Collapsed — just show filter icon with count */}
      {!sidebarOpen && (
        <div className="flex flex-col items-center gap-2 pt-3">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            title="Expand filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          {activeCount > 0 && (
            <span className="bg-brand-600 text-white text-2xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
      )}
    </aside>
  )
}

/* ── Sub-components ────────────────────────────────────────────── */

function FilterField({
  icon, label, children,
}: {
  icon:     React.ReactNode
  label:    string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-2xs font-medium text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-wider">
        <span className="text-surface-400 dark:text-surface-500">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  )
}

function SelectField({
  value, options, placeholder, onChange,
}: {
  value:       string
  options:     string[]
  placeholder: string
  onChange:    (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2.5 py-1.5 text-sm bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all appearance-none cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}
