'use client'

import { Database, FileText, TableProperties } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  source: string
  size?: 'sm' | 'md'
}

const SOURCE_CONFIG: Record<string, {
  label: string
  icon: React.ReactNode
  light: string
  dark: string
}> = {
  sql: {
    label: 'SQL',
    icon: <Database size={10} />,
    light: 'bg-sky-50 text-sky-700 border-sky-200',
    dark:  'dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800',
  },
  documents: {
    label: 'Docs',
    icon: <FileText size={10} />,
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dark:  'dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  },
  document: {
    label: 'Docs',
    icon: <FileText size={10} />,
    light: 'bg-amber-50 text-amber-700 border-amber-200',
    dark:  'dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800',
  },
  csv: {
    label: 'CSV',
    icon: <TableProperties size={10} />,
    light: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dark:  'dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  },
}

const FALLBACK = {
  label: '',
  icon: null,
  light: 'bg-surface-100 text-surface-600 border-surface-200',
  dark:  'dark:bg-surface-800 dark:text-surface-400 dark:border-surface-700',
}

export default function SourceBadge({ source, size = 'sm' }: Props) {
  const config = SOURCE_CONFIG[source] ?? { ...FALLBACK, label: source }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-2xs' : 'px-2.5 py-0.5 text-xs',
        config.light,
        config.dark,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
