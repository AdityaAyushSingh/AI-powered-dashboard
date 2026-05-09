from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Any, Literal, Optional
from datetime import datetime


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=4000)


class Filters(BaseModel):
    year: int | None = Field(default=None, ge=2020, le=2030)
    genre: str | None = Field(default=None, max_length=50)
    region: str | None = Field(default=None, max_length=50)
    city: str | None = Field(default=None, max_length=100)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    filters: Filters = Field(default_factory=Filters)


class ToolCall(BaseModel):
    tool: str
    input: dict[str, Any]
    output: Any
    duration_ms: int
    success: bool


class Citation(BaseModel):
    source_type: str  # "sql" | "document" | "csv"
    description: str
    detail: Optional[str] = None


class ChartDataset(BaseModel):
    name: str
    data: list[Any]


class ChartData(BaseModel):
    chart_type: str  # "bar" | "line" | "pie" | "area"
    title: str
    x_key: str
    series: list[ChartDataset]
    x_labels: Optional[list[str]] = None


class ChatResponse(BaseModel):
    id: str
    answer: str
    sources: list[str]
    tool_trace: list[ToolCall]
    chart_data: Optional[ChartData] = None
    citations: list[Citation]
    latency_ms: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InsightsResponse(BaseModel):
    total_views_2025: int
    top_genre: str
    top_title: str
    avg_rating: float
    total_revenue_2025: float
    active_viewers: int
    top_city: str
    genre_breakdown: list[dict[str, Any]]
    monthly_trend: list[dict[str, Any]]


class HealthResponse(BaseModel):
    status: str
    db: str
    vector_store: str
    ai_model: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
