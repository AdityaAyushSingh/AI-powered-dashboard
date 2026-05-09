from __future__ import annotations
import json

from groq import Groq

from app.orchestrator.adapters.base import BaseLLMAdapter, FunctionCall, LLMTurn
from app.orchestrator.prompts import SYSTEM_PROMPT
from app.utils.logger import get_logger

log = get_logger("adapter.groq")

_MAX_HISTORY_TURNS = 10
_MAX_HISTORY_CHARS = 10_000

# Default model known to support function calling on Groq
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"


class GroqAdapter(BaseLLMAdapter):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = Groq(api_key=api_key)
        self._model = model or DEFAULT_GROQ_MODEL

    def build_messages(self, question: str, history: list[dict]) -> list[dict]:
        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

        valid: list[dict] = []
        chars = 0
        for msg in reversed(history[-_MAX_HISTORY_TURNS:]):
            n = len(msg.get("content", ""))
            if chars + n > _MAX_HISTORY_CHARS:
                break
            chars += n
            valid.insert(0, msg)

        for msg in valid:
            role = msg.get("role")
            if role in ("user", "assistant"):
                messages.append({"role": role, "content": msg["content"]})

        messages.append({"role": "user", "content": question})
        return messages

    def build_tools(self, tool_definitions: list[dict]) -> list[dict]:
        return [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t["description"],
                    "parameters": t["input_schema"],
                },
            }
            for t in tool_definitions
        ]

    def generate(self, messages: list, tools: list) -> LLMTurn:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )
        msg = response.choices[0].message

        if msg.tool_calls:
            calls = [
                FunctionCall(
                    name=tc.function.name,
                    args=json.loads(tc.function.arguments or "{}"),
                )
                for tc in msg.tool_calls
            ]
            return LLMTurn(function_calls=calls, text="", _raw=msg)

        return LLMTurn(function_calls=[], text=(msg.content or "").strip(), _raw=msg)

    def append_model_turn(self, messages: list, turn: LLMTurn) -> None:
        msg = turn._raw
        entry: dict = {"role": "assistant", "content": msg.content or ""}
        if msg.tool_calls:
            entry["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in msg.tool_calls
            ]
        messages.append(entry)

    def append_tool_results(
        self,
        messages: list,
        calls: list[FunctionCall],
        results: list[str],
    ) -> None:
        raw_msg = None
        # Find the last assistant message to get tool_call ids
        for m in reversed(messages):
            if m.get("role") == "assistant" and m.get("tool_calls"):
                raw_msg = m
                break

        for i, (call, result) in enumerate(zip(calls, results)):
            tool_call_id = (
                raw_msg["tool_calls"][i]["id"]
                if raw_msg and i < len(raw_msg["tool_calls"])
                else f"call_{i}"
            )
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": result,
            })
