from __future__ import annotations
from app.orchestrator.adapters.base import BaseLLMAdapter, FunctionCall, LLMTurn


def get_adapter(provider: str, api_key: str, model: str) -> BaseLLMAdapter:
    if provider == "gemini":
        from app.orchestrator.adapters.gemini import GeminiAdapter
        return GeminiAdapter(api_key=api_key, model=model)
    if provider == "groq":
        from app.orchestrator.adapters.groq import GroqAdapter
        return GroqAdapter(api_key=api_key, model=model)
    raise ValueError(f"Unknown AI provider '{provider}'. Supported: gemini, groq")


__all__ = ["BaseLLMAdapter", "FunctionCall", "LLMTurn", "get_adapter"]
