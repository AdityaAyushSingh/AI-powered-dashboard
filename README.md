# StreamVision Insights Assistant

A secure, enterprise-grade AI analytics assistant for StreamVision Entertainment — a fictional streaming company. Answers business questions by combining SQL data, internal PDF reports, and CSV business files through a tool-mediated agentic architecture.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Next.js)                       │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│   │ Filter Panel│  │  Chat UI     │  │  Insights / Charts   │   │
│   │ (year/genre │  │  + Tool Trace│  │  (Recharts, KPIs)    │   │
│   │  /region)   │  │  + Citations │  │                      │   │
│   └─────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (Next.js proxy rewrite)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                             │
│                                                                 │
│   POST /api/chat     GET /api/insights     GET /health          │
│         │                                                       │
│         ▼                                                       │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Orchestrator (Agentic Loop)                │   │
│   │                                                         │   │
│   │  1. Build messages + tool definitions                   │   │
│   │  2. Call Gemini 2.5 Flash via Google GenAI API          │   │
│   │  3. If function_call → execute tool → append result     │   │
│   │  4. Loop until text-only response (max 8 steps)         │   │
│   │  5. Extract answer + sources + citations + chart        │   │
│   └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│   ┌─────┴───────────────────────────────────────────────────┐   │
│   │                    Tool Registry                        │   │
│   │                                                         │   │
│   │  query_business_data  │  search_documents               │   │
│   │  analyze_csv          │  get_chart_data                 │   │
│   └────────┬──────────────┴──────────────┬──────────────────┘   │
│            │                             │                      │
│   ┌────────▼──────────┐  ┌───────────────▼──────────────────┐   │
│   │   SQL Tool        │  │  Document Tool                   │   │
│   │  (SQLAlchemy)     │  │  ChromaDB + sentence-transformers│   │
│   │  Parameterised    │  │   PDF chunks + metadata          │   │
│   │  named queries    │  └──────────────────────────────────┘   │
│   └────────┬──────────┘                                         │
│            │          ┌───────────────────────────────────┐     │
│   ┌────────▼──────┐   │  CSV Tool                         │     │
│   │  SQLite DB    │   │  (pandas · group/filter/aggregate)│     │
│   │  6 tables     │   └───────────────────────────────────┘     │
│   └───────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

```
movies          (id, title, genre, release_year, runtime_minutes, director)
    │
    ├──< watch_activity  (viewer_id, movie_id, watched_at, duration, completed, device)
    ├──< reviews         (viewer_id, movie_id, rating, sentiment, created_at)
    ├──< marketing_spend (channel, spend_amount, impressions, clicks, region)
    └──< regional_performance (region, city, views, revenue, month, year)

viewers         (id, age_group, region, city, gender, subscription_tier)
    └──< watch_activity, reviews
```

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### 1. Clone and run setup
```bash
git clone <repo>
cd streamvision-insights
chmod +x setup.sh
./setup.sh
```

### 2. Add your API key
```bash
# Edit backend/.env
GEMINI_API_KEY=AIza...
```

### 3. Start the backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### 4. Start the frontend (new terminal)
```bash
cd frontend
npm run dev
```

### 5. Open the app
- **UI:** http://localhost:3000
- **API docs:** http://localhost:8000/docs
- **Health check:** http://localhost:8000/health

---

## Docker Setup

```bash
# Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env and set GEMINI_API_KEY

# Start everything
docker compose up --build
```

The backend handles data seeding (DB + PDFs + ChromaDB) automatically on first run.

To require API-key access locally, set the same key for both backend and frontend before building:

```bash
export APP_API_KEY="replace-with-a-random-secret"
export REQUIRE_API_KEY=true
docker compose up --build
```

---

## Example Queries

Try these in the UI or via curl:

1. **Performance ranking:**
   > Which titles performed best in 2025?

2. **Trend explanation:**
   > Why is Stellar Run trending recently?

3. **Title comparison:**
   > Compare Dark Orbit vs Last Kingdom.

4. **Geographic analysis:**
   > Which city had the strongest engagement last month?

5. **Diagnostic analysis:**
   > What explains weak comedy performance?

6. **Leadership recommendations:**
   > What recommendations would you give for leadership?

---

## Project Structure

```
streamvision-insights/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app + lifespan
│   │   ├── config.py                # Settings (pydantic-settings)
│   │   ├── db/
│   │   │   ├── database.py          # SQLAlchemy engine + session
│   │   │   └── models.py            # ORM models
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── chat.py              # POST /api/chat
│   │   │   ├── insights.py          # GET /api/insights
│   │   │   └── health.py            # GET /health
│   │   ├── tools/
│   │   │   ├── registry.py          # Tool definitions + dispatch
│   │   │   ├── sql_tool.py          # Parameterised SQL queries
│   │   │   ├── document_tool.py     # ChromaDB semantic search
│   │   │   ├── csv_tool.py          # Pandas CSV analysis
│   │   │   └── chart_tool.py        # Chart data generation
│   │   ├── orchestrator/
│   │   │   ├── agent.py             # Agentic loop (Gemini function calling)
│   │   │   └── prompts.py           # System prompt
│   │   ├── ingestion/
│   │   │   ├── seed_db.py           # CSV generation + SQLite seeding
│   │   │   ├── generate_pdfs.py     # PDF generation (reportlab)
│   │   │   └── ingest_documents.py  # PDF → ChromaDB ingestion
│   │   └── utils/
│   │       ├── logger.py            # Structured logging (structlog)
│   │       └── security.py          # Input validation + sanitisation
│   ├── tests/
│   │   └── test_tools.py            # Tool + security unit tests
│   ├── data/                        # Generated at runtime
│   │   ├── csv/                     # 6 business CSV files
│   │   ├── pdfs/                    # 5 internal PDF reports
│   │   ├── chroma/                  # ChromaDB vector index
│   │   └── insights.db              # SQLite database
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx             # Main layout (3-column)
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInterface.tsx # Message loop + input
│   │   │   │   ├── MessageBubble.tsx # Message + sources + chart
│   │   │   │   └── ToolTrace.tsx    # Collapsible tool call log
│   │   │   ├── Charts/
│   │   │   │   └── InsightsChart.tsx # Recharts wrapper
│   │   │   ├── Filters/
│   │   │   │   └── FilterPanel.tsx  # Year/genre/region/city
│   │   │   ├── Insights/
│   │   │   │   └── InsightsPanel.tsx # KPI cards + genre chart
│   │   │   └── SourceBadge/
│   │   │       └── SourceBadge.tsx  # SQL/Doc/CSV badge chips
│   │   └── lib/
│   │       ├── api.ts               # Backend client
│   │       └── types.ts             # TypeScript interfaces
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── setup.sh
└── README.md
```

---

## Security Model

### Input validation
- All user text validated before processing: length limits, blocked patterns (SQL injection, XSS, script injection)
- Tool inputs sanitised via `sanitize_string_param()` and `clamp_int()` before any DB or FS access

### API access
- `/api/chat` and `/api/insights` can require a static API key via `APP_API_KEY`.
- Set `REQUIRE_API_KEY=true` to require `X-API-Key` or `Authorization: Bearer <key>` in development; production requires a key automatically.

### SQL safety
- **The AI never writes SQL.** It selects a `query_type` enum value and provides parameters.
- All SQL uses SQLAlchemy `text()` with named bound parameters — no string concatenation
- Allowlisted query types: `top_titles`, `genre_performance`, `regional_breakdown`, etc.
- Results capped at configurable `MAX_QUERY_RESULTS`

### Document retrieval
- ChromaDB returns only text chunks and metadata (page, doc_type, source name)
- No arbitrary file system access — only PDFs in the designated `data/pdfs/` directory
- Relevance threshold filters very low-quality matches

### AI access boundaries
- The model receives **tool results**, not raw database connections
- PII is never in the model context (no viewer names, emails, or individual records)
- Only aggregate statistics are returned from viewer-related queries
- Tool traces shown in the UI are minimised and redact identifier fields.
- Max 8 agentic steps per request to prevent runaway loops

### Logging
- Structured JSON logging with `structlog`
- Secrets automatically redacted from log output (pattern matching on key names)
- Stack traces never surfaced to frontend — only safe error messages

---

## Tool-Calling Architecture

The orchestrator implements a standard agentic loop:

```
User question
     │
     ▼
Gemini (system prompt + tool definitions + messages)
     │
     ├── stop_reason="tool_use"
     │       │
     │       ▼
     │   Tool execution (registry dispatches to implementation)
     │       │
     │       ▼
     │   Append tool result to messages → loop back
     │
     └── stop_reason="end_turn"
             │
             ▼
         Final answer + tool trace + source attribution
```

**Tool definitions** are JSON Schema objects passed to the Gemini API. Gemini selects which tools to call and with what parameters — it never executes arbitrary code.

**Source attribution** is derived from the tool trace: if `query_business_data` was called, the source is `sql`; `search_documents` → `documents`; `analyze_csv` → `csv`. Citations include document names, page numbers, and SQL table names.

---

## Data Flow

```
1. Ingestion (one-time, runs on startup)
   seed_db.py          → generates CSV files + populates SQLite
   generate_pdfs.py    → creates 5 PDF reports (reportlab)
   ingest_documents.py → extracts PDF text → chunks → embeds → ChromaDB

2. Query (per request)
   User question → FastAPI → validate input → agent.run_agent()
       → Gemini decides tools → execute tools (SQL/doc/CSV/chart)
       → Gemini synthesises answer → return ChatResponse

3. Response
   { answer, sources, tool_trace, chart_data, citations, latency_ms }
   Frontend renders message + source badges + chart + tool trace
```

---

## Running Tests

```bash
cd backend
source venv/bin/activate

# Run tool + security unit tests
pytest tests/ -v

# Manual API test
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Which titles performed best in 2025?", "history": [], "filters": {}}'
```

The repository also includes a GitHub Actions workflow in `.github/workflows/ci.yml` that runs backend tests, frontend lint/build, and Docker image builds on pull requests and pushes to `main`.

---

## Assumptions & Tradeoffs

| Decision | Rationale | Tradeoff |
|---|---|---|
| SQLite over Postgres | Zero-dependency local setup | Not suitable for production scale |
| ChromaDB embedded | No external vector DB service needed | Single-node only |
| No streaming | Simpler client state management | Slower perceived latency for long answers |
| Enum-based query types (no LLM-generated SQL) | Eliminates SQL injection surface entirely | Less flexible than NL-to-SQL |
| Local PDF generation | No external files needed for demo | PDFs are synthetic |
| Max 8 agent steps | Prevents runaway API costs | May truncate complex multi-source reasoning |
| Static API key option | Simple protection for internal prototype endpoints | Production should use SSO/JWT with user identity and roles |
| Gemini function calling | Good hosted model support for tool use | Requires a configured provider API key |
| ChromaDB default embeddings | No separate embedding provider needed | First ingestion can be slower and retrieval quality is demo-grade |

Additional assumptions:
- The dataset is synthetic and generated locally. It is intended to demonstrate architecture and controls, not represent real business performance.
- The seeded activity data is strongest for Q1 2025. Questions outside the seeded period should be answered as unsupported or low-confidence unless additional seed data is added.
- Viewer records intentionally avoid direct PII such as names and emails. Viewer-related tools expose aggregate patterns rather than individual records.
- The frontend defaults to live backend data. Demo mode is available only as an explicit UI toggle for presentation fallback.
- Generated runtime files (`backend/data`, `.next`, local `.env` files) are excluded from git and recreated by setup/build commands.

---

## Limitations & Future Improvements

**Limitations of this prototype:**
- API-key auth is coarse-grained; it does not model user identity, roles, or per-user access control
- SQLite is single-writer; replace with Postgres for concurrent load
- PDF text extraction quality depends on PDF structure (scanned PDFs not supported)
- No streaming responses (full round-trip before display)
- Seed data is synthetic; real deployment would ingest actual business data

**Improvements for production:**
- Auth: JWT / SSO with RBAC and per-user audit trails
- Real-time streaming with Server-Sent Events
- Postgres + connection pooling
- Async SQLAlchemy queries
- Rate limiting per user
- Audit log for compliance (all queries logged with user identity)
- Multi-tenant data isolation
- Broader CI/CD with deployment previews and migration checks
- Monitoring: OpenTelemetry + Grafana

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | — | **Required.** Your Google Gemini API key |
| `AI_MODEL` | `gemini-2.5-flash` | Gemini model to use |
| `DATABASE_URL` | `sqlite:///./data/insights.db` | SQLAlchemy DB URL |
| `CHROMA_PERSIST_DIR` | `./data/chroma` | ChromaDB storage path |
| `CSV_DATA_DIR` | `./data/csv` | CSV files directory |
| `PDF_DATA_DIR` | `./data/pdfs` | PDF files directory |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `LOG_LEVEL` | `INFO` | Logging verbosity |
| `MAX_QUERY_RESULTS` | `100` | SQL result cap |
| `APP_ENV` | `development` | Enables /docs in non-production |
| `APP_API_KEY` | empty | Optional static API key for protected backend routes |
| `REQUIRE_API_KEY` | `false` | Require `APP_API_KEY` in development when set to `true` |
| `NEXT_PUBLIC_APP_API_KEY` | empty | Frontend API key header value for local/demo deployments |

---

*Built as a production-quality prototype demonstrating secure multi-source AI analytics architecture.*
