import type { AssistantMessage, ChatMessage, Filters, InsightsData } from './types'

const BASE = ''  // uses Next.js rewrite proxy
const APP_API_KEY = process.env.NEXT_PUBLIC_APP_API_KEY

function jsonHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(APP_API_KEY ? { 'X-API-Key': APP_API_KEY } : {}),
  }
}

function authHeaders(): HeadersInit {
  return APP_API_KEY ? { 'X-API-Key': APP_API_KEY } : {}
}

export async function sendMessage(
  question: string,
  history: ChatMessage[],
  filters: Filters = {},
): Promise<AssistantMessage> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ question, history, filters }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function fetchInsights(): Promise<InsightsData> {
  const res = await fetch(`${BASE}/api/insights`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchHealth(): Promise<{ status: string; db: string; vector_store: string }> {
  const res = await fetch(`${BASE}/health`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatCurrency(n: number): string {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)}Cr`
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1)}L`
  return `₹${n.toFixed(0)}`
}
