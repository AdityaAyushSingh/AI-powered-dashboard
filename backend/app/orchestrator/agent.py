from __future__ import annotations
"""
Agent orchestrator — provider-agnostic agentic loop.
The LLM provider is selected via AI_PROVIDER env var (gemini | groq).
"""
import json
import time
import uuid
from typing import Any

from app.config import get_settings
from app.models.schemas import ChatResponse, ToolCall, Citation, ChartData, ChartDataset
from app.orchestrator.adapters import get_adapter, FunctionCall
from app.tools.registry import TOOL_DEFINITIONS, execute_tool
from app.utils.logger import get_logger

settings = get_settings()
log = get_logger("agent")

MAX_AGENTIC_STEPS = 8


def _extract_sources(tool_trace: list[ToolCall]) -> list[str]:
    sources: set[str] = set()
    for call in tool_trace:
        if call.tool == "query_business_data":
            sources.add("sql")
        elif call.tool == "search_documents":
            sources.add("documents")
        elif call.tool == "analyze_csv":
            sources.add("csv")
    return sorted(sources)


def _extract_citations(tool_trace: list[ToolCall]) -> list[Citation]:
    citations: list[Citation] = []
    seen: set[str] = set()
    for call in tool_trace:
        if not call.success:
            continue
        if call.tool == "query_business_data":
            qt = call.input.get("query_type", "")
            key = f"sql:{qt}"
            if key not in seen:
                citations.append(Citation(
                    source_type="sql",
                    description=f"SQL query: {qt}",
                    detail=call.output.get("table") if isinstance(call.output, dict) else None,
                ))
                seen.add(key)
        elif call.tool == "search_documents":
            passages = call.output.get("passages", []) if isinstance(call.output, dict) else []
            for p in passages:
                key = f"doc:{p.get('source')}:{p.get('page')}"
                if key not in seen:
                    citations.append(Citation(
                        source_type="document",
                        description=f"{p.get('title', 'Document')}, page {p.get('page')}",
                        detail=p.get("source"),
                    ))
                    seen.add(key)
        elif call.tool == "analyze_csv":
            fn = call.input.get("filename", "")
            key = f"csv:{fn}"
            if key not in seen:
                citations.append(Citation(
                    source_type="csv",
                    description=f"CSV analysis: {fn}.csv",
                ))
                seen.add(key)
    return citations


def run_agent(question: str, history: list[dict] | None = None,
              filters: dict | None = None) -> ChatResponse:
    start = time.monotonic()
    history = history or []
    request_id = str(uuid.uuid4())[:8]

    log.info("Agent start", request_id=request_id, provider=settings.ai_provider,
             model=settings.resolved_model, question=question[:80])

    if not settings.active_api_key:
        key_var = "GROQ_API_KEY" if settings.ai_provider == "groq" else "GEMINI_API_KEY"
        return ChatResponse(
            id=request_id,
            answer=f"Error: {key_var} is not configured. Please set it in your .env file.",
            sources=[],
            tool_trace=[],
            citations=[],
            latency_ms=0,
        )

    try:
        adapter = get_adapter(
            provider=settings.ai_provider,
            api_key=settings.active_api_key,
            model=settings.resolved_model,
        )
    except ValueError as e:
        return ChatResponse(
            id=request_id,
            answer=f"Configuration error: {e}",
            sources=[],
            tool_trace=[],
            citations=[],
            latency_ms=0,
        )

    messages = adapter.build_messages(question, history)
    tools = adapter.build_tools(TOOL_DEFINITIONS)
    tool_trace: list[ToolCall] = []
    chart_data: ChartData | None = None
    raw_chart_result: dict | None = None
    answer = ""

    steps = 0
    while steps < MAX_AGENTIC_STEPS:
        steps += 1
        log.info("Agent step", request_id=request_id, step=steps)

        try:
            max_retries = 3
            retry_delay = 2
            for attempt in range(max_retries):
                try:
                    turn = adapter.generate(messages, tools)
                    break
                except Exception as api_exc:
                    if "429" in str(api_exc) and attempt < max_retries - 1:
                        log.warning("Rate limited, retrying", attempt=attempt + 1, delay=retry_delay)
                        time.sleep(retry_delay)
                        retry_delay *= 2
                    else:
                        raise api_exc
        except Exception as e:
            log.error("API error", error=str(e))
            raise RuntimeError("The AI service is currently unavailable. Please try again later.") from e

        if not turn.function_calls:
            answer = turn.text
            break

        adapter.append_model_turn(messages, turn)

        results: list[str] = []
        for fc in turn.function_calls:
            tool_result, trace = execute_tool(fc.name, fc.args)
            tool_trace.append(trace)
            if fc.name == "get_chart_data" and trace.success:
                raw_chart_result = tool_result
            results.append(json.dumps(tool_result, default=str))

        adapter.append_tool_results(messages, turn.function_calls, results)

    else:
        answer = "The request exceeded the maximum processing steps. Partial results may be available."

    if raw_chart_result and "error" not in raw_chart_result:
        series = [
            ChartDataset(name=s.get("name", ""), data=s.get("data", []))
            for s in raw_chart_result.get("series", [])
        ]
        chart_data = ChartData(
            chart_type=raw_chart_result.get("chart_type", "bar"),
            title=raw_chart_result.get("title", ""),
            x_key=raw_chart_result.get("x_key", "name"),
            series=series,
        )

    latency_ms = int((time.monotonic() - start) * 1000)
    log.info("Agent complete", request_id=request_id, latency_ms=latency_ms,
             steps=steps, tool_calls=len(tool_trace))

    return ChatResponse(
        id=request_id,
        answer=answer,
        sources=_extract_sources(tool_trace),
        tool_trace=tool_trace,
        chart_data=chart_data,
        citations=_extract_citations(tool_trace),
        latency_ms=latency_ms,
    )
