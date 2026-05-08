import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StreamVision Insights | AI Analytics Assistant',
  description: 'Internal AI analytics assistant for StreamVision Entertainment',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
