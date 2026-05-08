from __future__ import annotations
"""
Chart data generator — produces frontend-ready structured data for Recharts.
Pulls from the same safe SQL queries and CSV tool so there's one source of truth.
"""
from typing import Any

from app.tools.sql_tool import run_query
from app.utils.security import clamp_int
from app.utils.logger import get_logger

log = get_logger("chart_tool")

_VALID_DATASETS = {
    "top_titles_views", "genre_distribution", "monthly_trend",
    "regional_performance", "marketing_roi", "audience_segments",
    "rating_distribution",
}


def get_chart_data(chart_type: str, dataset: str, params: dict | None = None) -> dict:
    if params is None:
        params = {}
    if dataset not in _VALID_DATASETS:
        return {"error": f"Unknown dataset: {dataset}"}

    year = clamp_int(params.get("year"), 2020, 2030, 2025)
    limit = clamp_int(params.get("limit"), 3, 20, 10)
    genre = params.get("genre")
    title = params.get("title")

    try:
        if dataset == "top_titles_views":
            result = run_query("top_titles", year=year, limit=limit, metric="views",
                               genre=genre)
            rows = result.get("data", [])
            return {
                "chart_type": chart_type or "bar",
                "title": f"Top {limit} Titles by Views ({year})",
                "x_key": "title",
                "series": [{"name": "Views", "data": [
                    {"title": r["title"], "value": r.get("total_views", 0)} for r in rows
                ]}],
                "source": "sql",
            }

        elif dataset == "genre_distribution":
            result = run_query("genre_performance", year=year)
            rows = result.get("data", [])
            if chart_type == "pie":
                return {
                    "chart_type": "pie",
                    "title": f"View Share by Genre ({year})",
                    "x_key": "genre",
                    "series": [{"name": "Views", "data": [
                        {"name": r["genre"], "value": r.get("total_views", 0)} for r in rows
                    ]}],
                    "source": "sql",
                }
            return {
                "chart_type": chart_type or "bar",
                "title": f"Genre Performance ({year})",
                "x_key": "genre",
                "series": [
                    {"name": "Views", "data": [{"genre": r["genre"], "value": r.get("total_views", 0)} for r in rows]},
                    {"name": "Avg Rating", "data": [{"genre": r["genre"], "value": float(r.get("avg_rating") or 0)} for r in rows]},
                ],
                "source": "sql",
            }

        elif dataset == "monthly_trend":
            if not title:
                title = "Stellar Run"
            result = run_query("title_trends", title=title)
            rows = result.get("data", [])
            return {
                "chart_type": chart_type or "line",
                "title": f"Monthly View Trend — {title}",
                "x_key": "month",
                "series": [{"name": "Views", "data": [
                    {"month": r["month"], "value": r.get("views", 0)} for r in rows
                ]}],
                "source": "sql",
            }

        elif dataset == "regional_performance":
            result = run_query("regional_breakdown", year=year)
            rows = result.get("data", [])[:10]
            return {
                "chart_type": chart_type or "bar",
                "title": f"Top Cities by Views ({year})",
                "x_key": "city",
                "series": [{"name": "Views", "data": [
                    {"city": r["city"], "value": r.get("total_views", 0)} for r in rows
                ]}],
                "source": "sql",
            }

        elif dataset == "marketing_roi":
            result = run_query("marketing_analysis")
            rows = result.get("data", [])
            # Aggregate by channel
            channel_data: dict[str, dict[str, float]] = {}
            for r in rows:
                ch = r.get("channel", "Unknown")
                if ch not in channel_data:
                    channel_data[ch] = {"spend": 0, "views": 0}
                channel_data[ch]["spend"] += float(r.get("total_spend") or 0)
                channel_data[ch]["views"] += int(r.get("total_views") or 0)
            data = [{"channel": ch, "spend": round(v["spend"] / 1000, 1),
                     "views": v["views"]} for ch, v in channel_data.items()]
            data.sort(key=lambda x: x["views"], reverse=True)
            return {
                "chart_type": chart_type or "bar",
                "title": "Marketing Spend vs Views by Channel",
                "x_key": "channel",
                "series": [
                    {"name": "Views", "data": data},
                    {"name": "Spend (₹K)", "data": data},
                ],
                "source": "sql",
            }

        elif dataset == "audience_segments":
            result = run_query("viewer_segments")
            rows = result.get("data", [])
            from collections import defaultdict
            seg_data: dict[str, int] = defaultdict(int)
            for r in rows:
                seg_data[r.get("age_group", "Unknown")] += int(r.get("views", 0))
            data = [{"age_group": k, "value": v} for k, v in seg_data.items()]
            data.sort(key=lambda x: x["value"], reverse=True)
            return {
                "chart_type": chart_type or "bar",
                "title": "Views by Audience Segment",
                "x_key": "age_group",
                "series": [{"name": "Views", "data": data}],
                "source": "sql",
            }

        elif dataset == "rating_distribution":
            result = run_query("top_titles", year=year, limit=15, metric="avg_rating")
            rows = result.get("data", [])
            return {
                "chart_type": chart_type or "bar",
                "title": f"Titles by Average Rating ({year})",
                "x_key": "title",
                "series": [{"name": "Avg Rating", "data": [
                    {"title": r["title"], "value": float(r.get("avg_rating") or 0)} for r in rows
                ]}],
                "source": "sql",
            }

    except Exception as e:
        log.error("Chart tool error", dataset=dataset, error=str(e))
        return {"error": "Chart generation failed", "detail": str(e)}

    return {"error": "Unhandled dataset"}
