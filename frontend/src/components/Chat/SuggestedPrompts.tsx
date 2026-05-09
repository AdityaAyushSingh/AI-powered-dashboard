'use client'

import { Lightbulb, TrendingUp, Globe, Film, Zap, DollarSign } from 'lucide-react'

const PROMPTS = [
  { label: 'Top performers 2025',    q: 'Which titles performed best in Q1 2025?',       icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
  { label: 'Genre trends',           q: 'What genre drove the most views last year?',     icon: Film,       color: 'from-purple-500 to-pink-500' },
  { label: 'Regional breakdown',     q: 'Which region has the highest engagement?',       icon: Globe,      color: 'from-emerald-500 to-teal-500' },
  { label: 'Content roadmap',        q: 'What does our content roadmap say about priorities?', icon: Lightbulb, color: 'from-amber-500 to-orange-500' },
  { label: 'Stellar Run analysis',   q: 'Why is Stellar Run trending recently?',          icon: Zap,        color: 'from-rose-500 to-red-500' },
  { label: 'Marketing ROI',          q: 'Which marketing channel gives the best ROI?',    icon: DollarSign,  color: 'from-indigo-500 to-violet-500' },
]

export default function SuggestedPrompts({ onSelect }: { onSelect: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-8 py-12 px-6 animate-fade-in-up">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto shadow-glow">
          <Zap className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
          Ask StreamVision anything
        </h2>
        <p className="text-sm text-surface-400 dark:text-surface-500 max-w-md">
          Powered by live SQL data, internal PDF reports, and CSV analytics.
          Ask business questions in plain English.
        </p>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-2 gap-2.5">
        {PROMPTS.map(({ label, q, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => onSelect(q)}
            className="group flex items-start gap-3 px-4 py-3.5 rounded-xl bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-popup transition-all text-left"
          >
            <div className={`mt-0.5 w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-none opacity-80 group-hover:opacity-100 transition-opacity`}>
              <Icon className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-surface-700 dark:text-surface-200 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors leading-snug">
                {label}
              </span>
              <span className="block text-2xs text-surface-400 dark:text-surface-500 mt-0.5 truncate">
                {q}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-surface-400 dark:text-surface-500">
        Or type any business question below
      </p>
    </div>
  )
}
