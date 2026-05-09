from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from app.models.schemas import InsightsResponse
from app.tools.sql_tool import run_query
from app.utils.auth import verify_api_key
from app.utils.logger import get_logger

router = APIRouter(prefix="/api", tags=["insights"], dependencies=[Depends(verify_api_key)])
log = get_logger("router.insights")


@router.get("/insights", response_model=InsightsResponse)
async def get_insights() -> InsightsResponse:
    try:
        kpis = run_query("summary_kpis", year=2025)
        top_titles = run_query("top_titles", year=2025, limit=1, metric="views")
        genre_data = run_query("genre_performance", year=2025)
        regional_data = run_query("regional_breakdown", year=2025)
        monthly_data = run_query("title_trends", title="")  # all titles

        kpi = kpis.get("data", {})
        top_title = top_titles.get("data", [{}])[0].get("title", "N/A")
        top_genre = (genre_data.get("data", [{}]) or [{}])[0].get("genre", "N/A")
        top_city = (regional_data.get("data", [{}]) or [{}])[0].get("city", "N/A")

        return InsightsResponse(
            total_views_2025=int(kpi.get("total_views", 0) or 0),
            top_genre=top_genre,
            top_title=top_title,
            avg_rating=float(kpi.get("platform_avg_rating", 0.0) or 0.0),
            total_revenue_2025=float(kpi.get("total_revenue", 0.0) or 0.0),
            active_viewers=int(kpi.get("active_viewers", 0) or 0),
            top_city=top_city,
            genre_breakdown=genre_data.get("data", []),
            monthly_trend=[],
        )
    except Exception as e:
        log.error("Insights error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to load insights")
