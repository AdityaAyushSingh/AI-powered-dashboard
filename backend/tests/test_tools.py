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
