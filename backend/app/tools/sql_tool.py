from __future__ import annotations
"""
Structured query tool — provides parameterised access to business data.
The AI NEVER writes raw SQL. It selects a query_type and provides safe parameters.
All queries use SQLAlchemy text() with bound parameters, preventing injection.
"""
from typing import Any
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.utils.security import sanitize_string_param, clamp_int
from app.utils.logger import get_logger

log = get_logger("sql_tool")

_VALID_METRICS = {"views", "revenue", "avg_rating", "completion_rate"}
_VALID_QUERY_TYPES = {
    "top_titles", "genre_performance", "regional_breakdown",
    "viewer_segments", "marketing_analysis", "title_comparison",
    "title_trends", "summary_kpis",
}


def _safe_metric(metric: str | None, default: str = "views") -> str:
    if metric not in _VALID_METRICS:
        return default
    # Map to actual column names
    mapping = {
        "views": "total_views",
        "revenue": "total_revenue",
        "avg_rating": "avg_rating",
        "completion_rate": "completion_rate",
    }
    return mapping.get(metric, "total_views")


def _execute(db: Session, stmt: str, params: dict) -> list[dict]:
    rows = db.execute(text(stmt), params).mappings().all()
    return [dict(r) for r in rows]


def query_top_titles(db: Session, year: int, genre: str | None,
                     limit: int, metric: str) -> list[dict]:
    col = _safe_metric(metric)
    params: dict[str, Any] = {"year": year, "limit": limit}
    genre_clause = ""
    if genre:
        genre_clause = "AND m.genre = :genre"
        params["genre"] = genre

    stmt = f"""
        SELECT
            m.id,
            m.title,
            m.genre,
            m.release_year,
            m.director,
            COALESCE(wa_agg.total_views, 0) AS total_views,
            ROUND(r_agg.avg_rating, 2) AS avg_rating,
            COALESCE(rp_agg.total_revenue, 0.0) AS total_revenue,
            COALESCE(wa_agg.completion_rate, 0.0) AS completion_rate
        FROM movies m
        LEFT JOIN (
            SELECT movie_id,
                   COUNT(*) AS total_views,
                   ROUND(100.0 * SUM(CASE WHEN completed THEN 1 ELSE 0 END) / COUNT(*), 1) AS completion_rate
            FROM watch_activity
            WHERE strftime('%Y', watched_at) = CAST(:year AS TEXT)
            GROUP BY movie_id
        ) wa_agg ON wa_agg.movie_id = m.id
        LEFT JOIN (
            SELECT movie_id, AVG(rating) AS avg_rating
            FROM reviews
            GROUP BY movie_id
        ) r_agg ON r_agg.movie_id = m.id
        LEFT JOIN (
            SELECT movie_id, SUM(revenue) AS total_revenue
            FROM regional_performance
            WHERE year = :year
            GROUP BY movie_id
        ) rp_agg ON rp_agg.movie_id = m.id
        WHERE 1=1 {genre_clause}
        ORDER BY {col} DESC
        LIMIT :limit
    """
    return _execute(db, stmt, params)


def query_genre_performance(db: Session, year: int) -> list[dict]:
    stmt = """
        SELECT
            m.genre,
            COUNT(DISTINCT m.id) AS title_count,
            COALESCE(SUM(wa_agg.total_views), 0) AS total_views,
            ROUND(AVG(r_agg.avg_rating), 2) AS avg_rating,
            ROUND(AVG(wa_agg.completion_rate), 1) AS completion_rate,
            ROUND(COALESCE(SUM(rp_agg.total_revenue), 0), 2) AS total_revenue
        FROM movies m
        LEFT JOIN (
            SELECT movie_id,
                   COUNT(*) AS total_views,
                   ROUND(100.0 * SUM(CASE WHEN completed THEN 1 ELSE 0 END) / COUNT(*), 1) AS completion_rate
            FROM watch_activity
            WHERE strftime('%Y', watched_at) = CAST(:year AS TEXT)
            GROUP BY movie_id
        ) wa_agg ON wa_agg.movie_id = m.id
        LEFT JOIN (
            SELECT movie_id, AVG(rating) AS avg_rating
            FROM reviews GROUP BY movie_id
        ) r_agg ON r_agg.movie_id = m.id
        LEFT JOIN (
            SELECT movie_id, SUM(revenue) AS total_revenue
            FROM regional_performance WHERE year = :year GROUP BY movie_id
        ) rp_agg ON rp_agg.movie_id = m.id
        GROUP BY m.genre
        ORDER BY total_views DESC
    """
    return _execute(db, stmt, {"year": year})


def query_regional_breakdown(db: Session, year: int, month: int | None,
                              region: str | None, city: str | None) -> list[dict]:
    params: dict[str, Any] = {"year": year}
    clauses = []
    if month:
        clauses.append("AND rp.month = :month")
        params["month"] = month
    if region:
        clauses.append("AND rp.region = :region")
        params["region"] = region
    if city:
        clauses.append("AND rp.city = :city")
        params["city"] = city

    stmt = f"""
        SELECT
            rp.region,
            rp.city,
            SUM(rp.views) AS total_views,
            ROUND(SUM(rp.revenue), 2) AS total_revenue,
            COUNT(DISTINCT rp.movie_id) AS unique_titles
        FROM regional_performance rp
        WHERE rp.year = :year
        {''.join(clauses)}
        GROUP BY rp.region, rp.city
        ORDER BY total_views DESC
        LIMIT 20
    """
    return _execute(db, stmt, params)


def query_viewer_segments(db: Session, movie_id: int | None) -> list[dict]:
    params: dict[str, Any] = {}
    movie_clause = ""
    if movie_id:
        movie_clause = "AND wa.movie_id = :movie_id"
        params["movie_id"] = movie_id

    stmt = f"""
        SELECT
            v.age_group,
            v.gender,
            v.subscription_tier,
            COUNT(wa.id) AS views,
            ROUND(
                100.0 * SUM(CASE WHEN wa.completed THEN 1 ELSE 0 END) / NULLIF(COUNT(wa.id), 0),
                1
            ) AS completion_rate
        FROM watch_activity wa
        JOIN viewers v ON v.id = wa.viewer_id
        WHERE 1=1 {movie_clause}
        GROUP BY v.age_group, v.gender, v.subscription_tier
        ORDER BY views DESC
        LIMIT 30
    """
    return _execute(db, stmt, params)


def query_marketing_analysis(db: Session, movie_id: int | None,
                              movie_title: str | None) -> list[dict]:
    params: dict[str, Any] = {}
    clauses = []

    if movie_id:
        clauses.append("WHERE ms.movie_id = :movie_id")
        params["movie_id"] = movie_id
    elif movie_title:
        clauses.append("WHERE m.title LIKE :title")
        params["title"] = f"%{movie_title}%"

    stmt = f"""
        SELECT
            m.title,
            ms.channel,
            ROUND(SUM(ms.spend_amount), 2) AS total_spend,
            SUM(ms.impressions) AS total_impressions,
            SUM(ms.clicks) AS total_clicks,
            ROUND(
                100.0 * SUM(ms.clicks) / NULLIF(SUM(ms.impressions), 0),
                2
            ) AS ctr_pct,
            COUNT(wa.id) AS total_views,
            ROUND(
                SUM(ms.spend_amount) / NULLIF(COUNT(wa.id), 0),
                2
            ) AS cost_per_view
        FROM marketing_spend ms
        JOIN movies m ON m.id = ms.movie_id
        LEFT JOIN watch_activity wa ON wa.movie_id = ms.movie_id
        {''.join(clauses)}
        GROUP BY m.title, ms.channel
        ORDER BY total_spend DESC
    """
    return _execute(db, stmt, params)


def query_title_comparison(db: Session, title_a: str, title_b: str) -> list[dict]:
    stmt = """
        SELECT
            m.title,
            m.genre,
            m.release_year,
            COALESCE(wa_agg.total_views, 0) AS total_views,
            ROUND(r_agg.avg_rating, 2) AS avg_rating,
            COALESCE(wa_agg.completion_rate, 0.0) AS completion_rate,
            COALESCE(rp_agg.total_revenue, 0.0) AS total_revenue
        FROM movies m
        LEFT JOIN (
            SELECT movie_id, COUNT(*) AS total_views,
                   ROUND(100.0 * SUM(CASE WHEN completed THEN 1 ELSE 0 END) / COUNT(*), 1) AS completion_rate
            FROM watch_activity GROUP BY movie_id
        ) wa_agg ON wa_agg.movie_id = m.id
        LEFT JOIN (
            SELECT movie_id, AVG(rating) AS avg_rating FROM reviews GROUP BY movie_id
        ) r_agg ON r_agg.movie_id = m.id
        LEFT JOIN (
            SELECT movie_id, SUM(revenue) AS total_revenue FROM regional_performance GROUP BY movie_id
        ) rp_agg ON rp_agg.movie_id = m.id
        WHERE m.title LIKE :title_a OR m.title LIKE :title_b
    """
    return _execute(db, stmt, {"title_a": f"%{title_a}%", "title_b": f"%{title_b}%"})


def query_title_trends(db: Session, title: str) -> list[dict]:
    stmt = """
        SELECT
            strftime('%Y-%m', wa.watched_at) AS month,
            COUNT(wa.id) AS views,
            ROUND(
                100.0 * SUM(CASE WHEN wa.completed THEN 1 ELSE 0 END) / NULLIF(COUNT(wa.id), 0),
                1
            ) AS completion_rate
        FROM watch_activity wa
        JOIN movies m ON m.id = wa.movie_id
        WHERE m.title LIKE :title
        GROUP BY strftime('%Y-%m', wa.watched_at)
        ORDER BY month ASC
    """
    return _execute(db, stmt, {"title": f"%{title}%"})


def query_summary_kpis(db: Session, year: int) -> dict:
    stmt = """
        SELECT
            (SELECT COUNT(DISTINCT movie_id) FROM watch_activity
             WHERE strftime('%Y', watched_at) = CAST(:year AS TEXT)) AS active_titles,
            (SELECT COUNT(*) FROM watch_activity
             WHERE strftime('%Y', watched_at) = CAST(:year AS TEXT)) AS total_views,
            (SELECT ROUND(AVG(rating), 2) FROM reviews) AS platform_avg_rating,
            (SELECT ROUND(100.0 * SUM(CASE WHEN completed THEN 1 ELSE 0 END) / COUNT(*), 1)
             FROM watch_activity
             WHERE strftime('%Y', watched_at) = CAST(:year AS TEXT)) AS platform_completion_rate,
            (SELECT ROUND(SUM(revenue), 2) FROM regional_performance WHERE year = :year) AS total_revenue,
            (SELECT COUNT(DISTINCT viewer_id) FROM watch_activity
             WHERE strftime('%Y', watched_at) = CAST(:year AS TEXT)) AS active_viewers
    """
    rows = _execute(db, stmt, {"year": year})
    return rows[0] if rows else {}


# ── Public entrypoint ─────────────────────────────────────────────────────────

def run_query(query_type: str, **kwargs) -> dict:
    """Safe entrypoint called by the tool registry. Returns structured result."""
    if query_type not in _VALID_QUERY_TYPES:
        return {"error": f"Unknown query_type: {query_type}"}

    # Sanitise common params
    year = clamp_int(kwargs.get("year"), 2020, 2030, 2025)
    month = clamp_int(kwargs.get("month"), 1, 12, 0) if kwargs.get("month") else None
    limit = clamp_int(kwargs.get("limit"), 1, 50, 10)
    genre = sanitize_string_param(kwargs.get("genre", ""), 50) or None
    region = sanitize_string_param(kwargs.get("region", ""), 50) or None
    city = sanitize_string_param(kwargs.get("city", ""), 100) or None
    title = sanitize_string_param(kwargs.get("title", ""), 200) or None
    title_b = sanitize_string_param(kwargs.get("title_b", ""), 200) or None
    metric = kwargs.get("metric", "views")

    db = SessionLocal()
    try:
        if query_type == "top_titles":
            data = query_top_titles(db, year, genre, limit, metric)
            return {"query_type": query_type, "year": year, "data": data,
                    "source": "sql", "table": "movies, watch_activity, reviews"}

        elif query_type == "genre_performance":
            data = query_genre_performance(db, year)
            return {"query_type": query_type, "year": year, "data": data,
                    "source": "sql", "table": "movies, watch_activity"}

        elif query_type == "regional_breakdown":
            data = query_regional_breakdown(db, year, month, region, city)
            return {"query_type": query_type, "year": year, "data": data,
                    "source": "sql", "table": "regional_performance"}

        elif query_type == "viewer_segments":
            movie_id_raw = kwargs.get("movie_id")
            movie_id = int(movie_id_raw) if movie_id_raw else None
            data = query_viewer_segments(db, movie_id)
            return {"query_type": query_type, "data": data,
                    "source": "sql", "table": "viewers, watch_activity"}

        elif query_type == "marketing_analysis":
            movie_id_raw = kwargs.get("movie_id")
            movie_id = int(movie_id_raw) if movie_id_raw else None
            data = query_marketing_analysis(db, movie_id, title)
            return {"query_type": query_type, "data": data,
                    "source": "sql", "table": "marketing_spend"}

        elif query_type == "title_comparison":
            if not title or not title_b:
                return {"error": "title and title_b are required for title_comparison"}
            data = query_title_comparison(db, title, title_b)
            return {"query_type": query_type, "data": data,
                    "source": "sql", "table": "movies, watch_activity, reviews"}

        elif query_type == "title_trends":
            if not title:
                return {"error": "title is required for title_trends"}
            data = query_title_trends(db, title)
            return {"query_type": query_type, "title": title, "data": data,
                    "source": "sql", "table": "watch_activity"}

        elif query_type == "summary_kpis":
            data = query_summary_kpis(db, year)
            return {"query_type": query_type, "year": year, "data": data,
                    "source": "sql", "table": "watch_activity, reviews, regional_performance"}

    except Exception as e:
        log.error("SQL tool error", query_type=query_type, error=str(e))
        return {"error": "Query execution failed"}
    finally:
        db.close()

    return {"error": "Unhandled query type"}
