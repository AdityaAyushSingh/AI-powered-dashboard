from __future__ import annotations
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.models.schemas import ChatRequest, ChatResponse
from app.orchestrator.agent import run_agent
from app.utils.security import validate_user_input
from app.utils.logger import get_logger

router = APIRouter(prefix="/api", tags=["chat"])
log = get_logger("router.chat")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request, body: ChatRequest) -> ChatResponse:
    try:
        question = validate_user_input(body.question)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    history = [{"role": m.role, "content": m.content} for m in body.history]

    log.info("Chat request received",
             question_len=len(question),
             history_len=len(history),
             client_ip=request.client.host if request.client else "unknown")

    try:
        response = run_agent(
            question=question,
            history=history,
            filters=body.filters,
        )
    except Exception as e:
        log.error("Agent error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

    return response
