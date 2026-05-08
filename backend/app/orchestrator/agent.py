from __future__ import annotations
"""
Agent orchestrator — agentic loop using Gemini's function-calling API.
Maintains a bounded agentic loop: the model calls tools, receives results,
and continues until it produces a final response or hits the max step limit.
"""
import json
import time
import uuid
from typing import Any

from google import genai
from google.genai import types

from app.config import get_settings
from app.models.schemas import ChatResponse, ToolCall, Citation, ChartData, ChartDataset
from app.orchestrator.prompts import SYSTEM_PROMPT
from app.tools.registry import TOOL_DEFINITIONS, execute_tool
from app.utils.logger import get_logger

settings = get_settings()
log = get_logger("agent")

MAX_AGENTIC_STEPS = 8  # prevent runaway loops


def _build_gemini_tools() -> list[types.Tool]:
    """Convert registry tool definitions to Gemini FunctionDeclaration format."""
    declarations = [
        types.FunctionDeclaration(
            name=t["name"],
            description=t["description"],
            parameters=t["input_schema"],
        )
        for t in TOOL_DEFINITIONS
    ]
    return [types.Tool(function_declarations=declarations)]


_GEMINI_TOOLS = _build_gemini_tools()


def _build_contents(question: str, history: list[dict]) -> list[types.Content]:
    contents = []
    for msg in history[-6:]:  # cap history to last 3 turns
        role = msg.get("role")
        if role == "user":
            contents.append(types.Content(role="user", parts=[types.Part(text=msg["content"])]))
        elif role == "assistant":
            contents.append(types.Content(role="model", parts=[types.Part(text=msg["content"])]))
    contents.append(types.Content(role="user", parts=[types.Part(text=question)]))
    return contents


def _extract_sources(tool_trace: list[ToolCall]) -> list[str]:
    sources = set()
    for call in tool_trace:
        if call.tool == "query_business_data":
            sources.add("sql")
        elif call.tool == "search_documents":
            sources.add("documents")
        elif call.tool == "analyze_csv":
            sources.add("csv")
    return sorted(sources)


def _extract_citations(tool_trace: list[ToolCall]) -> list[Citation]:
    citations = []
    seen = set()
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

    log.info("Agent start", request_id=request_id, question=question[:80])

    if not settings.gemini_api_key:
        return ChatResponse(
            id=request_id,
            answer="Error: GEMINI_API_KEY is not configured. Please set it in your .env file.",
            sources=[],
            tool_trace=[],
            citations=[],
            latency_ms=0,
        )

    client = genai.Client(api_key=settings.gemini_api_key)
    contents = _build_contents(question, history)
    tool_trace: list[ToolCall] = []
    chart_data: ChartData | None = None
    raw_chart_result: dict | None = None
    answer = ""

    steps = 0
    while steps < MAX_AGENTIC_STEPS:
        steps += 1
        log.info("Agent step", request_id=request_id, step=steps)

        try:
            response = client.models.generate_content(
                model=settings.ai_model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    tools=_GEMINI_TOOLS,
                ),
            )
        except Exception as e:
            log.error("API error", error=str(e))
            return ChatResponse(
                id=request_id,
                answer=f"The AI service returned an error: {e}",
                sources=[],
                tool_trace=tool_trace,
                citations=[],
                latency_ms=int((time.monotonic() - start) * 1000),
            )

        candidate = response.candidates[0]
        model_content = candidate.content

        # Collect any function-call parts
        fc_parts = [p for p in model_content.parts if p.function_call]

        if not fc_parts:
            # Final text response — no more tool calls
            answer = "".join(p.text for p in model_content.parts if p.text).strip()
            break

        # Append the model's function-call turn to the conversation
        contents.append(model_content)

        # Execute each tool and build function-response parts
        fn_response_parts = []
        for part in fc_parts:
            fc = part.function_call
            tool_input = dict(fc.args) if fc.args else {}
            tool_result, trace = execute_tool(fc.name, tool_input)
            tool_trace.append(trace)

            if fc.name == "get_chart_data" and trace.success:
                raw_chart_result = tool_result

            fn_response_parts.append(
                types.Part(
                    function_response=types.FunctionResponse(
                        name=fc.name,
                        response={"result": json.dumps(tool_result, default=str)},
                    )
                )
            )

        contents.append(types.Content(role="user", parts=fn_response_parts))

    else:
        answer = "The request exceeded the maximum processing steps. Partial results may be available."

    # Build chart data model from raw result
    if raw_chart_result and "error" not in raw_chart_result:
        series_raw = raw_chart_result.get("series", [])
        series = [
            ChartDataset(name=s.get("name", ""), data=s.get("data", []))
            for s in series_raw
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
