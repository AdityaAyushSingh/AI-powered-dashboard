'use client'

import { Bot, User, FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Conversation } from '@/lib/types'
import SourceBadge from '@/components/SourceBadge/SourceBadge'
import ToolTrace from '@/components/Chat/ToolTrace'
import InsightsChart from '@/components/Charts/InsightsChart'

export default function MessageBubble({
  message,
  isStreaming = false,
}: {
  message:     Conversation
  isStreaming?: boolean
}) {
  const isUser = message.role === 'user'
  const data   = message.data

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`
        flex-none w-8 h-8 rounded-full flex items-center justify-center mt-0.5 border transition-shadow
        ${isUser
          ? 'bg-gradient-to-br from-brand-500 to-brand-700 border-brand-600 shadow-glow-sm'
          : 'bg-surface-0 dark:bg-surface-800 border-surface-200 dark:border-surface-700 shadow-soft'}
      `}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <Bot  className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
      </div>

      {/* Bubble + metadata */}
      <div className={`flex-1 min-w-0 max-w-[88%] flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Sender label */}
        <span className="text-2xs font-medium text-surface-400 dark:text-surface-500 uppercase tracking-wider">
          {isUser ? 'You' : 'Assistant'}
        </span>

        {/* Main bubble */}
        <div className={`
          px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl rounded-tr-md shadow-soft'
            : 'bg-surface-0 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-2xl rounded-tl-md border border-surface-200 dark:border-surface-700 shadow-soft'}
        `}>
          {isStreaming ? (
            <div className="flex items-center gap-2 py-0.5">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-brand-400 dark:bg-brand-300 animate-bounce-dot"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-xs text-surface-400 dark:text-surface-500">Analyzing data…</span>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose-ai"
              components={{
                a: ({ href, children }) => (
                  <a href={href ?? '#'} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Source badges */}
        {data?.sources && data.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 animate-fade-in">
            {data.sources.map((s) => <SourceBadge key={s} source={s} />)}
          </div>
        )}

        {/* Chart */}
        {data?.chart_data && (
          <div className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800 p-4 shadow-soft animate-fade-in-up">
            <InsightsChart data={data.chart_data} height={220} />
          </div>
        )}

        {/* Citations */}
        {data?.citations && data.citations.length > 0 && (
          <div className="w-full rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50 px-3.5 py-3 animate-fade-in">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2 uppercase tracking-wide">
              <FileText className="w-3 h-3" />
              Sources referenced
            </p>
            <ul className="space-y-1.5">
              {data.citations.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-300">
                  <SourceBadge source={c.source_type} size="sm" />
                  <span className="truncate">{c.description}</span>
                  {c.detail && <span className="text-surface-400 dark:text-surface-500 truncate">({c.detail})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tool trace */}
        {data?.tool_trace && data.tool_trace.length > 0 && (
          <div className="w-full animate-fade-in">
            <ToolTrace calls={data.tool_trace} />
          </div>
        )}

        {/* Timestamp + latency */}
        <p className="text-2xs text-surface-400 dark:text-surface-500">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {data?.latency_ms && !isUser ? ` · ${data.latency_ms}ms` : ''}
        </p>
      </div>
    </div>
  )
}
