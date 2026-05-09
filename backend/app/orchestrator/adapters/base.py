from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class FunctionCall:
    name: str
    args: dict


@dataclass
class LLMTurn:
    function_calls: list[FunctionCall]
    text: str
    _raw: Any = field(default=None, repr=False)


class BaseLLMAdapter(ABC):
    """Common interface every LLM provider adapter must implement."""

    @abstractmethod
    def build_messages(self, question: str, history: list[dict]) -> list:
        """Build the initial conversation list from chat history and the new question."""

    @abstractmethod
    def build_tools(self, tool_definitions: list[dict]) -> list:
        """Convert the tool registry format into the provider-specific schema."""

    @abstractmethod
    def generate(self, messages: list, tools: list) -> LLMTurn:
        """Call the provider API and return a normalised LLMTurn."""

    @abstractmethod
    def append_model_turn(self, messages: list, turn: LLMTurn) -> None:
        """Append the model's raw response to the conversation in-place."""

    @abstractmethod
    def append_tool_results(
        self,
        messages: list,
        calls: list[FunctionCall],
        results: list[str],
    ) -> None:
        """Append tool results to the conversation in-place."""
