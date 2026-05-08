from __future__ import annotations
"""
StreamVision Insights Assistant — FastAPI application entrypoint.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.config import get_settings
from app.utils.logger import configure_logging, get_logger
from app.routers import chat, insights, health

settings = get_settings()
configure_logging()
log = get_logger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Starting StreamVision Insights Assistant", env=settings.app_env)

    # Run data setup on startup if not already done
    try:
        from app.ingestion.seed_db import seed
        seed(force=False)
    except Exception as e:
        log.warning("Seed skipped or failed", error=str(e))

    try:
        from app.ingestion.generate_pdfs import generate_all
        from pathlib import Path
        if not any(Path(settings.pdf_data_dir).glob("*.pdf")):
            generate_all()
    except Exception as e:
        log.warning("PDF generation skipped or failed", error=str(e))

    try:
        from app.ingestion.ingest_documents import ingest
        ingest(force=False)
    except Exception as e:
        log.warning("Document ingestion skipped or failed", error=str(e))

    log.info("Startup complete")
    yield
    log.info("Shutdown complete")


app = FastAPI(
    title="StreamVision Insights Assistant",
    description="Secure multi-source AI analytics for an entertainment company.",
    version="1.0.0",
    lifespan=lifespan,
    # Disable auto-generated docs in production
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(health.router)
app.include_router(chat.router)
app.include_router(insights.router)


@app.get("/")
async def root():
    return {"service": "StreamVision Insights Assistant", "status": "running", "version": "1.0.0"}
