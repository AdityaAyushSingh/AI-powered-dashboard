'use client'

import { useState } from 'react'
import {
  Search, Clock, Trash2, RotateCcw, ChevronDown, ChevronUp,
  MessageSquare, Wrench, CheckCircle, XCircle, Inbox,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '@/lib/store'
import SourceBadge from '@/components/SourceBadge/SourceBadge'

export default function HistoryPanel() {
  const { queryHistory, removeFromHistory, clearHistory, setPendingQuestion } = useAppStore()
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredHistory = search
    ? queryHistory.filter((h) =>
        h.question.toLowerCase().includes(search.toLowerCase()) ||
        h.answer.toLowerCase().includes(search.toLowerCase())
      )
    : queryHistory

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-surface-800 dark:text-surface-100">Query History</h2>
            <p className="text-2xs text-surface-400 dark:text-surface-500 mt-0.5">
              {queryHistory.length} past {queryHistory.length === 1 ? 'query' : 'queries'}
            </p>
          </div>
          {queryHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="text-2xs font-medium text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors px-2 py-1 rounded-md hover:bg-danger-50 dark:hover:bg-danger-950/20"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search past queries…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-700 dark:text-surface-300 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-all"
          />
        </div>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fade-in">
            <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
              <Inbox className="w-5 h-5 text-surface-400 dark:text-surface-500" />
            </div>
            <p className="text-xs font-medium text-surface-500 dark:text-surface-400">
              {search ? 'No matching queries' : 'No queries yet'}
            </p>
            <p className="text-2xs text-surface-400 dark:text-surface-500 mt-1">
              {search ? 'Try a different search term' : 'Your query history will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100 dark:divide-surface-800">
            {filteredHistory.map((entry) => {
              const isExpanded = expandedId === entry.id
              const time = formatRelativeTime(entry.timestamp)
              const successCount = entry.tool_trace.filter((t) => t.success).length

              return (
                <div
                  key={entry.id}
                  className={clsx(
                    'transition-colors',
                    isExpanded
                      ? 'bg-surface-50 dark:bg-surface-800/30'
                      : 'hover:bg-surface-50 dark:hover:bg-surface-800/20',
                  )}
                >
                  {/* Main row */}
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 w-6 h-6 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center flex-none">
                        <MessageSquare className="w-3 h-3 text-surface-400 dark:text-surface-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-surface-800 dark:text-surface-100 leading-snug line-clamp-2">
                          {entry.question}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="flex items-center gap-1 text-2xs text-surface-400 dark:text-surface-500">
                            <Clock className="w-2.5 h-2.5" />
                            {time}
                          </span>
                          <span className="text-surface-300 dark:text-surface-600">·</span>
                          <span className="text-2xs text-surface-400 dark:text-surface-500 tabular-nums">
                            {entry.latency_ms}ms
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Source badges */}
                    {entry.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 ml-8">
                        {entry.sources.map((s) => (
                          <SourceBadge key={s} source={s} size="sm" />
                        ))}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 mt-2 ml-8">
                      <button
                        onClick={() => setPendingQuestion(entry.question)}
                        className="flex items-center gap-1 px-2 py-1 text-2xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 rounded-md transition-colors"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Re-run
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="flex items-center gap-1 px-2 py-1 text-2xs font-medium text-surface-500 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-md transition-colors"
                      >
                        <Wrench className="w-2.5 h-2.5" />
                        Trace ({successCount}/{entry.tool_trace.length})
                        {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                      </button>
                      <button
                        onClick={() => removeFromHistory(entry.id)}
                        className="p-1 text-surface-400 hover:text-danger-500 dark:hover:text-danger-400 rounded-md hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-colors ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded trace */}
                  {isExpanded && (
                    <div className="px-4 pb-3 animate-slide-up">
                      {/* Answer preview */}
                      <div className="ml-8 mb-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 px-3 py-2">
                        <p className="text-2xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-1">
                          Response Summary
                        </p>
                        <p className="text-xs text-surface-600 dark:text-surface-300 line-clamp-3 leading-relaxed">
                          {entry.answer}
                        </p>
                      </div>

                      {/* Tool trace */}
                      <div className="ml-8 space-y-1">
                        <p className="text-2xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wide mb-1">
                          Execution Trace
                        </p>
                        {entry.tool_trace.map((call, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-surface-100 dark:border-surface-700 bg-surface-0 dark:bg-surface-800/50 text-xs"
                          >
                            {call.success
                              ? <CheckCircle className="w-3 h-3 text-success-500 flex-none" />
                              : <XCircle    className="w-3 h-3 text-danger-500 flex-none" />}
                            <span className="font-mono text-2xs text-surface-600 dark:text-surface-300 flex-1 truncate">
                              {call.tool}
                            </span>
                            <span className="text-2xs text-surface-400 dark:text-surface-500 tabular-nums">
                              {call.duration_ms}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours   = Math.floor(diff / 3600000)
  const days    = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
