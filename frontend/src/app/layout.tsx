import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'StreamVision — Insights Assistant',
  description: 'AI-powered analytics workspace for StreamVision content intelligence. Query live SQL data, internal reports, and CSV analytics.',
  keywords: ['StreamVision', 'AI analytics', 'business intelligence', 'insights'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
      </head>
      <body className="h-full overflow-hidden bg-surface-50 text-surface-900 dark:bg-surface-950 dark:text-surface-100 antialiased">
        {children}
        <Toaster
          position="bottom-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background:   'var(--toast-bg, #0f172a)',
              color:        'var(--toast-color, #f1f5f9)',
              fontSize:     '0.875rem',
              borderRadius: '12px',
              padding:      '12px 16px',
              boxShadow:    '0 8px 32px rgba(0,0,0,0.2)',
              border:       '1px solid rgba(255,255,255,0.06)',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
