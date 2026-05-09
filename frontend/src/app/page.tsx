'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import Header from '@/components/Layout/Header'
import Sidebar from '@/components/Layout/Sidebar'
import ChatInterface from '@/components/Chat/ChatInterface'
import InsightsPanel from '@/components/Insights/InsightsPanel'
import HistoryPanel from '@/components/History/HistoryPanel'
import ChartsPanel from '@/components/Charts/ChartsPanel'
import clsx from 'clsx'

export default function Home() {
  const { rightPanel, rightPanelOpen, theme } = useAppStore()

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', isDark)
    }
  }, [theme])

  // Keyboard shortcut: Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.querySelector<HTMLTextAreaElement>('#chat-input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const renderRightPanel = () => {
    switch (rightPanel) {
      case 'insights': return <InsightsPanel />
      case 'history':  return <HistoryPanel />
      case 'charts':   return <ChartsPanel />
      default:         return <InsightsPanel />
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Filters */}
        <Sidebar />

        {/* Main content — Chat */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <ChatInterface />
        </main>

        {/* Right panel — Insights / History / Charts */}
        <aside
          className={clsx(
            'flex-none border-l border-surface-200 dark:border-surface-800 bg-surface-0 dark:bg-surface-900 overflow-hidden flex flex-col panel-transition',
            rightPanelOpen ? 'w-[340px]' : 'w-0',
          )}
        >
          {rightPanelOpen && renderRightPanel()}
        </aside>
      </div>
    </div>
  )
}
