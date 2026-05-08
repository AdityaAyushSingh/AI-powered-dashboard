from __future__ import annotations
import structlog
import logging
import sys
from app.config import get_settings

settings = get_settings()

_REDACT_KEYS = {"anthropic_api_key", "api_key", "password", "token", "secret", "authorization"}


def _redact(logger: object, method_name: str, event_dict: dict) -> dict:
    for key in list(event_dict.keys()):
        if any(r in key.lower() for r in _REDACT_KEYS):
            event_dict[key] = "[REDACTED]"
    return event_dict


def configure_logging() -> None:
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            _redact,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.ConsoleRenderer() if settings.app_env == "development"
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(sys.stdout),
    )


def get_logger(name: str) -> structlog.BoundLogger:
    return structlog.get_logger(name)
