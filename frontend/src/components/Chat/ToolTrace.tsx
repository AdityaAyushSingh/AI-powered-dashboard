'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, Zap } from 'lucide-react'
import type { ToolCall } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  toolTrace: ToolCall[]
  latencyMs: number
}

const TOOL_LABELS: Record<string, string> = {
  query_business_data: 'SQL Query',
  search_documents: 'Document Search',
  analyze_csv: 'CSV Analysis',
  get_chart_data: 'Chart Generation',
}

export default function ToolTrace({ toolTrace, latencyMs }: Props) {
  const [open, setOpen] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  if (toolTrace.length === 0) return null

  return (
    <div className="mt-3 rounded-lg border border-surface-600 bg-surface-800/60 text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-3 py-2 text-muted hover:text-slate-300 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-brand-400" />
          <span className="font-medium text-slate-300">
            {toolTrace.length} tool call{toolTrace.length !== 1 ? 's' : ''}
          </span>
          <span className="text-muted">
            {toolTrace.filter(t => t.success).length}/{toolTrace.length} succeeded
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-muted">
            <Clock size={10} />
            {latencyMs}ms total
          </span>
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </div>
      </button>

      {open && (
        <div className="border-t border-surface-600 divide-y divide-surface-600">
          {toolTrace.map((call, idx) => (
            <div key={idx}>
              <button
                className="flex w-full items-center justify-between px-3 py-2 hover:bg-surface-700/30 transition-colors text-left"
                onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              >
                <div className="flex items-center gap-2">
                  {call.success
                    ? <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                    : <XCircle size={12} className="text-red-400 shrink-0" />}
                  <span className={clsx('font-mono', call.success ? 'text-slate-300' : 'text-red-300')}>
                    {TOOL_LABELS[call.tool] || call.tool}
                  </span>
                  <span className="text-muted truncate max-w-[200px]">
                    {String(call.input.query_type || call.input.query || call.input.filename || call.input.dataset || '')}
                  </span>
                </div>
                <span className="text-muted shrink-0">{call.duration_ms}ms</span>
              </button>

              {expandedIdx === idx && (
                <div className="px-3 pb-3 space-y-2">
                  <div>
                    <p className="text-muted mb-1">Input:</p>
                    <pre className="bg-surface-900 rounded p-2 text-slate-400 overflow-x-auto text-xs">
                      {JSON.stringify(call.input, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Output (preview):</p>
                    <pre className="bg-surface-900 rounded p-2 text-slate-400 overflow-x-auto text-xs">
                      {JSON.stringify(call.output, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
