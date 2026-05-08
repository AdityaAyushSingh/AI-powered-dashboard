'use client'

import { useState, useCallback, useRef } from 'react'
import { LayoutDashboard, MessageSquare, Info } from 'lucide-react'
import ChatInterface from '@/components/Chat/ChatInterface'
import FilterPanel, { ExampleQueries } from '@/components/Filters/FilterPanel'
import InsightsPanel from '@/components/Insights/InsightsPanel'
import type { Filters } from '@/lib/types'

export default function Home() {
  const [filters, setFilters] = useState<Filters>({ year: 2025 })
  const [activeRight, setActiveRight] = useState<'insights' | 'about'>('insights')

  // Relay example query click → ChatInterface
  const exampleQueryHandlerRef = useRef<((q: string) => void) | null>(null)
  const registerHandler = useCallback((handler: (q: string) => void) => {
    exampleQueryHandlerRef.current = handler
  }, [])
  const handleExampleClick = (q: string) => {
    exampleQueryHandlerRef.current?.(q)
  }

  return (
    <div className="flex h-full bg-surface-900 text-slate-200">
      {/* ── Left sidebar ───────────────────────────────────────────────── */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-surface-600 bg-surface-800 overflow-y-auto">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-surface-600">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">🎬</span>
            <span className="font-semibold text-slate-100 text-sm">StreamVision</span>
          </div>
          <p className="text-xs text-muted pl-7">Insights Assistant</p>
        </div>

        <div className="flex flex-col gap-5 px-4 py-4 flex-1">
          <FilterPanel filters={filters} onChange={setFilters} />

          <div className="border-t border-surface-600 pt-4">
            <ExampleQueries onSelect={handleExampleClick} />
          </div>
        </div>

        {/* Status indicator */}
        <div className="px-4 py-3 border-t border-surface-600">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini 2.5 Flash · tool use</span>
          </div>
        </div>
      </aside>

      {/* ── Main chat ──────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 h-full">
        <ChatInterface filters={filters} onExampleQuery={registerHandler} />
      </main>

      {/* ── Right panel ────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 flex flex-col border-l border-surface-600 bg-surface-800 overflow-hidden">
        {/* Tab strip */}
        <div className="flex border-b border-surface-600 shrink-0">
          {[
            { id: 'insights', label: 'Insights', icon: <LayoutDashboard size={12} /> },
            { id: 'about', label: 'About', icon: <Info size={12} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveRight(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                activeRight === tab.id
                  ? 'text-brand-400 border-b-2 border-brand-500'
                  : 'text-muted hover:text-slate-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeRight === 'insights' && <InsightsPanel />}
          {activeRight === 'about' && <AboutPanel />}
        </div>
      </aside>
    </div>
  )
}

function AboutPanel() {
  return (
    <div className="space-y-4 text-xs text-slate-400">
      <div>
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Architecture</h3>
        <p className="leading-relaxed mb-2">
          This assistant uses a tool-mediated agentic architecture. The AI model never accesses raw data directly —
          all queries are routed through validated backend tools.
        </p>
      </div>

      <div className="space-y-2">
        {[
          { color: 'bg-blue-500', label: 'SQL Tool', desc: 'Parameterised queries against SQLite. No raw SQL from the model.' },
          { color: 'bg-amber-500', label: 'Document Tool', desc: 'Semantic search over PDF reports via ChromaDB embeddings.' },
          { color: 'bg-emerald-500', label: 'CSV Tool', desc: 'Pandas-based tabular analysis of business data files.' },
          { color: 'bg-purple-500', label: 'Chart Tool', desc: 'Generates Recharts-compatible data for visual summaries.' },
        ].map((t) => (
          <div key={t.label} className="flex gap-2">
            <span className={`w-2 h-2 rounded-full ${t.color} mt-1 shrink-0`} />
            <div>
              <p className="font-medium text-slate-300">{t.label}</p>
              <p className="text-muted">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-surface-600 bg-surface-700 p-3 space-y-1">
        <p className="font-medium text-slate-300">Security model</p>
        <p>• Input validation & sanitisation</p>
        <p>• Parameterised SQL (injection-safe)</p>
        <p>• Access boundaries — AI uses tools, not raw DB</p>
        <p>• Data minimisation — no PII in model context</p>
        <p>• Structured logging with secret redaction</p>
      </div>

      <div className="rounded-lg border border-surface-600 bg-surface-700 p-3">
        <p className="font-medium text-slate-300 mb-1">Data sources</p>
        <p>SQL: SQLite with 6 tables · {'>'}6,000 watch events</p>
        <p>Docs: 5 internal PDF reports (ChromaDB)</p>
        <p>CSV: 6 business data files (pandas)</p>
      </div>
    </div>
  )
}
