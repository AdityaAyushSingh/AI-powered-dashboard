'use client'

import { Database, FileText, TableProperties } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  source: string
  size?: 'sm' | 'md'
}

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  sql: {
    label: 'SQL Database',
    icon: <Database size={12} />,
    color: 'bg-blue-900/50 text-blue-300 border-blue-700/50',
  },
  documents: {
    label: 'Documents',
    icon: <FileText size={12} />,
    color: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  },
  csv: {
    label: 'CSV Files',
    icon: <TableProperties size={12} />,
    color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  },
}

export default function SourceBadge({ source, size = 'sm' }: Props) {
  const config = SOURCE_CONFIG[source] || {
    label: source,
    icon: null,
    color: 'bg-gray-800 text-gray-400 border-gray-700',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        config.color,
      )}
    >
      {config.icon}
      {config.label}
    </span>
  )
}
