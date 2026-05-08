'use client'

import { Bot, User } from 'lucide-react'
import type { Conversation } from '@/lib/types'
import SourceBadge from '@/components/SourceBadge/SourceBadge'
import ToolTrace from '@/components/Chat/ToolTrace'
import InsightsChart from '@/components/Charts/InsightsChart'

interface Props {
  message: Conversation
  isStreaming?: boolean
}

function renderContent(content: string) {
  // Simple markdown-ish rendering: bold, lists
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'
  const data = message.data

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
        isUser ? 'bg-brand-500/20 border border-brand-500/30' : 'bg-teal-500/20 border border-teal-500/30'
      }`}>
        {isUser
          ? <User size={13} className="text-brand-400" />
          : <Bot size={13} className="text-teal-400" />}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {/* Message bubble */}
        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-500/15 border border-brand-500/20 text-slate-200 rounded-tr-sm'
            : 'bg-surface-700 border border-surface-600 text-slate-200 rounded-tl-sm'
        }`}>
          {isStreaming ? (
            <div className="flex items-center gap-2 text-muted">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs">Thinking…</span>
            </div>
          ) : (
            <div
              className="prose-dark"
              dangerouslySetInnerHTML={{ __html: renderContent(message.content) }}
            />
          )}
        </div>

        {/* Source badges */}
        {data?.sources && data.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.sources.map((s) => (
              <SourceBadge key={s} source={s} />
            ))}
          </div>
        )}

        {/* Chart */}
        {data?.chart_data && (
          <div className="w-full rounded-xl border border-surface-600 bg-surface-800 p-4">
            <InsightsChart data={data.chart_data} height={220} />
          </div>
        )}

        {/* Citations */}
        {data?.citations && data.citations.length > 0 && (
          <div className="w-full rounded-lg border border-surface-600 bg-surface-800/60 px-3 py-2">
            <p className="text-xs text-muted mb-1.5 font-medium">Sources referenced:</p>
            <ul className="space-y-1">
              {data.citations.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                  <SourceBadge source={c.source_type} size="sm" />
                  <span>{c.description}</span>
                  {c.detail && <span className="text-muted">({c.detail})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tool trace */}
        {data?.tool_trace && data.tool_trace.length > 0 && (
          <div className="w-full">
            <ToolTrace toolTrace={data.tool_trace} latencyMs={data.latency_ms} />
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted/60">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {data?.latency_ms && !isUser ? ` · ${data.latency_ms}ms` : ''}
        </p>
      </div>
    </div>
  )
}
