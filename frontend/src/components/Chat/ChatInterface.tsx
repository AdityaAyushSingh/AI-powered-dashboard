'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Trash2, AlertCircle, CornerDownLeft, Command, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import type { Conversation, ChatMessage } from '@/lib/types'
import { sendMessage } from '@/lib/api'
import { getMockResponse } from '@/lib/mockData'
import { useAppStore } from '@/lib/store'
import MessageBubble from './MessageBubble'
import SuggestedPrompts from './SuggestedPrompts'

export default function ChatInterface() {
  const {
    conversation, isLoading, pendingQuestion, useMockData,
    addMessage, clearConversation, setLoading, setPendingQuestion,
    addToHistory, filters,
  } = useAppStore()

  const [input, setInput]   = useState('')
  const [error, setError]   = useState<string | null>(null)
  const bottomRef           = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 144)}px`
    }
  }, [input])

  const submitQuestion = useCallback(async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed || isLoading) return

    setError(null)
    setInput('')
    setPendingQuestion(null)

    const userMsg: Conversation = {
      role: 'user', content: trimmed,
      timestamp: new Date(),
    }
    const loadingMsg: Conversation = {
      role: 'assistant', content: '',
      timestamp: new Date(),
    }
    addMessage(userMsg)
    addMessage(loadingMsg)
    setLoading(true)

    const history: ChatMessage[] = conversation
      .filter((c) => c.role === 'user' || (c.data?.answer))
      .map((c) => ({ role: c.role, content: c.data?.answer || c.content }))

    try {
      let response

      if (useMockData) {
        // Simulate network delay for realistic feel
        await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 800))
        response = getMockResponse(trimmed)
      } else {
        response = await sendMessage(trimmed, history, filters)
      }

      const resolvedMsg: Conversation = {
        role: 'assistant',
        content: response.answer,
        data: response,
        timestamp: new Date(),
      }

      useAppStore.setState((s) => {
        const updated = [...s.conversation]
        updated[updated.length - 1] = resolvedMsg
        return { conversation: updated }
      })

      addToHistory({
        id:          response.id,
        question:    trimmed,
        timestamp:   new Date().toISOString(),
        answer:      response.answer,
        sources:     response.sources,
        tool_trace:  response.tool_trace,
        latency_ms:  response.latency_ms,
        citations:   response.citations,
      })

      toast.success(`Done in ${response.latency_ms}ms`, { duration: 2000 })

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      useAppStore.setState((s) => ({ conversation: s.conversation.slice(0, -1) }))
      toast.error('Request failed — check the backend is running.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [conversation, isLoading, filters, useMockData, addMessage, setLoading, setPendingQuestion, addToHistory])

  // Handle questions fired from sidebar / history panel
  useEffect(() => {
    if (pendingQuestion) submitQuestion(pendingQuestion)
  }, [pendingQuestion]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(input) }
  }

  const handleClear = () => {
    clearConversation()
    setError(null)
    toast('Conversation cleared', { icon: '🗑️', duration: 1800 })
  }

  const isLastStreaming = isLoading && conversation.length > 0 &&
    conversation[conversation.length - 1]?.role === 'assistant' &&
    conversation[conversation.length - 1]?.content === ''

  return (
    <div className="flex flex-col h-full bg-surface-50 dark:bg-surface-950">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-5 py-2 border-b border-surface-200 dark:border-surface-800 bg-surface-0/60 dark:bg-surface-900/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {conversation.length === 0
              ? 'Multi-source AI assistant — SQL · Documents · CSV'
              : `${Math.ceil(conversation.length / 2)} turn${conversation.length > 2 ? 's' : ''} · grounded in live data`}
          </p>
        </div>
        {conversation.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-surface-400 hover:text-danger-600 dark:hover:text-danger-400 transition-colors rounded-md px-2 py-1 hover:bg-danger-50 dark:hover:bg-danger-950/30"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {conversation.length === 0 ? (
          <SuggestedPrompts onSelect={submitQuestion} />
        ) : (
          <>
            {conversation.map((msg, idx) => {
              const streaming = isLastStreaming && idx === conversation.length - 1
              return <MessageBubble key={idx} message={msg} isStreaming={streaming} />
            })}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-950/30 px-4 py-3 text-sm text-danger-700 dark:text-danger-300 animate-slide-up">
                <AlertCircle className="w-4 h-4 flex-none mt-0.5" />
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wide mb-0.5">Request failed</p>
                  <p className="text-xs">{error}</p>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 pb-4 pt-3 shrink-0 border-t border-surface-200 dark:border-surface-800 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-sm">
        <div className={clsx(
          'flex items-end gap-2 rounded-xl border transition-all duration-200',
          isLoading
            ? 'border-surface-200 dark:border-surface-700 opacity-70'
            : 'border-surface-300 dark:border-surface-600 focus-within:border-brand-400 focus-within:shadow-brand-sm dark:focus-within:shadow-glow-sm',
          'bg-surface-0 dark:bg-surface-800',
        )}>
          <textarea
            ref={inputRef}
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a business question…"
            disabled={isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent px-4 py-3 text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-500 focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            onClick={() => submitQuestion(input)}
            disabled={isLoading || !input.trim()}
            className="m-2 w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex-none shadow-soft hover:shadow-glow-sm active:scale-95"
          >
            {isLoading
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-3.5 h-3.5 text-white" />}
          </button>
        </div>
        <p className="flex items-center justify-center gap-1.5 text-xs text-surface-400 dark:text-surface-500 mt-2">
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-2xs font-mono">
            <CornerDownLeft className="w-2.5 h-2.5" />
          </kbd>
          <span>to send</span>
          <span className="text-surface-300 dark:text-surface-600">·</span>
          <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-2xs font-mono">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
          <span>to focus</span>
        </p>
      </div>
    </div>
  )
}
