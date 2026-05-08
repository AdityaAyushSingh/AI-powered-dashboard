'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Trash2, AlertCircle } from 'lucide-react'
import type { Conversation, ChatMessage, Filters } from '@/lib/types'
import { sendMessage } from '@/lib/api'
import MessageBubble from './MessageBubble'

interface Props {
  filters: Filters
  onExampleQuery?: (handler: (q: string) => void) => void
}

export default function ChatInterface({ filters, onExampleQuery }: Props) {
  const [conversation, setConversation] = useState<Conversation[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [conversation])

  const submitQuestion = useCallback(async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || loading) return

    setError(null)
    setInput('')

    const userMsg: Conversation = {
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    const loadingMsg: Conversation = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }

    setConversation((prev) => [...prev, userMsg, loadingMsg])
    setLoading(true)

    // Build history for the API
    const history: ChatMessage[] = conversation
      .filter((c) => !c.data || c.data.answer)  // exclude loading states
      .map((c) => ({ role: c.role, content: c.data?.answer || c.content }))

    try {
      const response = await sendMessage(trimmed, history, filters)

      setConversation((prev) => {
        const updated = [...prev]
        // Replace the loading placeholder
        updated[updated.length - 1] = {
          role: 'assistant',
          content: response.answer,
          data: response,
          timestamp: new Date(),
        }
        return updated
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setConversation((prev) => prev.slice(0, -1))  // remove loading msg
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [conversation, loading, filters])

  // Expose example query handler
  useEffect(() => {
    onExampleQuery?.(submitQuestion)
  }, [submitQuestion, onExampleQuery])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitQuestion(input)
    }
  }

  const clearHistory = () => {
    setConversation([])
    setError(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-600 shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-slate-100">StreamVision Insights</h1>
          <p className="text-xs text-muted">AI analytics assistant · multi-source</p>
        </div>
        {conversation.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {conversation.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <span className="text-2xl">🎬</span>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300 mb-1">
                Ask anything about StreamVision performance
              </p>
              <p className="text-xs text-muted max-w-sm">
                I can answer questions about titles, genres, audiences, campaigns, and strategy —
                grounded in your SQL data, internal reports, and business files.
              </p>
            </div>
          </div>
        )}

        {conversation.map((msg, idx) => {
          const isLoading = msg.role === 'assistant' && msg.content === '' && loading &&
            idx === conversation.length - 1
          return (
            <MessageBubble key={idx} message={msg} isStreaming={isLoading} />
          )
        })}

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-900 bg-red-950/30 px-3 py-2.5 text-xs text-red-300">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-0.5">Request failed</p>
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-surface-600 shrink-0">
        <div className="flex gap-2 items-end rounded-xl border border-surface-500 bg-surface-700 focus-within:border-brand-500/60 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a business question…"
            disabled={loading}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-slate-200 placeholder:text-muted focus:outline-none disabled:opacity-50 max-h-32"
            style={{ overflowY: input.split('\n').length > 3 ? 'auto' : 'hidden' }}
          />
          <button
            onClick={() => submitQuestion(input)}
            disabled={loading || !input.trim()}
            className="m-1.5 w-8 h-8 rounded-lg bg-brand-500 hover:bg-brand-400 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={13} className="text-white" />
          </button>
        </div>
        <p className="text-xs text-muted mt-1.5 text-center">
          Enter to send · Shift+Enter for new line · answers grounded in internal data
        </p>
      </div>
    </div>
  )
}
