from __future__ import annotations
"""
CSV analytics tool — pandas-based analysis of business data files.
Provides flexible tabular operations without exposing raw file system access.
"""
from pathlib import Path
from typing import Any

import pandas as pd
import numpy as np

from app.config import get_settings
from app.utils.security import sanitize_string_param, clamp_int
from app.utils.logger import get_logger

settings = get_settings()
log = get_logger("csv_tool")

CSV_DIR = Path(settings.csv_data_dir)

_ALLOWED_FILES = {
    "movies", "viewers", "watch_activity",
    "reviews", "marketing_spend", "regional_performance",
}
_ALLOWED_AGG = {"mean", "sum", "count", "max", "min", "std"}

_df_cache: dict[str, pd.DataFrame] = {}


def _load_df(filename: str) -> pd.DataFrame | None:
    if filename in _df_cache:
        return _df_cache[filename]
    path = CSV_DIR / f"{filename}.csv"
    if not path.exists():
        log.warning("CSV file not found", file=str(path))
        return None
    try:
        df = pd.read_csv(path)
        _df_cache[filename] = df
        return df
    except Exception as e:
        log.error("Failed to load CSV", file=filename, error=str(e))
        return None


def _safe_columns(df: pd.DataFrame, *cols) -> list[str]:
    return [c for c in cols if c and c in df.columns]


def _df_to_records(df: pd.DataFrame, limit: int = 50) -> list[dict]:
    df = df.head(limit)
    # Replace NaN with None for JSON safety
    return df.replace({np.nan: None}).to_dict(orient="records")


def analyze_csv(filename: str, operation: str, **kwargs) -> dict:
    """Dispatch to appropriate analysis operation."""
    filename = sanitize_string_param(filename, 50)
    if filename not in _ALLOWED_FILES:
        return {"error": f"File '{filename}' not available. Allowed: {sorted(_ALLOWED_FILES)}"}

    df = _load_df(filename)
    if df is None:
        return {"error": f"Could not load {filename}.csv"}

    operation = sanitize_string_param(operation, 50)
    limit = clamp_int(kwargs.get("top_n", 20), 1, 100, 20)

    try:
        if operation == "summary_stats":
            numeric_cols = df.select_dtypes(include="number").columns.tolist()
            stats = df[numeric_cols].describe().round(2)
            return {
                "filename": filename,
                "operation": operation,
                "shape": list(df.shape),
                "columns": df.columns.tolist(),
                "numeric_summary": stats.to_dict(),
                "source": "csv",
            }

        elif operation == "group_aggregate":
            group_by = sanitize_string_param(kwargs.get("group_by", ""), 100)
            metric = sanitize_string_param(kwargs.get("metric", ""), 100)
            agg_func = kwargs.get("agg_func", "sum")
            sort_col = sanitize_string_param(kwargs.get("sort_col", metric), 100)
            ascending = bool(kwargs.get("sort_ascending", False))

            valid_cols = _safe_columns(df, group_by, metric)
            if not group_by or group_by not in df.columns:
                return {"error": f"group_by column '{group_by}' not found in {filename}"}
            if not metric or metric not in df.columns:
                return {"error": f"metric column '{metric}' not found in {filename}"}
            if agg_func not in _ALLOWED_AGG:
                agg_func = "sum"

            result = df.groupby(group_by)[metric].agg(agg_func).reset_index()
            result.columns = [group_by, f"{agg_func}_{metric}"]
            actual_sort = f"{agg_func}_{metric}" if sort_col == metric else sort_col
            if actual_sort in result.columns:
                result = result.sort_values(actual_sort, ascending=ascending)

            return {
                "filename": filename,
                "operation": operation,
                "group_by": group_by,
                "metric": metric,
                "agg_func": agg_func,
                "data": _df_to_records(result, limit),
                "source": "csv",
            }

        elif operation == "filter_rows":
            filter_col = sanitize_string_param(kwargs.get("filter_col", ""), 100)
            filter_val = sanitize_string_param(kwargs.get("filter_val", ""), 200)
            sort_col = sanitize_string_param(kwargs.get("sort_col", ""), 100)

            if not filter_col or filter_col not in df.columns:
                return {"error": f"filter_col '{filter_col}' not found in {filename}"}

            col_dtype = df[filter_col].dtype
            if pd.api.types.is_numeric_dtype(col_dtype):
                try:
                    filtered = df[df[filter_col] == float(filter_val)]
                except ValueError:
                    filtered = df[df[filter_col].astype(str).str.contains(filter_val, case=False, na=False)]
            else:
                filtered = df[df[filter_col].astype(str).str.contains(filter_val, case=False, na=False)]

            if sort_col and sort_col in filtered.columns:
                filtered = filtered.sort_values(sort_col, ascending=bool(kwargs.get("sort_ascending", False)))

            return {
                "filename": filename,
                "operation": operation,
                "filter": {filter_col: filter_val},
                "row_count": len(filtered),
                "data": _df_to_records(filtered, limit),
                "source": "csv",
            }

        elif operation == "top_n":
            sort_col = sanitize_string_param(kwargs.get("sort_col", ""), 100)
            ascending = bool(kwargs.get("sort_ascending", False))

            if sort_col and sort_col in df.columns:
                result = df.sort_values(sort_col, ascending=ascending)
            else:
                result = df

            return {
                "filename": filename,
                "operation": operation,
                "sort_by": sort_col,
                "data": _df_to_records(result, limit),
                "source": "csv",
            }

        elif operation == "value_counts":
            col = sanitize_string_param(kwargs.get("group_by", ""), 100)
            if not col or col not in df.columns:
                return {"error": f"Column '{col}' not found"}
            counts = df[col].value_counts().head(limit).reset_index()
            counts.columns = [col, "count"]
            return {
                "filename": filename,
                "operation": operation,
                "column": col,
                "data": _df_to_records(counts, limit),
                "source": "csv",
            }

        elif operation == "correlation":
            numeric_cols = df.select_dtypes(include="number").columns.tolist()
            if len(numeric_cols) < 2:
                return {"error": "Not enough numeric columns for correlation"}
            corr = df[numeric_cols].corr().round(3)
            return {
                "filename": filename,
                "operation": operation,
                "correlation_matrix": corr.to_dict(),
                "source": "csv",
            }

        else:
            return {"error": f"Unknown operation: {operation}. Valid: summary_stats, group_aggregate, filter_rows, top_n, value_counts, correlation"}

    except Exception as e:
        log.error("CSV tool error", filename=filename, operation=operation, error=str(e))
        return {"error": "CSV analysis failed", "detail": str(e)}
