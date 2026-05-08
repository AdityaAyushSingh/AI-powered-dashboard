'use client'

import { SlidersHorizontal } from 'lucide-react'
import type { Filters } from '@/lib/types'

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

const GENRES = ['', 'Action', 'Sci-Fi', 'Drama', 'Comedy', 'Thriller', 'Documentary', 'Romance', 'Sports']
const REGIONS = ['', 'North', 'South', 'East', 'West', 'Central']
const CITIES = ['', 'Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Bhopal', 'Nagpur']

const EXAMPLE_QUERIES = [
  'Which titles performed best in 2025?',
  'Why is Stellar Run trending recently?',
  'Compare Dark Orbit vs Last Kingdom.',
  'Which city had the strongest engagement last month?',
  'What explains weak comedy performance?',
  'What recommendations would you give for leadership?',
]

interface ExampleQueriesProps {
  onSelect: (q: string) => void
}

export function ExampleQueries({ onSelect }: ExampleQueriesProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted uppercase tracking-wide">Example queries</p>
      <div className="flex flex-col gap-1.5">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-left text-xs text-slate-400 hover:text-brand-300 hover:bg-surface-600 rounded px-2 py-1.5 transition-colors border border-transparent hover:border-surface-500 leading-tight"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

function Select({ label, value, options, onChange }: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-surface-500 bg-surface-700 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o || `All ${label}s`}</option>
        ))}
      </select>
    </div>
  )
}

export default function FilterPanel({ filters, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={13} className="text-brand-400" />
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Filters</p>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Year</label>
        <input
          type="number"
          value={filters.year || 2025}
          min={2020}
          max={2030}
          onChange={(e) => onChange({ ...filters, year: parseInt(e.target.value) || 2025 })}
          className="w-full rounded border border-surface-500 bg-surface-700 px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
        />
      </div>

      <Select
        label="Genre"
        value={filters.genre || ''}
        options={GENRES}
        onChange={(v) => onChange({ ...filters, genre: v || undefined })}
      />

      <Select
        label="Region"
        value={filters.region || ''}
        options={REGIONS}
        onChange={(v) => onChange({ ...filters, region: v || undefined })}
      />

      <Select
        label="City"
        value={filters.city || ''}
        options={CITIES}
        onChange={(v) => onChange({ ...filters, city: v || undefined })}
      />

      <button
        onClick={() => onChange({ year: 2025 })}
        className="w-full text-xs text-muted hover:text-slate-300 border border-surface-500 hover:border-surface-400 rounded py-1.5 transition-colors"
      >
        Reset filters
      </button>
    </div>
  )
}
