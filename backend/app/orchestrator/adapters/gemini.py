from __future__ import annotations
import json
from typing import Any

from google import genai
from google.genai import types

from app.orchestrator.adapters.base import BaseLLMAdapter, FunctionCall, LLMTurn
from app.orchestrator.prompts import SYSTEM_PROMPT
from app.utils.logger import get_logger

log = get_logger("adapter.gemini")

_MAX_HISTORY_TURNS = 10
_MAX_HISTORY_CHARS = 10_000


class GeminiAdapter(BaseLLMAdapter):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = genai.Client(api_key=api_key)
        self._model = model

    def build_messages(self, question: str, history: list[dict]) -> list[types.Content]:
        contents: list[types.Content] = []
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
            if role == "user":
                contents.append(types.Content(role="user", parts=[types.Part(text=msg["content"])]))
            elif role == "assistant":
                contents.append(types.Content(role="model", parts=[types.Part(text=msg["content"])]))

        contents.append(types.Content(role="user", parts=[types.Part(text=question)]))
        return contents

    def build_tools(self, tool_definitions: list[dict]) -> list[types.Tool]:
        declarations = [
            types.FunctionDeclaration(
                name=t["name"],
                description=t["description"],
                parameters=t["input_schema"],
            )
            for t in tool_definitions
        ]
        return [types.Tool(function_declarations=declarations)]

    def generate(self, messages: list, tools: list) -> LLMTurn:
        response = self._client.models.generate_content(
            model=self._model,
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                tools=tools,
            ),
        )
        content = response.candidates[0].content
        fc_parts = [p for p in content.parts if p.function_call]

        if fc_parts:
            calls = [
                FunctionCall(name=p.function_call.name, args=dict(p.function_call.args or {}))
                for p in fc_parts
            ]
            return LLMTurn(function_calls=calls, text="", _raw=content)

        text = "".join(p.text for p in content.parts if p.text).strip()
        return LLMTurn(function_calls=[], text=text, _raw=content)

    def append_model_turn(self, messages: list, turn: LLMTurn) -> None:
        messages.append(turn._raw)

    def append_tool_results(
        self,
        messages: list,
        calls: list[FunctionCall],
        results: list[str],
    ) -> None:
        parts = [
            types.Part(
                function_response=types.FunctionResponse(
                    name=call.name,
                    response={"result": result},
                )
            )
            for call, result in zip(calls, results)
        ]
        messages.append(types.Content(role="user", parts=parts))
