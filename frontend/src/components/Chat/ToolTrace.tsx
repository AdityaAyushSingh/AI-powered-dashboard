'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Wrench, Clock } from 'lucide-react'
import clsx from 'clsx'
import type { ToolCall } from '@/lib/types'

const TOOL_LABELS: Record<string, string> = {
  query_business_data: 'SQL Query',
  search_documents:    'Document Search',
  analyze_csv:         'CSV Analysis',
  get_chart_data:      'Chart Data',
}

const TOOL_COLORS: Record<string, { light: string; dark: string }> = {
  query_business_data: {
    light: 'text-sky-700 bg-sky-50 border-sky-200',
    dark:  'text-sky-300 bg-sky-950/30 border-sky-800',
  },
  search_documents: {
    light: 'text-amber-700 bg-amber-50 border-amber-200',
    dark:  'text-amber-300 bg-amber-950/30 border-amber-800',
  },
  analyze_csv: {
    light: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    dark:  'text-emerald-300 bg-emerald-950/30 border-emerald-800',
  },
  get_chart_data: {
    light: 'text-violet-700 bg-violet-50 border-violet-200',
    dark:  'text-violet-300 bg-violet-950/30 border-violet-800',
  },
}

export default function ToolTrace({ calls }: { calls: ToolCall[] }) {
  const [open, setOpen] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  if (!calls.length) return null

  const successCount = calls.filter((c) => c.success).length
  const totalMs      = calls.reduce((s, c) => s + c.duration_ms, 0)

  return (
    <div className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
      >
        <div className="flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400">
          <Wrench className="w-3.5 h-3.5" />
          <span className="font-medium">{calls.length} tool{calls.length > 1 ? 's' : ''} used</span>
          <span className="text-surface-300 dark:text-surface-600">·</span>
          <span className={successCount === calls.length ? 'text-success-600 dark:text-success-500' : 'text-warning-600 dark:text-warning-500'}>
            {successCount}/{calls.length} succeeded
          </span>
          <span className="text-surface-300 dark:text-surface-600">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {totalMs}ms
          </span>
        </div>
        {open
          ? <ChevronUp   className="w-3.5 h-3.5 text-surface-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-surface-400" />}
      </button>

      {open && (
        <div className="divide-y divide-surface-100 dark:divide-surface-700 bg-surface-0 dark:bg-surface-800/30 animate-slide-up">
          {calls.map((call, i) => (
            <div key={i}>
              <button
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors text-left"
              >
                {call.success
                  ? <CheckCircle className="w-3.5 h-3.5 text-success-500 flex-none" />
                  : <XCircle    className="w-3.5 h-3.5 text-danger-500  flex-none" />}

                <span className={clsx(
                  'text-2xs font-semibold px-1.5 py-0.5 rounded border flex-none',
                  TOOL_COLORS[call.tool]?.light ?? 'text-surface-600 bg-surface-100 border-surface-200',
                  'dark:' + (TOOL_COLORS[call.tool]?.dark?.split(' ').join(' dark:') ?? ''),
                )}>
                  {TOOL_LABELS[call.tool] ?? call.tool}
                </span>

                <span className="flex-1 text-xs text-surface-500 dark:text-surface-400 truncate font-mono">
                  {summariseInput(call.tool, call.input)}
                </span>

                <span className="text-2xs text-surface-400 dark:text-surface-500 flex-none tabular-nums">{call.duration_ms}ms</span>

                {expandedIdx === i
                  ? <ChevronUp   className="w-3 h-3 text-surface-300 dark:text-surface-600 flex-none" />
                  : <ChevronDown className="w-3 h-3 text-surface-300 dark:text-surface-600 flex-none" />}
              </button>

              {expandedIdx === i && (
                <div className="px-3.5 pb-3 space-y-2 border-t border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 animate-fade-in">
                  <JsonBlock label="Input"  value={call.input}  />
                  <JsonBlock label="Output" value={call.output} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function summariseInput(tool: string, input: Record<string, unknown>): string {
  if (tool === 'query_business_data') return `${input.query_type ?? ''}${input.title ? ` · ${input.title}` : ''}`
  if (tool === 'search_documents')    return String(input.query ?? '').slice(0, 60)
  if (tool === 'analyze_csv')         return `${input.filename} · ${input.operation}`
  if (tool === 'get_chart_data')      return `${input.chart_type} · ${input.dataset}`
  return JSON.stringify(input).slice(0, 60)
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="pt-2">
      <p className="text-2xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-1">{label}</p>
      <pre className="text-2xs text-surface-600 dark:text-surface-300 bg-surface-0 dark:bg-surface-800 rounded-lg px-2.5 py-2 overflow-x-auto font-mono leading-relaxed max-h-36 border border-surface-200 dark:border-surface-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}
