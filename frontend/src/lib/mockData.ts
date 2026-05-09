import type {
  AssistantMessage,
  InsightsData,
  QueryHistoryEntry,
  ChartData,
} from './types'

/* ─── Insights KPI mock ────────────────────────────────────────────── */
export const MOCK_INSIGHTS: InsightsData = {
  total_views_2025: 14_782_300,
  top_genre: 'Action',
  top_title: 'Stellar Run',
  avg_rating: 4.2,
  total_revenue_2025: 287_500_000,
  active_viewers: 2_340_000,
  top_city: 'Mumbai',
  genre_breakdown: [
    { genre: 'Action',      total_views: 3_890_000, avg_rating: 4.4, completion_rate: 0.78, total_revenue: 82_000_000 },
    { genre: 'Sci-Fi',      total_views: 2_950_000, avg_rating: 4.3, completion_rate: 0.74, total_revenue: 65_000_000 },
    { genre: 'Drama',       total_views: 2_420_000, avg_rating: 4.1, completion_rate: 0.81, total_revenue: 48_000_000 },
    { genre: 'Thriller',    total_views: 2_100_000, avg_rating: 4.0, completion_rate: 0.72, total_revenue: 42_000_000 },
    { genre: 'Comedy',      total_views: 1_580_000, avg_rating: 3.6, completion_rate: 0.65, total_revenue: 25_000_000 },
    { genre: 'Documentary', total_views: 980_000,   avg_rating: 4.5, completion_rate: 0.88, total_revenue: 15_000_000 },
    { genre: 'Romance',     total_views: 562_000,   avg_rating: 3.8, completion_rate: 0.69, total_revenue: 7_500_000 },
    { genre: 'Sports',      total_views: 300_300,   avg_rating: 3.9, completion_rate: 0.71, total_revenue: 3_000_000 },
  ],
  monthly_trend: [
    { month: 'Jan', views: 3_200_000, revenue: 62_000_000 },
    { month: 'Feb', views: 3_450_000, revenue: 68_000_000 },
    { month: 'Mar', views: 3_890_000, revenue: 75_000_000 },
    { month: 'Apr', views: 4_242_300, revenue: 82_500_000 },
  ],
}

/* ─── Chart mocks ──────────────────────────────────────────────────── */
export const MOCK_GENRE_CHART: ChartData = {
  chart_type: 'bar',
  title: 'Views by Genre — 2025',
  x_key: 'genre',
  series: [{
    name: 'Views',
    data: MOCK_INSIGHTS.genre_breakdown.map((g) => ({
      genre: g.genre,
      value: g.total_views,
    })),
  }],
}

export const MOCK_REVENUE_TREND: ChartData = {
  chart_type: 'area',
  title: 'Monthly Revenue Trend — 2025',
  x_key: 'month',
  series: [{
    name: 'Revenue',
    data: (MOCK_INSIGHTS.monthly_trend as Array<{ month: string; revenue: number }>).map((m) => ({
      month: m.month,
      value: m.revenue,
    })),
  }],
}

export const MOCK_DEVICE_CHART: ChartData = {
  chart_type: 'pie',
  title: 'Viewership by Device',
  x_key: 'name',
  series: [{
    name: 'Device',
    data: [
      { name: 'Mobile',  value: 42 },
      { name: 'Smart TV', value: 31 },
      { name: 'Desktop', value: 18 },
      { name: 'Tablet',  value: 9 },
    ],
  }],
}

export const MOCK_REGION_CHART: ChartData = {
  chart_type: 'bar',
  title: 'Revenue by Region — 2025',
  x_key: 'region',
  series: [{
    name: 'Revenue',
    data: [
      { region: 'West',    value: 98_000_000 },
      { region: 'South',   value: 72_000_000 },
      { region: 'North',   value: 65_000_000 },
      { region: 'East',    value: 35_000_000 },
      { region: 'Central', value: 17_500_000 },
    ],
  }],
}

/* ─── Mock assistant responses ─────────────────────────────────────── */
export const MOCK_RESPONSES: Record<string, AssistantMessage> = {
  'top_titles': {
    id: 'mock-1',
    answer: `## Top Performing Titles — 2025

Based on our analysis across **SQL database**, **CSV analytics**, and **internal reports**, here are the top performers:

| Rank | Title | Genre | Views | Rating | Revenue |
|------|-------|-------|-------|--------|---------|
| 1 | **Stellar Run** | Action | 1.2M | 4.6 | ₹28.5Cr |
| 2 | **Dark Orbit** | Sci-Fi | 980K | 4.4 | ₹22.1Cr |
| 3 | **Last Kingdom** | Drama | 870K | 4.3 | ₹18.7Cr |
| 4 | **Shadow Protocol** | Thriller | 720K | 4.1 | ₹15.2Cr |
| 5 | **The Heist** | Action | 650K | 4.0 | ₹13.8Cr |

### Key Observations
- **Action** continues to dominate with 2 of the top 5 titles
- **Stellar Run** saw a **34% increase** in views compared to Q4 2024
- Documentary content has the highest completion rate (88%) despite lower total views
- Mumbai and Bangalore account for **42%** of all premium tier viewership`,
    sources: ['sql', 'csv', 'documents'],
    tool_trace: [
      {
        tool: 'query_business_data',
        input: { query_type: 'top_titles', year: 2025, limit: 10 },
        output: { rows: 10, query_type: 'top_titles' },
        duration_ms: 45,
        success: true,
      },
      {
        tool: 'analyze_csv',
        input: { filename: 'regional_performance.csv', operation: 'group_aggregate', group_by: 'title' },
        output: { rows: 10, columns: ['title', 'total_revenue'] },
        duration_ms: 120,
        success: true,
      },
      {
        tool: 'search_documents',
        input: { query: 'top performing content 2025' },
        output: { matches: 3, best_score: 0.87 },
        duration_ms: 85,
        success: true,
      },
    ],
    chart_data: {
      chart_type: 'bar',
      title: 'Top 5 Titles by Views',
      x_key: 'title',
      series: [{
        name: 'Views',
        data: [
          { title: 'Stellar Run', value: 1_200_000 },
          { title: 'Dark Orbit', value: 980_000 },
          { title: 'Last Kingdom', value: 870_000 },
          { title: 'Shadow Protocol', value: 720_000 },
          { title: 'The Heist', value: 650_000 },
        ],
      }],
    },
    citations: [
      { source_type: 'sql', description: 'movies + watch_activity tables', detail: 'Grouped by title, year=2025' },
      { source_type: 'csv', description: 'regional_performance.csv', detail: 'Revenue aggregation' },
      { source_type: 'document', description: 'Q1 2025 Content Performance Report', detail: 'Page 3-4' },
    ],
    latency_ms: 2840,
    created_at: new Date().toISOString(),
  },

  'stellar_run': {
    id: 'mock-2',
    answer: `## Why Stellar Run Is Trending

**Stellar Run** has emerged as StreamVision's breakout hit of 2025, driven by a combination of factors:

### 1. Strong Word-of-Mouth 📈
- Social media mentions increased **280%** in the past 30 days
- Average rating climbed from 4.2 to **4.6** (highest on the platform)
- Completion rate sits at **92%** — exceptionally high for the Action genre

### 2. Strategic Marketing Push
- YouTube campaign generated **12.4M impressions** at ₹0.82 CPM
- Influencer partnerships drove **340K new sign-ups** in March alone
- The marketing team allocated **35% more budget** to Stellar Run vs comparable titles

### 3. Content Quality Signals
> *"Stellar Run represents the new benchmark for original action content on Indian OTT platforms"*
> — Q1 2025 Content Strategy Report

### 4. Regional Performance
The title performs exceptionally well in **Mumbai** and **Bangalore**, where it captures **48% of all Action views** in those cities.

**Recommendation:** Consider greenlighting Season 2 and expanding marketing spend in underperforming regions (East, Central).`,
    sources: ['sql', 'documents', 'csv'],
    tool_trace: [
      {
        tool: 'query_business_data',
        input: { query_type: 'title_detail', title: 'Stellar Run' },
        output: { rows: 1, fields: ['views', 'rating', 'completion'] },
        duration_ms: 38,
        success: true,
      },
      {
        tool: 'search_documents',
        input: { query: 'Stellar Run performance trends analysis' },
        output: { matches: 4, best_score: 0.92 },
        duration_ms: 110,
        success: true,
      },
      {
        tool: 'analyze_csv',
        input: { filename: 'marketing_spend.csv', operation: 'filter', filter_column: 'title', filter_value: 'Stellar Run' },
        output: { rows: 5, columns: ['channel', 'spend', 'impressions'] },
        duration_ms: 95,
        success: true,
      },
    ],
    chart_data: {
      chart_type: 'line',
      title: 'Stellar Run — Monthly Views Trend',
      x_key: 'month',
      series: [{
        name: 'Views',
        data: [
          { month: 'Jan', value: 180_000 },
          { month: 'Feb', value: 290_000 },
          { month: 'Mar', value: 420_000 },
          { month: 'Apr', value: 310_000 },
        ],
      }],
    },
    citations: [
      { source_type: 'sql', description: 'watch_activity table', detail: 'title=Stellar Run' },
      { source_type: 'document', description: 'Q1 Content Strategy Report', detail: 'Page 7-8' },
      { source_type: 'csv', description: 'marketing_spend.csv' },
    ],
    latency_ms: 3120,
    created_at: new Date().toISOString(),
  },

  'genre_trends': {
    id: 'mock-3',
    answer: `## Genre Performance Analysis — 2025

### Views Distribution

**Action** leads with **3.89M views** (26.3% of total), followed by Sci-Fi at 2.95M (19.9%).

### Key Insights

- 🏆 **Action** — Highest views & revenue, driven by Stellar Run
- ⭐ **Documentary** — Highest completion rate (88%) and avg rating (4.5)
- ⚠️ **Comedy** — Underperforming with lowest completion rate (65%) and rating (3.6)
- 📈 **Sci-Fi** — Growing fastest month-over-month (+18% in April)

### Recommendation
Comedy content needs quality investment. Consider commissioning a flagship comedy original to lift the genre's perception and completion metrics.`,
    sources: ['sql', 'csv'],
    tool_trace: [
      {
        tool: 'query_business_data',
        input: { query_type: 'genre_performance', year: 2025 },
        output: { rows: 8, query_type: 'genre_performance' },
        duration_ms: 52,
        success: true,
      },
    ],
    chart_data: MOCK_GENRE_CHART,
    citations: [
      { source_type: 'sql', description: 'movies + watch_activity tables', detail: 'Grouped by genre' },
    ],
    latency_ms: 1850,
    created_at: new Date().toISOString(),
  },
}

/* ─── Mock query history ───────────────────────────────────────────── */
export const MOCK_HISTORY: QueryHistoryEntry[] = [
  {
    id: 'hist-1',
    question: 'Which titles performed best in 2025?',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    answer: 'Stellar Run leads with 1.2M views, followed by Dark Orbit (980K) and Last Kingdom (870K)...',
    sources: ['sql', 'csv', 'documents'],
    tool_trace: MOCK_RESPONSES.top_titles.tool_trace,
    latency_ms: 2840,
    citations: MOCK_RESPONSES.top_titles.citations,
  },
  {
    id: 'hist-2',
    question: 'Why is Stellar Run trending recently?',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    answer: 'Strong word-of-mouth with 280% increase in social mentions, strategic marketing...',
    sources: ['sql', 'documents', 'csv'],
    tool_trace: MOCK_RESPONSES.stellar_run.tool_trace,
    latency_ms: 3120,
    citations: MOCK_RESPONSES.stellar_run.citations,
  },
  {
    id: 'hist-3',
    question: 'What genre drove the most views last year?',
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    answer: 'Action leads with 3.89M views (26.3%), followed by Sci-Fi at 2.95M (19.9%)...',
    sources: ['sql', 'csv'],
    tool_trace: MOCK_RESPONSES.genre_trends.tool_trace,
    latency_ms: 1850,
    citations: MOCK_RESPONSES.genre_trends.citations,
  },
  {
    id: 'hist-4',
    question: 'Which region has the highest engagement?',
    timestamp: new Date(Date.now() - 28800000).toISOString(),
    answer: 'West region leads with ₹9.8Cr revenue, followed by South at ₹7.2Cr...',
    sources: ['sql'],
    tool_trace: [{ tool: 'query_business_data', input: { query_type: 'regional_breakdown' }, output: { rows: 5 }, duration_ms: 42, success: true }],
    latency_ms: 1620,
    citations: [{ source_type: 'sql', description: 'regional_performance table' }],
  },
  {
    id: 'hist-5',
    question: 'Compare Dark Orbit vs Last Kingdom',
    timestamp: new Date(Date.now() - 43200000).toISOString(),
    answer: 'Dark Orbit outperforms in views (980K vs 870K) but Last Kingdom has higher completion...',
    sources: ['sql', 'csv'],
    tool_trace: [
      { tool: 'query_business_data', input: { query_type: 'title_detail', title: 'Dark Orbit' }, output: { rows: 1 }, duration_ms: 35, success: true },
      { tool: 'query_business_data', input: { query_type: 'title_detail', title: 'Last Kingdom' }, output: { rows: 1 }, duration_ms: 32, success: true },
    ],
    latency_ms: 2100,
    citations: [{ source_type: 'sql', description: 'movies + watch_activity tables' }],
  },
]

/* ─── Mock response matcher (fuzzy) ────────────────────────────────── */
export function getMockResponse(question: string): AssistantMessage {
  const q = question.toLowerCase()
  if (q.includes('best') || q.includes('top') || q.includes('perform'))
    return { ...MOCK_RESPONSES.top_titles, id: `mock-${Date.now()}`, created_at: new Date().toISOString() }
  if (q.includes('stellar') || q.includes('trending'))
    return { ...MOCK_RESPONSES.stellar_run, id: `mock-${Date.now()}`, created_at: new Date().toISOString() }
  if (q.includes('genre') || q.includes('views'))
    return { ...MOCK_RESPONSES.genre_trends, id: `mock-${Date.now()}`, created_at: new Date().toISOString() }

  // Default fallback
  return {
    id: `mock-${Date.now()}`,
    answer: `Great question! Based on my analysis of the StreamVision data:\n\n${question}\n\nI've queried our SQL database, CSV analytics files, and internal reports to provide a comprehensive answer. The data shows interesting patterns across genres and regions.\n\n> **Note:** This is a mock response. Connect the backend for live data-powered answers.\n\nKey metrics for context:\n- **14.8M** total views in 2025\n- **₹287.5Cr** total revenue YTD\n- **2.34M** active viewers\n- Top performing city: **Mumbai**`,
    sources: ['sql', 'csv'],
    tool_trace: [
      { tool: 'query_business_data', input: { query_type: 'general', question }, output: { rows: 5 }, duration_ms: 48, success: true },
    ],
    chart_data: null,
    citations: [{ source_type: 'sql', description: 'Aggregate query results' }],
    latency_ms: 1500 + Math.floor(Math.random() * 1500),
    created_at: new Date().toISOString(),
  }
}
