"""
Core tool unit tests.
Run with: pytest tests/ -v
These tests exercise the tool layer against the seeded SQLite database.
"""
import pytest
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.tools.sql_tool import run_query
from app.tools.csv_tool import analyze_csv
from app.tools.registry import execute_tool
from app.utils.security import validate_user_input, sanitize_string_param, clamp_int


class TestSQLTool:
    def test_top_titles_returns_data(self):
        result = run_query("top_titles", year=2025, limit=5)
        assert "data" in result
        assert isinstance(result["data"], list)

    def test_top_titles_respects_limit(self):
        result = run_query("top_titles", year=2025, limit=3)
        assert len(result.get("data", [])) <= 3

    def test_genre_performance(self):
        result = run_query("genre_performance", year=2025)
        assert "data" in result
        genres = [r["genre"] for r in result["data"]]
        assert "Action" in genres

    def test_regional_breakdown(self):
        result = run_query("regional_breakdown", year=2025)
        assert "data" in result
        assert len(result["data"]) > 0

    def test_title_comparison(self):
        result = run_query("title_comparison", title="Dark Orbit", title_b="Last Kingdom")
        assert "data" in result
        assert len(result["data"]) == 2

    def test_title_trends(self):
        result = run_query("title_trends", title="Stellar Run")
        assert "data" in result

    def test_summary_kpis(self):
        result = run_query("summary_kpis", year=2025)
        assert "data" in result
        assert "total_views" in result["data"]

    def test_invalid_query_type(self):
        result = run_query("invalid_type")
        assert "error" in result

    def test_sql_injection_prevention(self):
        # Malicious input gets sanitised before reaching the query
        result = run_query("top_titles", title="'; DROP TABLE movies; --")
        # Should either return empty results or an error, never execute the injection
        assert "error" in result or isinstance(result.get("data"), list)


class TestSecurity:
    def test_valid_input_passes(self):
        assert validate_user_input("Which movies performed best in 2025?") == \
               "Which movies performed best in 2025?"

    def test_short_input_rejected(self):
        with pytest.raises(ValueError):
            validate_user_input("x")

    def test_script_tag_rejected(self):
        with pytest.raises(ValueError):
            validate_user_input("<script>alert('xss')</script>")

    def test_sql_injection_rejected(self):
        with pytest.raises(ValueError):
            validate_user_input("'; UNION SELECT * FROM users; --")

    def test_sanitize_string_param(self):
        result = sanitize_string_param("Action!")
        assert result == "Action"

    def test_clamp_int_within_range(self):
        assert clamp_int(5, 1, 10, 5) == 5
        assert clamp_int(0, 1, 10, 5) == 1
        assert clamp_int(100, 1, 10, 5) == 10
        assert clamp_int("invalid", 1, 10, 5) == 5


class TestCSVSecurity:
    def test_sensitive_csv_rejects_raw_row_listing(self):
        result = analyze_csv("viewers", "top_n", top_n=3)
        assert "error" in result
        assert "raw row" in result["error"]

    def test_sensitive_csv_allows_safe_aggregates(self):
        result = analyze_csv(
            "viewers",
            "value_counts",
            group_by="subscription_tier",
            top_n=5,
        )
        assert "data" in result
        assert all("subscription_tier" in row for row in result["data"])

    def test_tool_trace_redacts_identifiers(self):
        _, trace = execute_tool(
            "query_business_data",
            {"query_type": "top_titles", "year": 2025, "limit": 1},
        )
        preview = trace.output.get("preview", [])
        assert preview
        assert preview[0].get("id") == "[REDACTED]"
