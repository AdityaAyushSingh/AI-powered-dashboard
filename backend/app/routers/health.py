from __future__ import annotations
from fastapi import APIRouter
from app.models.schemas import HealthResponse
from app.config import get_settings
from app.utils.logger import get_logger

router = APIRouter(tags=["health"])
log = get_logger("router.health")
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    db_status = "ok"
    vector_status = "ok"

    try:
        from app.db.database import engine
        with engine.connect():
            pass
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"

    try:
        from pathlib import Path
        import chromadb
        chroma_dir = Path(settings.chroma_persist_dir)
        if chroma_dir.exists():
            client = chromadb.PersistentClient(path=str(chroma_dir))
            collections = client.list_collections()
            vector_status = f"ok ({len(collections)} collections)"
        else:
            vector_status = "not initialised"
    except Exception as e:
        vector_status = f"error: {str(e)[:100]}"

    return HealthResponse(
        status="healthy" if db_status == "ok" else "degraded",
        db=db_status,
        vector_store=vector_status,
        ai_model=settings.ai_model,
    )
