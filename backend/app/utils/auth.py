from __future__ import annotations

import secrets

from fastapi import Header, HTTPException, status

from app.config import get_settings


async def verify_api_key(
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None),
) -> None:
    """Require a static API key when configured or when explicitly required."""
    settings = get_settings()
    auth_enabled = settings.require_api_key or settings.app_env == "production" or bool(settings.app_api_key)
    if not auth_enabled:
        return

    if not settings.app_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API authentication is enabled but APP_API_KEY is not configured",
        )

    token = x_api_key
    if not token and authorization:
        scheme, _, value = authorization.partition(" ")
        if scheme.lower() == "bearer":
            token = value

    if not token or not secrets.compare_digest(token, settings.app_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
