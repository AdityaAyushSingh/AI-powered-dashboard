from __future__ import annotations
"""
Tool registry — defines tool schemas for the AI and routes calls to implementations.
This is the single point of control for what the AI can and cannot do.
"""
import json
import time
from typing import Any

from app.tools.sql_tool import run_query
from app.tools.document_tool import search_documents
from app.tools.csv_tool import analyze_csv
from app.tools.chart_tool import get_chart_data
from app.models.schemas import ToolCall
from app.utils.logger import get_logger

log = get_logger("tool_registry")

# ── Tool schemas (sent to Claude) ─────────────────────────────────────────────

TOOL_DEFINITIONS = [
    {
        "name": "query_business_data",
        "description": (
            "Query the internal SQL database for structured business metrics. "
            "Use for: movie performance rankings, viewership statistics, genre trends, "
            "marketing spend analysis, regional performance breakdowns, audience demographics, "
            "and platform KPIs. "
            "Do NOT use for qualitative insights, strategic context, or policy questions — "
            "use search_documents for those."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query_type": {
                    "type": "string",
                    "enum": [
                        "top_titles",
                        "genre_performance",
                        "regional_breakdown",
                        "viewer_segments",
                        "marketing_analysis",
                        "title_comparison",
                        "title_trends",
                        "summary_kpis",
                    ],
                    "description": "The category of business query to run.",
                },
                "year": {"type": "integer", "description": "Filter by year, e.g. 2025."},
                "month": {"type": "integer", "description": "Filter by month 1–12."},
                "genre": {"type": "string", "description": "Filter by genre name, e.g. 'Action'."},
                "region": {"type": "string", "description": "Filter by region name."},
                "city": {"type": "string", "description": "Filter by city name."},
                "title": {"type": "string", "description": "Movie title (or partial match) to analyse."},
                "title_b": {"type": "string", "description": "Second title for comparison queries."},
                "limit": {"type": "integer", "description": "Max rows to return (default 10, max 50)."},
                "metric": {
                    "type": "string",
                    "enum": ["views", "revenue", "avg_rating", "completion_rate"],
                    "description": "Primary metric to rank or sort by.",
                },
            },
            "required": ["query_type"],
        },
    },
    {
        "name": "search_documents",
        "description": (
            "Search internal PDF reports and policy documents for qualitative insights. "
            "Use for: strategic recommendations, policy requirements, qualitative findings, "
            "executive summaries, campaign analysis narratives, and audience behaviour research. "
            "Returns relevant text passages with document source and page references."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Natural language search query.",
                },
                "document_filter": {
                    "type": "string",
                    "enum": ["all", "quarterly_report", "campaign_summary",
                             "content_roadmap", "policy", "audience_behavior"],
                    "description": "Limit search to a specific document type.",
                },
                "n_results": {
                    "type": "integer",
                    "description": "Number of passages to return (1–5). Default 3.",
                },
            },
            "required": ["query"],
        },
    },
    {
        "name": "analyze_csv",
        "description": (
            "Perform tabular analysis on business CSV data files using pandas. "
            "Use for: flexible grouping, aggregation, filtering, and distribution analysis "
            "that complements structured SQL queries. Prefer query_business_data for standard "
            "metrics; use this for more exploratory or custom analyses."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "enum": ["movies", "viewers", "watch_activity",
                             "reviews", "marketing_spend", "regional_performance"],
                },
                "operation": {
                    "type": "string",
                    "enum": ["summary_stats", "group_aggregate", "filter_rows",
                             "top_n", "value_counts", "correlation"],
                },
                "group_by": {"type": "string", "description": "Column to group by."},
                "metric": {"type": "string", "description": "Column to aggregate."},
                "agg_func": {
                    "type": "string",
                    "enum": ["mean", "sum", "count", "max", "min"],
                    "description": "Aggregation function (default: sum).",
                },
                "filter_col": {"type": "string", "description": "Column to filter on."},
                "filter_val": {"type": "string", "description": "Value to match."},
                "top_n": {"type": "integer", "description": "Number of rows to return."},
                "sort_col": {"type": "string", "description": "Column to sort by."},
                "sort_ascending": {"type": "boolean"},
            },
            "required": ["filename", "operation"],
        },
    },
    {
        "name": "get_chart_data",
        "description": (
            "Generate structured data for a chart visualisation. "
            "Call this when a visual summary would be useful. "
            "The frontend will render the result as an interactive Recharts chart."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "chart_type": {
                    "type": "string",
                    "enum": ["bar", "line", "pie", "area"],
                },
                "dataset": {
                    "type": "string",
                    "enum": [
                        "top_titles_views",
                        "genre_distribution",
                        "monthly_trend",
                        "regional_performance",
                        "marketing_roi",
                        "audience_segments",
                        "rating_distribution",
                    ],
                },
                "params": {
                    "type": "object",
                    "description": "Optional params: year, limit, genre, title.",
                },
            },
            "required": ["chart_type", "dataset"],
        },
    },
]


def execute_tool(tool_name: str, tool_input: dict) -> tuple[Any, ToolCall]:
    """Execute a tool by name and return (result, ToolCall) for the trace."""
    start = time.monotonic()
    result = None
    success = True

    try:
        if tool_name == "query_business_data":
            result = run_query(**tool_input)
        elif tool_name == "search_documents":
            result = search_documents(**tool_input)
        elif tool_name == "analyze_csv":
            result = analyze_csv(**tool_input)
        elif tool_name == "get_chart_data":
            result = get_chart_data(**tool_input)
        else:
            result = {"error": f"Unknown tool: {tool_name}"}
            success = False

        if isinstance(result, dict) and "error" in result:
            success = False

    except Exception as e:
        log.error("Tool execution error", tool=tool_name, error=str(e))
        result = {"error": str(e)}
        success = False

    duration_ms = int((time.monotonic() - start) * 1000)

    # Build a sanitised copy for the trace (no full data dump)
    trace_output = result
    if isinstance(result, dict) and "data" in result:
        data = result["data"]
        trace_output = {
            **{k: v for k, v in result.items() if k != "data"},
            "row_count": len(data) if isinstance(data, list) else 1,
            "preview": data[:3] if isinstance(data, list) else data,
        }

    tool_call = ToolCall(
        tool=tool_name,
        input=tool_input,
        output=trace_output,
        duration_ms=duration_ms,
        success=success,
    )

    log.info("Tool executed", tool=tool_name, duration_ms=duration_ms, success=success)
    return result, tool_call
