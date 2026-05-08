export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ToolCall {
  tool: string
  input: Record<string, unknown>
  output: Record<string, unknown>
  duration_ms: number
  success: boolean
}

export interface Citation {
  source_type: 'sql' | 'document' | 'csv'
  description: string
  detail?: string
}

export interface ChartDataPoint {
  [key: string]: string | number | null | undefined
  value?: number
  name?: string
}

export interface ChartDataset {
  name: string
  data: ChartDataPoint[]
}

export interface ChartData {
  chart_type: 'bar' | 'line' | 'pie' | 'area'
  title: string
  x_key: string
  series: ChartDataset[]
  x_labels?: string[]
}

export interface AssistantMessage {
  id: string
  answer: string
  sources: string[]
  tool_trace: ToolCall[]
  chart_data?: ChartData | null
  citations: Citation[]
  latency_ms: number
  created_at: string
}

export interface Conversation {
  role: 'user' | 'assistant'
  content: string
  data?: AssistantMessage
  timestamp: Date
}

export interface InsightsData {
  total_views_2025: number
  top_genre: string
  top_title: string
  avg_rating: number
  total_revenue_2025: number
  active_viewers: number
  top_city: string
  genre_breakdown: Array<{
    genre: string
    total_views: number
    avg_rating: number
    completion_rate: number
    total_revenue: number
  }>
  monthly_trend: unknown[]
}

export interface Filters {
  year?: number
  genre?: string
  region?: string
  city?: string
}
