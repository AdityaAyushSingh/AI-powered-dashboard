from __future__ import annotations
import re
from typing import Any
from pydantic import BaseModel


_DISALLOWED_INPUT_PATTERNS = [
    r"<script.*?>",
    r"javascript:",
    r"on\w+\s*=",
    r"\bexec\b",
    r"\beval\b",
    r"--",          # SQL comment
    r";\s*drop",    # SQL drop
    r";\s*delete",  # SQL delete
    r";\s*insert",  # SQL insert
    r";\s*update",  # SQL update
    r"union\s+select",
]

_COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in _DISALLOWED_INPUT_PATTERNS]


def validate_user_input(text: str) -> str:
    """Validate and sanitize user-facing text input."""
    if not isinstance(text, str):
        raise ValueError("Input must be a string")

    text = text.strip()

    if len(text) > 2000:
        raise ValueError("Input exceeds maximum length of 2000 characters")

    if len(text) < 2:
        raise ValueError("Input is too short")

    for pattern in _COMPILED_PATTERNS:
        if pattern.search(text):
            raise ValueError("Input contains disallowed content")

    return text


def sanitize_string_param(value: str, max_length: int = 200) -> str:
    """Sanitize a string parameter (for tool inputs, not SQL — SQLAlchemy handles that)."""
    if not isinstance(value, str):
        return ""
    value = value.strip()[:max_length]
    # Allow alphanumeric, spaces, hyphens, underscores, apostrophes
    value = re.sub(r"[^\w\s\-'.,]", "", value)
    return value


def clamp_int(value: Any, minimum: int, maximum: int, default: int) -> int:
    """Clamp an integer parameter to a safe range."""
    try:
        val = int(value)
        return max(minimum, min(maximum, val))
    except (TypeError, ValueError):
        return default
