'use client'

import {
  Zap, ChevronRight, BarChart3, History, PieChart, PanelRightClose,
  PanelRightOpen, Sun, Moon, Monitor,
} from 'lucide-react'
import clsx from 'clsx'
import { useAppStore } from '@/lib/store'
import type { RightPanelView, ThemeMode } from '@/lib/types'

const PANEL_TABS: { id: RightPanelView; label: string; icon: React.ReactNode }[] = [
  { id: 'insights', label: 'Insights',  icon: <BarChart3  className="w-3.5 h-3.5" /> },
  { id: 'charts',   label: 'Charts',    icon: <PieChart   className="w-3.5 h-3.5" /> },
  { id: 'history',  label: 'History',   icon: <History    className="w-3.5 h-3.5" /> },
]

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { id: 'light',  label: 'Light',  icon: <Sun     className="w-3.5 h-3.5" /> },
  { id: 'dark',   label: 'Dark',   icon: <Moon    className="w-3.5 h-3.5" /> },
  { id: 'system', label: 'System', icon: <Monitor className="w-3.5 h-3.5" /> },
]

export default function Header() {
  const {
    rightPanel, setRightPanel, rightPanelOpen, toggleRightPanel,
    theme, setTheme, useMockData,
  } = useAppStore()

  return (
    <header className="flex-none flex items-center justify-between h-[52px] px-4 bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-800 z-30">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow-sm">
            <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-surface-900 dark:text-surface-50 text-sm tracking-tight">
            StreamVision
          </span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-surface-300 dark:text-surface-600" />
        <span className="text-sm text-surface-500 dark:text-surface-400 font-medium">
          Insights Assistant
        </span>
      </div>

      {/* Center: Panel tabs */}
      <div className="flex items-center gap-0.5 bg-surface-100 dark:bg-surface-800 rounded-lg p-0.5">
        {PANEL_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setRightPanel(id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150',
              rightPanel === id && rightPanelOpen
                ? 'bg-surface-0 dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-soft'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200',
            )}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <div className="flex items-center bg-surface-100 dark:bg-surface-800 rounded-lg p-0.5">
          {THEME_OPTIONS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              title={label}
              className={clsx(
                'p-1.5 rounded-md transition-all duration-150',
                theme === id
                  ? 'bg-surface-0 dark:bg-surface-700 text-brand-600 dark:text-brand-400 shadow-soft'
                  : 'text-surface-400 hover:text-surface-600 dark:hover:text-surface-300',
              )}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Status badge */}
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-2xs font-medium text-surface-500 dark:text-surface-400">
          <span className={clsx(
            'w-1.5 h-1.5 rounded-full',
            useMockData ? 'bg-warning-500 animate-pulse-soft' : 'bg-success-500 animate-pulse',
          )} />
          {useMockData ? 'Demo Mode' : 'Gemini 2.5 Flash'}
        </span>

        {/* Right panel toggle */}
        <button
          onClick={toggleRightPanel}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title={rightPanelOpen ? 'Close panel' : 'Open panel'}
        >
          {rightPanelOpen
            ? <PanelRightClose className="w-4 h-4" />
            : <PanelRightOpen  className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
